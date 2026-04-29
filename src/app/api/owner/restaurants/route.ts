import { ok, fail, withOwnerAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { restaurants, users } from "@/lib/db/schema";
import { eq, and, SQL, desc } from "drizzle-orm";

/**
 * GET /api/owner/restaurants
 * Fetches all restaurants for the current owner/admin.
 */
export async function GET(req: Request) {
  return withOwnerAuth(req, async (user) => {
    try {
      const conditions: SQL[] = [];
      
      // If it's an owner, they only see their own restaurants
      if (user.role === "owner") {
        conditions.push(eq(restaurants.ownerId, user.id));
      }
      // If it's an admin, they see everything (indicated by empty conditions)

      const rows = await db
        .select({
          id:            restaurants.id,
          name:          restaurants.name,
          location:      restaurants.location,
          logoUrl:       restaurants.logoUrl,
          contactEmail:  restaurants.contactEmail,
          contactPhone:  restaurants.contactPhone,
          openingHours:  restaurants.openingHours,
          ownerName:     users.name,
          status:        restaurants.status,
          deletionStatus: restaurants.deletionStatus,
          deletionRequestedAt: restaurants.deletionRequestedAt,
          deletionScheduledAt: restaurants.deletionScheduledAt,
          isActive:      restaurants.isActive,
          createdAt:     restaurants.createdAt,
        })
        .from(restaurants)
        .leftJoin(users, eq(restaurants.ownerId, users.id))
        .where(and(...conditions))
        .orderBy(desc(restaurants.createdAt));

      return ok({ items: rows });
    } catch (err) {
      console.error("[api/owner/restaurants GET]", err);
      return fail("Failed to load restaurants.", 500);
    }
  });
}
