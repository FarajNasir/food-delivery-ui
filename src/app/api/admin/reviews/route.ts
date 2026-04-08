import { db } from "@/lib/db";
import { reviews } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { ok, fail, withAuth } from "@/lib/proxy";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/reviews
 * Returns all reviews with restaurant and user details for moderation.
 */
export async function GET(req: Request) {
  return withAuth(
    req,
    async () => {
      try {
        const allReviews = await db.query.reviews.findMany({
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                email: true,
              },
            },
            restaurant: {
              columns: {
                id: true,
                name: true,
              },
            },
            order: {
              columns: {
                id: true,
                status: true,
                totalAmount: true,
              }
            }
          },
          orderBy: [desc(reviews.createdAt)],
        });

        return ok({ reviews: allReviews });
      } catch (error: any) {
        console.error("[AdminReviews GET Error]:", error);
        return fail("Failed to fetch reviews.", 500);
      }
    },
    ["admin"]
  );
}
