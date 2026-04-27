import { ok, fail, withAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { restaurants } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, async (user) => {
    const { id } = await params;
    try {
      if (user.role !== "owner" && user.role !== "admin") {
        return fail("Unauthorized.", 401);
      }

    const conditions = [eq(restaurants.id, id)];
    if (user.role === "owner") {
      conditions.push(eq(restaurants.ownerId, user.id));
    }

    const [row] = await db
      .select()
      .from(restaurants)
      .where(and(...conditions))
      .limit(1);

    if (!row) return fail("Restaurant not found.", 404);

      return ok(row);
    } catch (err) {
      console.error(`[api/owner/restaurants/${id} GET]`, err);
      return fail("Failed to load restaurant details.", 500);
    }
  }, ["owner", "admin"]);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, async (user) => {
    const { id } = await params;
    try {
      if (user.role !== "owner" && user.role !== "admin") {
        return fail("Unauthorized.", 401);
      }

    const body = await req.json();

    const conditions = [eq(restaurants.id, id)];
    if (user.role === "owner") {
      conditions.push(eq(restaurants.ownerId, user.id));
    }

    const [existing] = await db
      .select({ id: restaurants.id })
      .from(restaurants)
      .where(and(...conditions))
      .limit(1);

    if (!existing) return fail("Restaurant not found or unauthorized.", 404);

    const [updated] = await db
      .update(restaurants)
      .set({
        name:          body.name,
        location:      body.location,
        logoUrl:       body.logoUrl,
        contactEmail:  body.contactEmail,
        contactPhone:  body.contactPhone,
        openingHours:  body.openingHours,
        updatedAt:     new Date(),
      })
      .where(eq(restaurants.id, id))
      .returning();

      return ok(updated);
    } catch (err) {
      console.error(`[api/owner/restaurants/${id} PUT]`, err);
      return fail("Failed to update restaurant.", 500);
    }
  }, ["owner", "admin"]);
}
