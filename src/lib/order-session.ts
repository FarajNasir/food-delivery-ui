import { db } from "./db";
import { orders, orderSessions } from "./db/schema";
import { eq, and } from "drizzle-orm";

/**
 * syncSessionStatus - Aggregates sub-order statuses and updates the parent session.
 * 
 * Logic:
 * 1. Fetch all sibling orders in the session.
 * 2. If ALL have responded (status != PENDING_CONFIRMATION):
 *    - Calculate total amount of ACCEPTED items.
 *    - Calculate total delivery fee of ACCEPTED restaurants.
 *    - Update session status to READY_TO_PAY (if any accepted) or CANCELLED (if all rejected).
 */
export async function syncSessionStatus(sessionId: string) {
  try {
    const siblingOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.sessionId, sessionId));

    if (siblingOrders.length === 0) return;

    // Check if everyone has responded
    const allResponded = siblingOrders.every(o => 
      o.status !== "PENDING_CONFIRMATION"
    );

    if (!allResponded) {
      console.log(`[SessionSync] Session ${sessionId} still waiting for responses.`);
      return;
    }

    // Identify accepted orders
    const acceptedOrders = siblingOrders.filter(o => 
      !["CANCELLED", "PENDING_CONFIRMATION"].includes(o.status)
    );

    const totalItems = acceptedOrders.reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);
    const totalDelivery = acceptedOrders.reduce((sum, o) => sum + parseFloat(o.deliveryFee), 0);
    const totalMiles = acceptedOrders.reduce((sum, o) => sum + (o.distanceMiles ? parseFloat(o.distanceMiles as string) : 0), 0);

    let sessionStatus: any = "READY_TO_PAY";
    if (acceptedOrders.length === 0) {
      sessionStatus = "CANCELLED";
    }

    console.log(`[SessionSync] Session ${sessionId} aggregation complete. Status: ${sessionStatus}, Total: £${(totalItems + totalDelivery).toFixed(2)}`);

    await db.update(orderSessions)
      .set({
        status: sessionStatus,
        totalItemsAmount: totalItems.toFixed(2),
        totalDeliveryFee: totalDelivery.toFixed(2),
        distanceMiles: totalMiles > 0 ? totalMiles.toFixed(4) : null,
        updatedAt: new Date()
      })
      .where(eq(orderSessions.id, sessionId));

  } catch (error) {
    console.error(`[SessionSync] Error syncing session ${sessionId}:`, error);
  }
}
