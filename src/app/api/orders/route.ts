import { ok, fail, withAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { orders, orderItems, cartItems, menuItems, restaurants, orderSessions } from "@/lib/db/schema";
import { eq, inArray, desc, sql, and } from "drizzle-orm";
import { NotificationService } from "@/services/notification.service";
import { SITES, DEFAULT_SITE } from "@/config/sites";
import { isRestaurantOpen } from "@/lib/utils/restaurantUtils";

function getSiteFromLocation(location: string | null) {
  if (!location) return SITES[DEFAULT_SITE];
  const normalized = location.trim().toLowerCase();
  const match = Object.values(SITES).find(
    (s) => s.location.trim().toLowerCase() === normalized
  );
  return match ?? SITES[DEFAULT_SITE];
}

export const dynamic = "force-dynamic";

/**
 * POST /api/orders
 * Creates one or more orders from the current user's cart.
 */
export async function POST(req: Request) {
  return withAuth(req, async (user) => {
    try {
      const {
        deliveryAddress,
        deliveryArea,
        deliveryFee,
        distanceMiles,
        customerPhone,
        deliveryFeesBreakdown // New field from frontend: { [restaurantId]: fee }
      } = await req.json().catch(() => ({}));

      // Validate or fallback for deliveryFeesBreakdown
      const fees = deliveryFeesBreakdown || {};

      const createdOrders = await db.transaction(async (tx) => {
        // 1. Atomically delete items and capture the original data
        const deletedCartItems = await tx.delete(cartItems)
          .where(eq(cartItems.userId, user.id))
          .returning();

        if (deletedCartItems.length === 0) {
          throw new Error("CART_EMPTY");
        }

        // 2. Fetch the corresponding menu items to get prices and restaurantIds
        const itemIds = deletedCartItems.map(i => i.menuItemId);
        const menuDetails = await tx.select({
          id: menuItems.id,
          price: menuItems.price,
          restaurantId: menuItems.restaurantId
        }).from(menuItems).where(inArray(menuItems.id, itemIds));

        // Create a lookup map for menu details
        const menuLookup = new Map(menuDetails.map(m => [m.id, m]));

        // 3. Assemble the complete payload
        const userCartItems = deletedCartItems.map(item => {
          const info = menuLookup.get(item.menuItemId);
          if (!info) throw new Error("INVALID_MENU_ITEM");
          return {
            cartItemId: item.id,
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: info.price,
            restaurantId: info.restaurantId
          };
        });

        // 1. Group by restaurant as before
        const itemsByRestaurant: Record<string, typeof userCartItems> = {};
        userCartItems.forEach((item) => {
          if (!itemsByRestaurant[item.restaurantId]) {
            itemsByRestaurant[item.restaurantId] = [];
          }
          itemsByRestaurant[item.restaurantId].push(item);
        });

        // 2. Create the parent Session
        const [session] = await tx.insert(orderSessions).values({
          userId: user.id,
          status: "PENDING",
          totalItemsAmount: "0.00", // Will update or calculate
          totalDeliveryFee: deliveryFee ? deliveryFee.toFixed(2) : "0.00",
          totalServiceCharge: "0.00", // Will update
          deliveryAddress,
          deliveryArea,
          distanceMiles: distanceMiles ? distanceMiles.toFixed(4) : null,
          customerPhone,
        }).returning();

        // 3. Fetch restaurants to get financial settings
        const restaurantIds = Object.keys(itemsByRestaurant);
        const restaurantsData = await tx.select({
          id: restaurants.id,
          name: restaurants.name,
          location: restaurants.location,
          openingHours: restaurants.openingHours,
        }).from(restaurants).where(inArray(restaurants.id, restaurantIds));

        const restaurantLookup = new Map(restaurantsData.map(r => [r.id, r]));

        const ordersList = [];
        let sessionTotalItems = 0;
        let sessionTotalServiceCharge = 0;

        for (const [restaurantId, items] of Object.entries(itemsByRestaurant)) {
          const restaurant = restaurantLookup.get(restaurantId);
          if (!restaurant) throw new Error("RESTAURANT_NOT_FOUND");

          // 3.5 Validate Restaurant Operational Hours
          if (!isRestaurantOpen(restaurant.openingHours)) {
            throw new Error(`RESTAURANT_CLOSED:${restaurant.name}`);
          }

          const site = getSiteFromLocation(restaurant.location);
          const serviceCharge = site.serviceCharge ?? 0;
          sessionTotalServiceCharge += serviceCharge;

          const itemTotal = items.reduce((sum, item) => {
            return sum + (parseFloat(item.price as string) * item.quantity);
          }, 0);


          const finalTotalAmount = itemTotal;

          sessionTotalItems += itemTotal;

          // If breakdown exists, use it. Otherwise split evenly (Option B fallback)
          const restaurantFee = fees[restaurantId]
            || (deliveryFee / Object.keys(itemsByRestaurant).length);

          const [newOrder] = await tx.insert(orders).values({
            userId: user.id,
            restaurantId,
            sessionId: session.id,
            totalAmount: finalTotalAmount.toFixed(2),
            deliveryFee: restaurantFee.toFixed(2),
            serviceCharge: serviceCharge.toFixed(2),
            deliveryAddress,
            deliveryArea,
            distanceMiles: distanceMiles ? (distanceMiles / Object.keys(itemsByRestaurant).length).toFixed(4) : null,
            customerPhone,
            status: "PENDING_CONFIRMATION",
            isSettled: "NO",
            restaurantNameSnapshot: restaurant.name,
          }).returning();

          await tx.insert(orderItems).values(
            items.map(item => ({
              orderId: newOrder.id,
              menuItemId: item.menuItemId,
              quantity: item.quantity,
              price: (parseFloat(item.price as string)).toFixed(2),
            }))
          );

          ordersList.push(newOrder);
        }

        // Update session with correct item total and service charge
        await tx.update(orderSessions)
          .set({ 
            totalItemsAmount: sessionTotalItems.toFixed(2),
            totalServiceCharge: sessionTotalServiceCharge.toFixed(2)
          })
          .where(eq(orderSessions.id, session.id));

        return { orders: ordersList, sessionId: session.id };
      });

      // --- Notification Logic (Background) ---
      (async () => {
        try {
          await Promise.all(
            createdOrders.orders.map(async (newOrder) => {
              const [[restaurant], itemsRows] = await Promise.all([
                db
                  .select({ ownerId: restaurants.ownerId, name: restaurants.name })
                  .from(restaurants)
                  .where(eq(restaurants.id, newOrder.restaurantId))
                  .limit(1),
                db
                  .select({
                    name: menuItems.name,
                    quantity: orderItems.quantity,
                    price: orderItems.price,
                  })
                  .from(orderItems)
                  .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
                  .where(eq(orderItems.orderId, newOrder.id)),
              ]);

              if (restaurant) {
                const itemsSummary = itemsRows.map(i => `${i.quantity}x ${i.name}`).join("\n");
                const totalAmount = newOrder.totalAmount;

                const ownerBody = `New Order Received!\n\nOrder #${newOrder.id.slice(0, 8)}\nItems:\n${itemsSummary}\n\nTotal: £${totalAmount}\n\nAddress: ${newOrder.deliveryAddress}`;
                const customerBody = `Your order #${newOrder.id.slice(0, 8)} from ${restaurant.name} has been received. We'll notify you when it's confirmed!`;

                // Dispatch Owner Notification immediately
                if (restaurant.ownerId) {
                  await NotificationService.dispatchOrderNotifications({
                    userId: restaurant.ownerId,
                    type: "ORDER",
                    subject: "New Order Received!",
                    body: ownerBody,
                    metadata: { orderId: newOrder.id, orderStatus: "PENDING_CONFIRMATION", targetRole: "owner" },
                    channels: ["FCM", "WHATSAPP"]
                  });
                }

                // Add a small delay for customer notification to ensure DB commit is visible 
                // when the frontend tries to fetch the order by ID immediately after FCM.
                if (newOrder.userId) {
                  await new Promise(resolve => setTimeout(resolve, 2000));
                  await NotificationService.dispatchOrderNotifications({
                    userId: newOrder.userId,
                    type: "ORDER",
                    subject: "Order Received! 🛍️",
                    body: customerBody,
                    metadata: { orderId: newOrder.id, orderStatus: "PENDING_CONFIRMATION", targetRole: "customer" },
                    channels: ["FCM", "WHATSAPP"]
                  });
                }
              }
            })
          );
        } catch (notifyErr) {
          console.error("[api/orders POST] Background notification error:", notifyErr);
        }
      })();

      console.log(`[api/orders POST] Order created for user ${user.id}`);
      return ok({ orders: createdOrders.orders, sessionId: createdOrders.sessionId });
    } catch (err: unknown) {
      console.error("[api/orders POST]", err);
      if (err instanceof Error && err.message === "CART_EMPTY") {
        return fail("Cart is empty", 400);
      }
      if (err instanceof Error && err.message.startsWith("RESTAURANT_CLOSED:")) {
        const name = err.message.split(":")[1];
        return fail(`${name} is currently closed and not accepting orders.`, 400);
      }
      return fail("Failed to create orders.", 500);
    }
  });
}

/**
 * GET /api/orders
 * Fetches all orders for the current customer with restaurant and item details.
 * Uses explicit joins instead of db.query relational layer for reliability.
 */
export async function GET(req: Request) {
  return withAuth(req, async (user) => {
    try {
      const { searchParams } = new URL(req.url);
      const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
      const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
      const scope = searchParams.get("scope") || "all";
      const offset = (page - 1) * limit;

      const activeStatuses = ["PENDING_CONFIRMATION", "CONFIRMED", "PAID", "PREPARING", "DISPATCH_REQUESTED", "OUT_FOR_DELIVERY"] as const;
      const pastStatuses = ["DELIVERED", "CANCELLED"] as const;
      const scopeCondition =
        scope === "active"
          ? and(eq(orders.userId, user.id), inArray(orders.status, [...activeStatuses]))
          : scope === "past"
            ? and(eq(orders.userId, user.id), inArray(orders.status, [...pastStatuses]))
            : eq(orders.userId, user.id);

      const totalCountQuery =
        scope === "active"
          ? db.select({ count: sql<number>`CAST(COUNT(*) AS INT)` }).from(orders).where(and(eq(orders.userId, user.id), inArray(orders.status, [...activeStatuses])))
          : scope === "past"
            ? db.select({ count: sql<number>`CAST(COUNT(*) AS INT)` }).from(orders).where(and(eq(orders.userId, user.id), inArray(orders.status, [...pastStatuses])))
            : db.select({ count: sql<number>`CAST(COUNT(*) AS INT)` }).from(orders).where(eq(orders.userId, user.id));

      const [[{ count }], orderRows] = await Promise.all([
        totalCountQuery,
        db
          .select({
            id: orders.id,
            userId: orders.userId,
            restaurantId: orders.restaurantId,
            restaurantName: restaurants.name,
            status: orders.status,
            totalAmount: orders.totalAmount,
            deliveryFee: orders.deliveryFee,
            deliveryAddress: orders.deliveryAddress,
            deliveryArea: orders.deliveryArea,
            customerPhone: orders.customerPhone,
            currency: orders.currency,
            paymentIntentId: orders.paymentIntentId,
            sessionId: orders.sessionId,
            restaurantNameSnapshot: orders.restaurantNameSnapshot,
            createdAt: orders.createdAt,
            updatedAt: orders.updatedAt,
          })
          .from(orders)
          .innerJoin(restaurants, eq(orders.restaurantId, restaurants.id))
          .where(scopeCondition)
          .orderBy(
            sql`CASE WHEN ${orders.status} IN ('DELIVERED', 'CANCELLED') THEN 1 ELSE 0 END ASC`,
            desc(orders.createdAt)
          )
          .limit(limit)
          .offset(offset),
      ]);

      if (orderRows.length === 0) return ok({ orders: [] });

      // Step 2: fetch all order items for those orders in one query
      const orderIds = orderRows.map((o) => o.id);
      const itemRows = await db
        .select({
          id: orderItems.id,
          orderId: orderItems.orderId,
          menuItemId: orderItems.menuItemId,
          quantity: orderItems.quantity,
          price: orderItems.price,
          itemName: menuItems.name,
          itemImageUrl: menuItems.imageUrl,
        })
        .from(orderItems)
        .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
        .where(inArray(orderItems.orderId, orderIds));

      // Step 3: assemble
      const result = orderRows.map((order) => ({
        id: order.id,
        userId: order.userId,
        restaurantId: order.restaurantId,
        status: order.status,
        sessionId: order.sessionId,
        totalAmount: order.totalAmount,
        deliveryFee: order.deliveryFee,
        deliveryAddress: order.deliveryAddress,
        deliveryArea: order.deliveryArea,
        customerPhone: order.customerPhone,
        currency: order.currency,
        paymentIntentId: order.paymentIntentId,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        restaurant: { name: order.restaurantNameSnapshot || order.restaurantName },
        items: itemRows
          .filter((i) => i.orderId === order.id)
          .map((i) => ({
            id: i.id,
            quantity: i.quantity,
            price: i.price,
            menuItem: { id: i.menuItemId, name: i.itemName, imageUrl: i.itemImageUrl },
          })),
      }));

      return ok({
        orders: result,
        pagination: {
          total: count,
          page,
          limit
        }
      });
    } catch (err) {
      console.error("[api/orders GET]", err);
      return fail("Failed to fetch orders.", 500);
    }
  });
}
