import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { sql, desc, ne, and, eq, gte, lte } from "drizzle-orm";
import { ok, fail, withAuth } from "@/lib/proxy";

/**
 * GET /api/admin/orders
 * Returns filtered platform orders with stats for admin dashboard.
 */
export async function GET(req: Request) {
  return withAuth(
    req,
    async () => {
      try {
        const { searchParams } = new URL(req.url);
        const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
        const offset = parseInt(searchParams.get("offset") || "0");
        const status = searchParams.get("status");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        // 1. Build dynamic filters
        const conditions = [];
        if (status) {
          conditions.push(eq(orders.status, status as any));
        }
        if (startDate) {
          conditions.push(gte(orders.createdAt, new Date(startDate)));
        }
        if (endDate) {
          conditions.push(lte(orders.createdAt, new Date(endDate)));
        }

        const filterCondition = conditions.length > 0 ? and(...conditions) : undefined;

        // 2. Fetch stats, count, and data in PARALLEL
        const [statsRes, [{ count: totalCount }], allOrders] = await Promise.all([
          // A. Aggregate stats
          db.select({
            totalRevenue: sql<string>`COALESCE(SUM(${orders.totalAmount}), 0)`,
            totalOrders: sql<number>`CAST(COUNT(*) AS INT)`,
            pendingOrders: sql<number>`CAST(COUNT(*) FILTER (WHERE ${orders.status} = 'PENDING_CONFIRMATION') AS INT)`,
          })
          .from(orders)
          .where(ne(orders.status, "CANCELLED")),

          // B. Count for pagination
          db.select({ count: sql<number>`CAST(COUNT(*) AS INT)` })
          .from(orders)
          .where(filterCondition),

          // C. Detailed order list
          db.query.orders.findMany({
            where: filterCondition,
            with: {
              user: { columns: { id: true, name: true, email: true, phone: true } },
              restaurant: { columns: { id: true, name: true } },
              items: { with: { menuItem: { columns: { name: true } } } },
            },
            orderBy: [desc(orders.createdAt)],
            limit: limit,
            offset: offset,
          })
        ]);

        const stats = statsRes[0] || { totalRevenue: "0", totalOrders: 0, pendingOrders: 0 };

        return ok({
          orders: allOrders,
          stats: {
            totalRevenue: stats.totalRevenue || "0.00",
            totalOrders: stats.totalOrders || 0,
            pendingOrders: stats.pendingOrders || 0,
          },
          pagination: {
            total: totalCount,
            limit,
            offset,
          }
        });
      } catch (error: any) {
        console.error("[AdminOrders API Error]:", error);
        return fail(error.message || "Failed to fetch platform orders.", 500);
      }
    },
    ["admin"]
  );
}
