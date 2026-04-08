import { db } from "@/lib/db";
import { reviews } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ok, fail, withAuth } from "@/lib/proxy";

/**
 * PATCH /api/admin/reviews/[id]
 * Updates a review status (active, inactive, ban).
 */
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  // 1. Explicitly await the params promise
  const params = await context.params;
  const reviewId = params.id;

  console.log(`[AdminReviews PATCH] Updating reviewId: ${reviewId}`);

  return withAuth(
    req,
    async () => {
      try {
        const body = await req.json().catch(() => ({}));
        const { status } = body;

        if (!status || !["active", "inactive", "ban"].includes(status)) {
          return fail("Invalid status value. Must be 'active', 'inactive', or 'ban'.", 400);
        }

        console.log(`[AdminReviews PATCH] Setting status: ${status} for ID: ${reviewId}`);

        const [updatedReview] = await db
          .update(reviews)
          .set({ 
            status,
            updatedAt: new Date(),
          })
          .where(eq(reviews.id, reviewId))
          .returning();

        if (!updatedReview) {
          console.error(`[AdminReviews PATCH] Review not found: ${reviewId}`);
          return fail("Review not found.", 404);
        }

        return ok({ 
          review: updatedReview, 
          message: `Review status successfully updated to ${status}.` 
        });
      } catch (error: any) {
        console.error("[AdminReviews PATCH Error]:", error);
        return fail(`Failed to update review status: ${error.message}`, 500);
      }
    },
    ["admin"]
  );
}
