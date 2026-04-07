import { ok, fail } from "@/lib/proxy";
import { db } from "@/lib/db";
import { orders, orderItems, cartItems, menuItems, restaurants, users, notifications } from "@/lib/db/schema";
import { eq, inArray, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
export const dynamic = "force-dynamic";

/**
 * POST /api/orders
 * Creates one or more orders from the current user's cart.
 */
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Unauthorized", 401);

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

    const createdOrders = [];

    const { 
      deliveryAddress, 
      deliveryArea, 
      deliveryFee, 
      distanceMiles,
      customerPhone
    } = await req.json().catch(() => ({}));

    for (const [restaurantId, items] of Object.entries(itemsByRestaurant)) {
      const totalAmount = items.reduce((sum, item) => {
        return sum + (parseFloat(item.price as string) * item.quantity);
      }, 0);

      const [newOrder] = await db.insert(orders).values({
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

      await db.insert(orderItems).values(
        items.map(item => ({
          orderId: newOrder.id,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          price: (parseFloat(item.price as string)).toFixed(2),
        }))
      );

      // --- Notification Logic ---
      try {
        const [restaurant] = await db
          .select({ ownerId: restaurants.ownerId, name: restaurants.name })
          .from(restaurants)
          .where(eq(restaurants.id, restaurantId))
          .limit(1);

        if (restaurant) {
          const [owner] = await db
            .select({ lastActive: users.lastActive })
            .from(users)
            .where(eq(users.id, restaurant.ownerId))
            .limit(1);

          const isActive = owner?.lastActive && (Date.now() - new Date(owner.lastActive).getTime() < 60000);

          await db.insert(notifications).values({
            recipientId: restaurant.ownerId,
            type: "ORDER",
            subject: "New Order Received!",
            body: `Order #${newOrder.id.slice(0, 8)} for ${restaurant.name} has been placed.`,
            channel: isActive ? "FCM" : "WHATSAPP",
            status: "PENDING",
            metadata: { orderId: newOrder.id }
          });
        }
      } catch (notifyErr) {
        console.error("Failed to queue notification:", notifyErr);
        // Don't fail the order if notification fails
      }
      // --------------------------

      createdOrders.push(newOrder);
    }

    const cartItemIds = userCartItems.map(i => i.cartItemId);
    await db.delete(cartItems).where(inArray(cartItems.id, cartItemIds));

    return ok({ orders: createdOrders });
  } catch (err) {
    console.error("[api/orders POST]", err);
    return fail("Failed to create orders.", 500);
  }
}

/**
 * GET /api/orders
 * Fetches all orders for the current customer with restaurant and item details.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Unauthorized", 401);

    // Fetch orders for customer using query API (with relations)
    const results = await db.query.orders.findMany({
      where: eq(orders.userId, user.id),
      with: {
        restaurant: true,
        items: {
          with: {
            menuItem: true
          }
        }
      },
      orderBy: [desc(orders.createdAt)]
    });

    return ok({ orders: results });
  } catch (err) {
    console.error("[api/orders GET]", err);
    return fail("Failed to fetch orders.", 500);
  }
}
