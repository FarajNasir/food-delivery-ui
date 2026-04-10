/**
 * proxy.ts — server-side request handler utilities.
 * API routes import these to validate input, build consistent responses,
 * and handle errors in one place.
 */

import { NextResponse } from "next/server";
import { ZodSchema, ZodError } from "zod";

export type ApiSuccess<T> = { data: T };
export type ApiError = { error: string };

/** Return a 200 JSON success response. */
export function ok<T>(data: T): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ data }, { status: 200 });
}

/** Return a JSON error response with the given status code. */
export function fail(message: string, status = 400): NextResponse<ApiError> {
  return NextResponse.json({ error: message }, { status });
}

/** Parse and validate a JSON request body against a Zod schema. */
export async function parseBody<T>(
  req: Request,
  schema: ZodSchema<T>
): Promise<{ data: T } | { error: NextResponse<ApiError> }> {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return { error: fail("Invalid JSON body.") };
  }

  const result = schema.safeParse(body);

  if (!result.success) {
    const message = formatZodError(result.error);
    return { error: fail(message) };
  }

  return { data: result.data };
}

function formatZodError(err: ZodError): string {
  return err.issues.map((e) => e.message).join(", ");
}

/* ── Centralized Authentication Guard ── */

import { getCurrentUser, type SessionUser, type UserRole } from "./auth";

/**
 * Higher-order function to protect API Route Handlers.
 * - Automatically refreshes the session token.
 * - Enforces authentication.
 * - Optional: enforces one or more specific roles.
 */
export async function withAuth<T = NextResponse>(
  req: Request,
  handler: (user: SessionUser) => Promise<T>,
  roles?: UserRole[]
): Promise<T | NextResponse<ApiError>> {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : undefined;
    const user = await getCurrentUser(token);

    if (!user) return fail("Unauthorized.", 401);

    if (roles && !roles.includes(user.role)) {
      return fail("Forbidden. You don't have permission to access this resource.", 403);
    }

    return await handler(user);
  } catch (error) {
    console.error(`[Auth Guard Error] path: ${new URL(req.url).pathname}`, error);
    return fail("Internal Server Error.", 500);
  }
}

/**
 * Specialized version of withAuth for restaurant owner routes.
 */
export async function withOwnerAuth<T = NextResponse>(
  req: Request,
  handler: (user: SessionUser) => Promise<T>
): Promise<T | NextResponse<ApiError>> {
  return withAuth(req, handler, ["owner", "admin"]);
}
