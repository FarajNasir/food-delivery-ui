import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { sql, desc, ne } from "drizzle-orm";
import { ok, fail, withAuth } from "@/lib/proxy";

/**
 * GET /api/admin/orders
 * Returns all platform orders with stats for admin dashboard.
 */
export async function GET(req: Request) {
  return withAuth(
    req,
    async () => {
      try {
        // 1. Fetch aggregate stats
        const statsRes = await db
          .select({
            totalRevenue: sql<string>`COALESCE(SUM(${orders.totalAmount}), 0)`,
            totalOrders: sql<number>`CAST(COUNT(*) AS INT)`,
            pendingOrders: sql<number>`CAST(COUNT(*) FILTER (WHERE ${orders.status} = 'PENDING_CONFIRMATION') AS INT)`,
          })
          .from(orders)
          .where(ne(orders.status, "CANCELLED"));

        const stats = statsRes[0] || { totalRevenue: "0", totalOrders: 0, pendingOrders: 0 };

        // 2. Fetch detailed order list
        const allOrders = await db.query.orders.findMany({
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
            restaurant: {
              columns: {
                id: true,
                name: true,
              },
            },
            items: {
              with: {
                menuItem: {
                  columns: {
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: [desc(orders.createdAt)],
        });

        return ok({
          orders: allOrders,
          stats: {
            totalRevenue: stats.totalRevenue || "0.00",
            totalOrders: stats.totalOrders || 0,
            pendingOrders: stats.pendingOrders || 0,
          },
        });
      } catch (error: any) {
        console.error("[AdminOrders API Error]:", error);
        return fail(error.message || "Failed to fetch platform orders.", 500);
      }
    },
    ["admin"]
  );
}
