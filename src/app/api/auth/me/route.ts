import { ok, withAuth } from "@/lib/proxy";

/** GET /api/auth/me — returns 200 if logged in, 401 if guest */
export async function GET(req: Request) {
  return withAuth(req, async (user) => {
    return ok({ 
      id: user.id, 
      name: user.name, 
      email: user.email,
      phone: user.phone,
      role: user.role 
    });
  });
}
