import { db } from "@/lib/db";
import { reviews, users, restaurants } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
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
        const allReviews = await db
          .select({
            id: reviews.id,
            rating: reviews.rating,
            comment: reviews.comment,
            status: reviews.status,
            createdAt: reviews.createdAt,
            user: {
              id: users.id,
              name: users.name,
              email: users.email,
            },
            restaurant: {
              id: restaurants.id,
              name: restaurants.name,
            },
          })
          .from(reviews)
          .leftJoin(users, eq(reviews.userId, users.id))
          .innerJoin(restaurants, eq(reviews.restaurantId, restaurants.id))
          .orderBy(desc(reviews.createdAt));

        return ok({ reviews: allReviews });
      } catch (error: any) {
        console.error("[AdminReviews GET Error]:", error);
        return fail("Failed to fetch reviews.", 500);
      }
    },
    ["admin"]
  );
}
