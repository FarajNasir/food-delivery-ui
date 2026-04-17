import { ok, fail } from "@/lib/proxy";
import { db } from "@/lib/db";
import { restaurants, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/* ── GET /api/restaurants/[id] ── */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const [restaurant] = await db
      .select({
        id: restaurants.id,
        name: restaurants.name,
        location: restaurants.location,
        logoUrl: restaurants.logoUrl,
        ownerId: restaurants.ownerId,
        contactEmail: restaurants.contactEmail,
        contactPhone: restaurants.contactPhone,
        managerPhone: restaurants.managerPhone,
        businessRegNo: restaurants.businessRegNo,
        openingHours: restaurants.openingHours,
        status: restaurants.status,
        createdAt: restaurants.createdAt,
      })
      .from(restaurants)
      .where(eq(restaurants.id, id));

    if (!restaurant) {
      return fail("Restaurant not found.", 404);
    }

    if (restaurant.status !== "active") {
       return fail("Restaurant is not currently active.", 403);
    }

    return new Response(JSON.stringify({ data: restaurant }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (err) {
    console.error("[public/restaurants GET]", err);
    return fail("Failed to fetch restaurant.", 500);
  }
}
