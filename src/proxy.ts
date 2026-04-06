import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * middleware.ts - The "Heart" of session management in Next.js + Supabase.
 * 
 * This middleware intercepts requests to /api/* and /dashboard/* to ensure:
 * 1. The Supabase auth token is fresh and hasn't expired.
 * 2. Redirects unauthenticated users to /login for protected routes.
 * 3. Keeps public routes accessible for guest browsing.
 */

export default async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
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
          // 1. Update the request so the server can see the new cookies
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          
          // 2. Refresh the response object to include updated headers
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });

          // 3. Set the updated cookies in the response for the browser
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: getUser() triggers the token-refresh logic automatically.
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  /**
   * ── Route Protection Logic ────────────────────────────────────────────────
   * This part determines which pages require login and which are public.
   * ──────────────────────────────────────────────────────────────────────────
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
  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Case 2: Already logged in → redirect away from /login to /dashboard
  if (isAuthPage && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match paths to ensure auth sync:
     * - /api/* (All internal API calls)
     * - /dashboard/* (All dashboard segments)
     * - /login, /register (Auth pages)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
