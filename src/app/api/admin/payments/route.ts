import { ok, fail, withAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { orders, restaurants, settlements } from "@/lib/db/schema";
import { eq, and, sql, sum, count, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/payments
 * Fetches an overview of all restaurants with their financial summary.
 */
export async function GET(req: Request) {
  return withAuth(req, async () => {
    try {
      // 1. Fetch total earnings per restaurant (from PAID orders)
      const restaurantEarnings = await db
        .select({
          restaurantId: orders.restaurantId,
          totalEarned: sum(orders.totalAmount),
          orderCount: sql<number>`CAST(count(${orders.id}) FILTER (WHERE ${orders.isSettled} = 'NO') AS INT)`,
        })
        .from(orders)
        .where(inArray(orders.status, ["PAID", "DELIVERED"]))
        .groupBy(orders.restaurantId);

      // 2. Fetch total settlements per restaurant
      const restaurantSettlements = await db
        .select({
          restaurantId: settlements.restaurantId,
          totalSettled: sum(settlements.amount),
        })
        .from(settlements)
        .groupBy(settlements.restaurantId);

      // 3. Fetch all restaurants
      const allRestaurants = await db
        .select({
          id: restaurants.id,
          name: restaurants.name,
          logoUrl: restaurants.logoUrl,
        })
        .from(restaurants);

      // 4. Combine data
      const summaryLookup = new Map(restaurantEarnings.map(s => [s.restaurantId, s]));
      const settlementLookup = new Map(restaurantSettlements.map(s => [s.restaurantId, s]));

      const result = allRestaurants.map(r => {
        const stats = summaryLookup.get(r.id);
        const settled = settlementLookup.get(r.id);

        const totalOrderAmount = parseFloat(stats?.totalEarned || "0");
        const totalPaid = parseFloat(settled?.totalSettled || "0");
        
        const totalEarned = totalOrderAmount;
        const pendingBalance = totalEarned - totalPaid;

        return {
          ...r,
          totalOrderAmount,
          totalEarned,
          totalPaid,
          pendingBalance,
          orderCount: stats?.orderCount || 0,
        };
      });

      const platformStats = result.reduce((acc, curr) => {
        acc.totalPendingPayouts += curr.pendingBalance;
        return acc;
      }, { totalPendingPayouts: 0 });

      // Calculate total platform revenue from all PAID/DELIVERED orders
      const serviceCharges = await db
        .select({
          total: sum(orders.serviceCharge)
        })
        .from(orders)
        .where(inArray(orders.status, ["PAID", "DELIVERED"]));

      const totalPlatformRevenue = parseFloat(serviceCharges[0]?.total || "0");

      return ok({
        restaurants: result,
        platformSummary: {
          ...platformStats,
          totalPlatformRevenue,
        }
      });
    } catch (err: any) {

      console.error("[api/admin/payments GET]", err);
      return fail("Failed to fetch payment summary.", 500);
    }
  }, ["admin"]);
}
