import { ok, fail } from "@/lib/proxy";
import { db } from "@/lib/db";
import { restaurants, menuItems } from "@/lib/db/schema";
import { eq, and, SQL, sql, ilike } from "drizzle-orm";

/* ── GET /api/restaurants ── */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const location = searchParams.get("location");
    const category = searchParams.get("category");

    if (!location) return fail("Location is required.", 400);

    const conditions: SQL[] = [
      ilike(restaurants.location, location),
      eq(restaurants.status, "active"),
    ];

    let query = db
      .select({
        id:            restaurants.id,
        name:          restaurants.name,
        location:      restaurants.location,
        logoUrl:       restaurants.logoUrl,
        contactEmail:  restaurants.contactEmail,
        contactPhone:  restaurants.contactPhone,
      })
      .from(restaurants);

    if (category) {
      // Join with menuItems to find restaurants that have at least one dish in this category
      query = query
        .innerJoin(menuItems, eq(restaurants.id, menuItems.restaurantId))
        .where(and(...conditions, ilike(menuItems.category, category)))
        .groupBy(restaurants.id) as any;
    } else {
      query = query.where(and(...conditions)) as any;
    }

    const rows = await query;

    return ok({ items: rows });
  } catch (err) {
    console.error("[api/restaurants GET]", err);
    return fail("Failed to load restaurants.", 500);
  }
}
