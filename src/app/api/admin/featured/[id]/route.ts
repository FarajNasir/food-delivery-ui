import { z } from "zod";
import { parseBody, ok, fail, withAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { featuredItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const UpdateFeaturedSchema = z.object({
  status:    z.enum(["active", "inactive"]).optional(),
  sortOrder: z.number().int().min(1, "Rank must be 1 or greater.").optional(),
});

/* ── PUT /api/admin/featured/[id] ── */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, async () => {
    const { id } = await params;

    const parsed = await parseBody(req, UpdateFeaturedSchema);
    if ("error" in parsed) return parsed.error;
    const updates = parsed.data;

    if (Object.keys(updates).length === 0) return fail("No fields to update.");

    try {
      const [updated] = await db
        .update(featuredItems)
        .set(updates)
        .where(eq(featuredItems.id, id))
        .returning();

      if (!updated) return fail("Featured item not found.", 404);
      return ok(updated);
    } catch (err) {
      console.error("[admin/featured PUT]", err);
      return fail("Failed to update featured item.", 500);
    }
  }, ["admin"]);
}

/* ── DELETE /api/admin/featured/[id] ── */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, async () => {
    const { id } = await params;

    try {
      const [deleted] = await db
        .delete(featuredItems)
        .where(eq(featuredItems.id, id))
        .returning({ id: featuredItems.id });

      if (!deleted) return fail("Featured item not found.", 404);
      return ok({ id: deleted.id });
    } catch (err) {
      console.error("[admin/featured DELETE]", err);
      return fail("Failed to delete featured item.", 500);
    }
  }, ["admin"]);
}
