import { ok, fail, withAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { reviews, orders } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * POST /api/customer/reviews
 * Submits a new review for a delivered order.
 * Status defaults to 'inactive' for moderation.
 */
export async function POST(req: Request) {
  return withAuth(req, async (user) => {
    try {
      const body = await req.json().catch(() => ({}));
      const { orderId, rating, comment } = body;

      if (!orderId || rating === undefined) {
        return fail("Order ID and rating are required.", 400);
      }

      const numericRating = parseInt(rating);
      if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
        return fail("Rating must be an integer between 1 and 5.", 400);
      }

      if (comment && comment.length > 500) {
        return fail("Comment cannot exceed 500 characters.", 400);
      }

      // 1. Verify order exists, belongs to user, and is DELIVERED
      const [order] = await db
        .select()
        .from(orders)
        .where(
          and(
            eq(orders.id, orderId),
            eq(orders.userId, user.id)
          )
        )
        .limit(1);

      if (!order) {
        return fail("Order not found or does not belong to you.", 404);
      }

      if (order.status !== "DELIVERED") {
        return fail("You can only review orders that have been delivered.", 400);
      }

      // 2. Check if a review already exists for this order
      const [existingReview] = await db
        .select()
        .from(reviews)
        .where(eq(reviews.orderId, orderId))
        .limit(1);

      if (existingReview) {
        return fail("You have already reviewed this order.", 400);
      }

      // 3. Create the review (Safe-by-default status: 'inactive')
      const [newReview] = await db.insert(reviews).values({
        userId: user.id,
        restaurantId: order.restaurantId,
        orderId: order.id,
        rating: numericRating,
        comment: comment || null,
        status: "inactive",
      }).returning();

      return ok({ 
        review: newReview, 
        message: "Thank you! Your review has been submitted and is pending approval." 
      });

    } catch (err) {
      console.error("[api/customer/reviews POST]", err);
      return fail("An unexpected error occurred while submitting your review.", 500);
    }
  });
}
