import { NextResponse } from "next/server";
import { and, eq, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { deliveryJobs, orders } from "@/lib/db/schema";

type ShipdayWebhookPayload = Record<string, unknown>;

function readObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function pickFirstString(...values: unknown[]): string | null {
  for (const value of values) {
    const parsed = readString(value);
    if (parsed) return parsed;
  }
  return null;
}

function pickFirstNestedString(
  sources: Array<Record<string, unknown> | null>,
  keys: string[]
): string | null {
  for (const source of sources) {
    if (!source) continue;
    for (const key of keys) {
      const parsed = readString(source[key]);
      if (parsed) return parsed;
    }
  }
  return null;
}

function mapShipdayStatus(payload: ShipdayWebhookPayload) {
  const order = readObject(payload.order);
  const deliveryDetails = readObject(payload.delivery_details);
  const rawStatus = pickFirstString(
    payload.orderStatus,
    payload.order_status,
    payload.status,
    payload.deliveryStatus,
    payload.delivery_status,
    order?.orderStatus,
    order?.order_status,
    deliveryDetails?.status,
    deliveryDetails?.delivery_status
  )?.toUpperCase();

  if (!rawStatus) return null;
  if (
    rawStatus.includes("DELIVERED") ||
    rawStatus.includes("COMPLETED") ||
    rawStatus.includes("SUCCESS")
  ) {
    return "DELIVERED" as const;
  }
  if (
    rawStatus.includes("PRE_ASSIGNED") ||
    rawStatus.includes("ASSIGNED") ||
    rawStatus.includes("OUT_FOR_DELIVERY") ||
    rawStatus.includes("ON_THE_WAY") ||
    rawStatus.includes("EN_ROUTE") ||
    rawStatus.includes("STARTED") ||
    rawStatus.includes("PICKED_UP")
  ) {
    return "OUT_FOR_DELIVERY" as const;
  }
  if (
    rawStatus.includes("FAILED") ||
    rawStatus.includes("INCOMPLETE") ||
    rawStatus.includes("CANCELLED")
  ) {
    return "CANCELLED" as const;
  }
  if (rawStatus.includes("NOT_ASSIGNED") || rawStatus.includes("PENDING")) {
    return "DISPATCH_REQUESTED" as const;
  }
  return null;
}

export async function POST(req: Request) {
  console.log("[Shipday Webhook] Received request");
  try {
    const body = await req.text();
    if (!body) {
      console.log("[Shipday Webhook] Received empty body (ping).");
      return NextResponse.json({ ok: true, message: "Ping received" });
    }

    let payload: ShipdayWebhookPayload;
    try {
      payload = JSON.parse(body);
    } catch {
      console.error("[Shipday Webhook] Invalid JSON or unexpected end of input:", body);
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // Verify token if configured
    const expectedToken = process.env.SHIPDAY_WEBHOOK_TOKEN;
    if (expectedToken) {
      const url = new URL(req.url);
      const order = readObject(payload.order);
      const company = readObject(payload.company);
      const receivedToken = pickFirstString(
        payload.token,
        payload.verificationToken,
        payload.auth_token,
        payload.client_id,
        order?.token,
        company?.token,
        url.searchParams.get("token"),
        url.searchParams.get("apiKey"),
        req.headers.get("token"),
        req.headers.get("client_id"),
        req.headers.get("x-shipday-token"),
        req.headers.get("authorization")?.replace("Bearer ", "")
      );



      if (receivedToken !== expectedToken) {
        console.warn(`[Shipday Webhook] Unauthorized.`);
        console.warn(`- Expected: "${expectedToken}"`);
        console.warn(`- Received: "${receivedToken}"`);
        console.warn(`- Payload keys: ${Object.keys(payload).join(", ")}`);
        console.warn(`- Headers: ${JSON.stringify(Object.fromEntries(req.headers.entries()))}`);
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } else {
      console.warn("[Shipday Webhook] Warning: SHIPDAY_WEBHOOK_TOKEN is not set in environment variables.");
    }

    const order = readObject(payload.order);
    const deliveryDetails = readObject(payload.delivery_details);

    const providerOrderId = pickFirstString(
      payload.orderId,
      payload.orderID,
      payload.id,
      payload.orderNumber,
      payload.order_number
    ) || pickFirstNestedString(
      [order, deliveryDetails],
      ["id", "orderId", "orderID", "orderNumber", "order_number"]
    );
    const trackingId = pickFirstString(
      payload.trackingId,
      payload.trackingID,
      payload.tracking_id
    ) || pickFirstNestedString(
      [order, deliveryDetails],
      ["trackingId", "trackingID", "tracking_id"]
    );
    const localOrderId = pickFirstNestedString(
      [order],
      ["order_number", "orderNumber"]
    );

    if (!providerOrderId && !trackingId && !localOrderId) {
      console.warn("[Shipday Webhook] Missing order identifier in payload:", payload);
      return NextResponse.json({ error: "Missing Shipday order identifier." }, { status: 400 });
    }

    const lookupConditions = [];
    if (providerOrderId) lookupConditions.push(eq(deliveryJobs.providerOrderId, providerOrderId));
    if (trackingId) lookupConditions.push(eq(deliveryJobs.trackingId, trackingId));
    if (localOrderId) lookupConditions.push(eq(deliveryJobs.orderId, localOrderId));

    const deliveryJob = await db.query.deliveryJobs.findFirst({
      where: lookupConditions.length === 1 ? lookupConditions[0] : or(...lookupConditions),
    });

    if (!deliveryJob) {
      console.warn("[Shipday Webhook] Delivery job not found for identifiers:", {
        providerOrderId,
        trackingId,
        localOrderId,
      });
      return NextResponse.json({ error: "Delivery job not found." }, { status: 404 });
    }

    const mappedStatus = mapShipdayStatus(payload);
    const updateDeliveryJob: Record<string, string | Date | null> = {
      providerOrderId: providerOrderId || deliveryJob.providerOrderId,
      trackingId: trackingId || deliveryJob.trackingId,
      trackingUrl: pickFirstNestedString(
        [payload, order, deliveryDetails],
        ["trackingUrl", "trackingURL", "tracking_url"]
      ) || deliveryJob.trackingUrl,
      driverName: pickFirstNestedString(
        [payload, deliveryDetails],
        ["driverName", "driver_name", "driver"]
      ) || deliveryJob.driverName,
      driverPhone: pickFirstNestedString(
        [payload, deliveryDetails],
        ["driverPhone", "driver_phone", "phone"]
      ) || deliveryJob.driverPhone,
      eta: pickFirstNestedString(
        [payload, deliveryDetails],
        ["eta", "estimatedDeliveryTime", "estimatedArrival", "estimated_arrival"]
      ) || deliveryJob.eta,
      updatedAt: new Date(),
    };

    if (mappedStatus) {
      updateDeliveryJob.status = mappedStatus;
    }

    await db
      .update(deliveryJobs)
      .set(updateDeliveryJob)
      .where(eq(deliveryJobs.id, deliveryJob.id));

    if (mappedStatus) {
      await db
        .update(orders)
        .set({
          status: mappedStatus,
          updatedAt: new Date(),
        })
        .where(and(
          eq(orders.id, deliveryJob.orderId),
          mappedStatus === "DELIVERED"
            ? or(
                eq(orders.status, "CONFIRMED"),
                eq(orders.status, "PAID"),
                eq(orders.status, "PREPARING"),
                eq(orders.status, "DISPATCH_REQUESTED"),
                eq(orders.status, "OUT_FOR_DELIVERY")
              )
            : mappedStatus === "CANCELLED"
              ? or(
                  eq(orders.status, "CONFIRMED"),
                  eq(orders.status, "PAID"),
                  eq(orders.status, "PREPARING"),
                  eq(orders.status, "DISPATCH_REQUESTED"),
                  eq(orders.status, "OUT_FOR_DELIVERY")
                )
              : or(
                  eq(orders.status, "CONFIRMED"),
                  eq(orders.status, "PAID"),
                  eq(orders.status, "PREPARING"),
                  eq(orders.status, "DISPATCH_REQUESTED")
                )
        ));
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Shipday Webhook] Error:", error);
    return NextResponse.json({ error: "Webhook handling failed." }, { status: 500 });
  }
}
