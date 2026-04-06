import { z } from "zod";
import { parseBody, ok, fail } from "@/lib/proxy";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { menuItems, restaurants } from "@/lib/db/schema";
import { eq, and, SQL, asc, inArray } from "drizzle-orm";

const CreateMenuItemSchema = z.object({
  restaurantId: z.string().uuid(),
  name:         z.string().min(1).max(150),
  description:  z.string().max(500).optional().or(z.literal("")).transform(v => v || null),
  category:     z.string().min(1).max(100),
  price:        z.number().positive(),
  status:       z.enum(["available", "unavailable"]).default("available"),
  imageUrl:     z.string().url(),
});

/* ── GET /api/owner/menu ── */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "owner") return fail("Unauthorized.", 401);

    /* 1. Get all restaurants owned by the user */
    const ownedRests = await db
      .select({ id: restaurants.id })
      .from(restaurants)
      .where(eq(restaurants.ownerId, user.id));

    if (!ownedRests.length) return ok({ items: [] });

    const ownedIds = ownedRests.map(r => r.id);

    /* 2. Get menu items for these restaurants */
    const rows = await db
      .select({
        id:                 menuItems.id,
        restaurantId:       menuItems.restaurantId,
        restaurantName:     restaurants.name,
        name:               menuItems.name,
        description:        menuItems.description,
        category:           menuItems.category,
        price:              menuItems.price,
        status:             menuItems.status,
        imageUrl:           menuItems.imageUrl,
        createdAt:          menuItems.createdAt,
      })
      .from(menuItems)
      .leftJoin(restaurants, eq(menuItems.restaurantId, restaurants.id))
      .where(inArray(menuItems.restaurantId, ownedIds))
      .orderBy(asc(menuItems.createdAt));

    const items = rows.map((r) => ({
      ...r,
      price: parseFloat(r.price as unknown as string),
    }));

    return ok({ items });
  } catch (err) {
    console.error("[owner/menu GET]", err);
    return fail("Failed to load your menu items.", 500);
  }
}

/* ── POST /api/owner/menu ── */
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "owner") return fail("Unauthorized.", 401);

    const parsed = await parseBody(req, CreateMenuItemSchema);
    if ("error" in parsed) return parsed.error;

    const { restaurantId, name, description, category, price, status, imageUrl } = parsed.data;

    /* 1. Verify user owns the restaurant */
    const [restaurant] = await db
      .select({ id: restaurants.id, name: restaurants.name })
      .from(restaurants)
      .where(and(eq(restaurants.id, restaurantId), eq(restaurants.ownerId, user.id)));

    if (!restaurant) return fail("Restaurant not found or permission denied.", 403);

    /* 2. Insert item */
    const [created] = await db
      .insert(menuItems)
      .values({ restaurantId, name, description, category, price: String(price), status, imageUrl })
      .returning();

    return ok({
      ...created,
      restaurantName: restaurant.name,
      price:          parseFloat(created.price as unknown as string),
    });
  } catch (err) {
    console.error("[owner/menu POST]", err);
    return fail("Failed to create menu item.", 500);
  }
}
