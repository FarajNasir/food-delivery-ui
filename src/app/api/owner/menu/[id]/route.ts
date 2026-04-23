import { ok, fail, withAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { menuItems, restaurants } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/* ── PATCH /api/owner/menu/[id] ── */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, async (user) => {
    try {
      if (user.role !== "owner") return fail("Unauthorized.", 401);

      const body = await req.json();
      const { id } = await params;
      const updateData = { ...body };

      /* 1. Verify item exists and belongs to a restaurant owned by the user */
      const [item] = await db
        .select({ id: menuItems.id, restaurantId: menuItems.restaurantId })
        .from(menuItems)
        .innerJoin(restaurants, eq(menuItems.restaurantId, restaurants.id))
        .where(and(eq(menuItems.id, id), eq(restaurants.ownerId, user.id)));

      if (!item) return fail("Menu item not found or permission denied.", 403);

    /* 2. Prepare payload */
    const updatePayload: any = { ...updateData };
    if (updatePayload.price !== undefined) {
      updatePayload.price = String(updatePayload.price);
    }
    updatePayload.updatedAt = new Date();

    /* 3. Update */
    const [updated] = await db
      .update(menuItems)
      .set(updatePayload)
      .where(eq(menuItems.id, id))
      .returning();

      return ok({
        ...updated,
        price: parseFloat(updated.price as unknown as string),
      });
    } catch (err) {
      console.error("[owner/menu PUT]", err);
      return fail("Failed to update menu item.", 500);
    }
  }, ["owner"]);
}

/* ── DELETE /api/owner/menu/[id] ── */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, async (user) => {
    try {
      if (user.role !== "owner") return fail("Unauthorized.", 401);

      const { id } = await params;

    /* 1. Verify ownership */
    const [item] = await db
      .select({ id: menuItems.id })
      .from(menuItems)
      .innerJoin(restaurants, eq(menuItems.restaurantId, restaurants.id))
      .where(and(eq(menuItems.id, id), eq(restaurants.ownerId, user.id)));

    if (!item) return fail("Menu item not found or permission denied.", 403);

    /* 2. Delete */
    await db.delete(menuItems).where(eq(menuItems.id, id));

      return ok({ id });
    } catch (err) {
      console.error("[owner/menu DELETE]", err);
      return fail("Failed to delete menu item.", 500);
    }
  }, ["owner"]);
}
