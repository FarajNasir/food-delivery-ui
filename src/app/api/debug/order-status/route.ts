import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ok, fail } from "@/lib/proxy";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return fail("Missing id", 400);

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, id),
  });

  return ok({ id, status: order?.status });
}
