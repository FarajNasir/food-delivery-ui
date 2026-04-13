import { ok, fail, withAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { orders, orderItems, cartItems, menuItems, restaurants, users, notifications } from "@/lib/db/schema";
import { eq, inArray, desc } from "drizzle-orm";
import { NotificationService } from "@/services/notification.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/orders
 * Creates one or more orders from the current user's cart.
 */
export async function POST(req: Request) {
  return withAuth(req, async (user) => {
    try {
      const userCartItems = await db
        .select({
          cartItemId: cartItems.id,
          menuItemId: cartItems.menuItemId,
          quantity: cartItems.quantity,
          price: menuItems.price,
          restaurantId: menuItems.restaurantId,
        })
        .from(cartItems)
        .innerJoin(menuItems, eq(cartItems.menuItemId, menuItems.id))
        .where(eq(cartItems.userId, user.id));

      if (userCartItems.length === 0) {
        return fail("Cart is empty", 400);
      }

      const itemsByRestaurant: Record<string, typeof userCartItems> = {};
      userCartItems.forEach((item) => {
        if (!itemsByRestaurant[item.restaurantId]) {
          itemsByRestaurant[item.restaurantId] = [];
        }
        itemsByRestaurant[item.restaurantId].push(item);
      });

      const {
        deliveryAddress,
        deliveryArea,
        deliveryFee,
        distanceMiles,
        customerPhone
      } = await req.json().catch(() => ({}));

      const createdOrders = await db.transaction(async (tx) => {
        const ordersList = [];
        for (const [restaurantId, items] of Object.entries(itemsByRestaurant)) {
          const totalAmount = items.reduce((sum, item) => {
            return sum + (parseFloat(item.price as string) * item.quantity);
          }, 0);

          const [newOrder] = await tx.insert(orders).values({
            userId: user.id,
            restaurantId,
            totalAmount: totalAmount.toFixed(2),
            deliveryFee: deliveryFee ? deliveryFee.toFixed(2) : "0.00",
            deliveryAddress,
            deliveryArea,
            distanceMiles: distanceMiles ? distanceMiles.toFixed(4) : null,
            customerPhone,
            status: "PENDING_CONFIRMATION",
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

        const cartItemIds = userCartItems.map(i => i.cartItemId);
        await tx.delete(cartItems).where(inArray(cartItems.id, cartItemIds));

        return ordersList;
      });

      // --- Notification Logic (Outside Transaction) ---
      for (const newOrder of createdOrders) {
        try {
          const [restaurant] = await db
            .select({ ownerId: restaurants.ownerId, name: restaurants.name })
            .from(restaurants)
            .where(eq(restaurants.id, newOrder.restaurantId))
            .limit(1);

          if (restaurant) {
            const [owner] = await db
              .select({ lastActive: users.lastActive })
              .from(users)
              .where(eq(users.id, restaurant.ownerId))
              .limit(1);

            const isActive = owner?.lastActive && (Date.now() - new Date(owner.lastActive).getTime() < 60000);

            const [newNotification] = await db.insert(notifications).values({
              recipientId: restaurant.ownerId,
              type: "ORDER",
              subject: "New Order Received!",
              body: `Order #${newOrder.id.slice(0, 8)} for ${restaurant.name} has been placed.`,
              channel: isActive ? "FCM" : "WHATSAPP",
              status: "PENDING",
              metadata: { orderId: newOrder.id, orderStatus: "PENDING_CONFIRMATION" }
            }).returning();

            if (newNotification && newNotification.channel === "FCM") {
              NotificationService.trigger(newNotification.id);
            }
          }
        } catch (notifyErr) {
          console.error("Failed to queue notification:", notifyErr);
        }
      }
      // --------------------------

      return ok({ orders: createdOrders });
    } catch (err) {
      console.error("[api/orders POST]", err);
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
      // Step 1: fetch orders + restaurant name
      const orderRows = await db
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
          createdAt: orders.createdAt,
          updatedAt: orders.updatedAt,
        })
        .from(orders)
        .innerJoin(restaurants, eq(orders.restaurantId, restaurants.id))
        .where(eq(orders.userId, user.id))
        .orderBy(desc(orders.createdAt));

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
        totalAmount: order.totalAmount,
        deliveryFee: order.deliveryFee,
        deliveryAddress: order.deliveryAddress,
        deliveryArea: order.deliveryArea,
        customerPhone: order.customerPhone,
        currency: order.currency,
        paymentIntentId: order.paymentIntentId,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        restaurant: { name: order.restaurantName },
        items: itemRows
          .filter((i) => i.orderId === order.id)
          .map((i) => ({
            id: i.id,
            quantity: i.quantity,
            price: i.price,
            menuItem: { id: i.menuItemId, name: i.itemName, imageUrl: i.itemImageUrl },
          })),
      }));

      return ok({ orders: result });
    } catch (err) {
      console.error("[api/orders GET]", err);
      return fail("Failed to fetch orders.", 500);
    }
  });
}
