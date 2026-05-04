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
      eq(restaurants.isActive, true),
    ];

    let query = db
      .select({
        id:            restaurants.id,
        name:          restaurants.name,
        location:      restaurants.location,
        logoUrl:       restaurants.logoUrl,
        contactEmail:  restaurants.contactEmail,
        contactPhone:  restaurants.contactPhone,
        openingHours:  restaurants.openingHours,
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

    return new Response(JSON.stringify({ data: { items: rows } }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (err) {
    console.error("[api/restaurants GET]", err);
    return fail("Failed to load restaurants.", 500);
  }
}
