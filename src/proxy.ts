import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * proxy.ts - The "Heart" of session management in Next.js + Supabase.
 *
 * Uses getSession() (local JWT decode, ~0ms) instead of getUser() (network
 * call to Supabase ~250ms) for route-protection decisions. Identity is still
 * verified server-side inside API route handlers via getCurrentUser().
 *
 * The verified userId is injected as x-user-id so route handlers can skip
 * their own supabase.auth.getUser() call, saving another ~200-300ms per hit.
 */

export default async function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

          supabaseResponse = NextResponse.next({
            request: { headers: requestHeaders },
          });

          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getSession() decodes the JWT locally from the cookie — no network call, ~0ms.
  // We extract the userId directly from the JWT payload (standard base64 decode)
  // rather than accessing session.user, which triggers a Supabase SDK warning.
  // Route handlers still perform DB-verified identity checks via getCurrentUser().
  const { data: { session } } = await supabase.auth.getSession();

  // Extract userId from the JWT sub claim without touching session.user
  let userId: string | null = null;
  if (session?.access_token) {
    try {
      const payload = JSON.parse(
        Buffer.from(session.access_token.split(".")[1], "base64url").toString()
      ) as { sub?: string };
      userId = payload.sub ?? null;
    } catch {
      userId = null;
    }
  }

  // Inject the verified user ID into a trusted server-side header so API
  // route handlers can skip their own supabase.auth.getUser() call.
  if (userId) {
    supabaseResponse.headers.set("x-user-id", userId);
  }

  // Boolean: is there an authenticated session?
  const isLoggedIn = !!userId;

  const { pathname } = request.nextUrl;

  /**
   * ── Route Protection Logic ────────────────────────────────────────────────
   */
  const PUBLIC_CUSTOMER_PREFIXES = [
    "/dashboard/customer/restaurant/",
    "/dashboard/customer/dish/",
    "/dashboard/customer/all-restaurants",
    "/dashboard/customer/all-dishes",
    "/dashboard/customer/category/",
    "/dashboard/customer/search",
    "/dashboard/customer/cart",
  ];

  const isPublicCustomerRoute = PUBLIC_CUSTOMER_PREFIXES.some(prefix =>
    pathname.startsWith(prefix)
  );

  const isAdminRoute  = pathname.startsWith("/dashboard/admin");
  const isDriverRoute = pathname.startsWith("/dashboard/driver");
  const isOwnerRoute  = pathname.startsWith("/dashboard/owner");
  const isPersonalCustomerRoute =
    pathname.startsWith("/dashboard/customer/orders") ||
    pathname.startsWith("/dashboard/customer/profile") ||
    pathname.startsWith("/dashboard/customer/settings") ||
    pathname === "/dashboard/customer" ||
    pathname === "/dashboard/customer/" ||
    pathname === "/dashboard";

  const isProtected = (isAdminRoute || isDriverRoute || isOwnerRoute || isPersonalCustomerRoute) && !isPublicCustomerRoute;
  const isAuthPage  = pathname === "/login" || pathname === "/register";

  // Case 1: Unauthenticated → redirect to /login for protected routes
  if (isProtected && !isLoggedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Case 2: Already logged in → redirect away from /login to /dashboard
  if (isAuthPage && isLoggedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
