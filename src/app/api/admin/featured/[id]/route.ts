import { z } from "zod";
import { parseBody, ok, fail } from "@/lib/proxy";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { featuredItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user)                 return { user: null, res: fail("Unauthorized.", 401) };
  if (user.role !== "admin") return { user: null, res: fail("Forbidden.", 403) };
  return { user, res: null };
}

const UpdateFeaturedSchema = z.object({
  status:    z.enum(["active", "inactive"]).optional(),
  sortOrder: z.number().int().optional(),
});

/* ── PUT /api/admin/featured/[id] ── */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { res } = await requireAdmin();
  if (res) return res;

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
}

/* ── DELETE /api/admin/featured/[id] ── */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { res } = await requireAdmin();
  if (res) return res;

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
}
