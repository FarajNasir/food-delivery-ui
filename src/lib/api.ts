/**
 * api.ts — typed client-side fetch wrapper for all API calls.
 */

export interface ApiResponse<T = null> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "customer" | "admin" | "driver" | "owner";
}

export type UserRole   = "customer" | "driver" | "owner" | "admin";
export type UserStatus = "active" | "banned";

export interface AdminUserItem {
  id:        string;
  name:      string;
  email:     string;
  phone:     string;
  role:      UserRole;
  status:    UserStatus;
  createdAt: string;
}

export interface AdminUserListResponse {
  users:    AdminUserItem[];
  total:    number;
  page:     number;
  pageSize: number;
}

/* ── HTTP helpers ── */

async function post<T>(url: string, body: unknown): Promise<ApiResponse<T>> {
  const res  = await fetch(url, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
    credentials: "same-origin",
  });
  const json = await res.json();
  if (!res.ok) return { success: false, error: json.error ?? "Something went wrong." };
  return { success: true, data: json.data };
}

async function get<T>(url: string): Promise<ApiResponse<T>> {
  const res  = await fetch(url, { credentials: "same-origin" });
  const json = await res.json();
  if (!res.ok) return { success: false, error: json.error ?? "Something went wrong." };
  return { success: true, data: json.data };
}

async function put<T>(url: string, body: unknown): Promise<ApiResponse<T>> {
  const res  = await fetch(url, {
    method:  "PUT",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
    credentials: "same-origin",
  });
  const json = await res.json();
  if (!res.ok) return { success: false, error: json.error ?? "Something went wrong." };
  return { success: true, data: json.data };
}

async function del<T = null>(url: string): Promise<ApiResponse<T>> {
  const res  = await fetch(url, { method: "DELETE", credentials: "same-origin" });
  const json = await res.json();
  if (!res.ok) return { success: false, error: json.error ?? "Something went wrong." };
  return { success: true, data: json.data };
}

/* ── Auth API ── */

export const authApi = {
  login(email: string, password: string) {
    return post<AuthUser>("/api/auth/login", { email, password });
  },
  register(payload: { name: string; email: string; phone: string; password: string }) {
    return post<AuthUser>("/api/auth/register", payload);
  },
  logout() {
    return post<null>("/api/auth/logout", {});
  },
};

/* ── Admin: User Management API ── */

export interface ListUsersParams {
  search?:  string;
  role?:    string;
  status?:  string;
  sort?:    "name" | "createdAt";
  order?:   "asc" | "desc";
  page?:    number;
  limit?:   number;
}

export const adminApi = {
  listUsers(params: ListUsersParams = {}) {
    const qs = new URLSearchParams();
    if (params.search)  qs.set("search",  params.search);
    if (params.role)    qs.set("role",    params.role);
    if (params.status)  qs.set("status",  params.status);
    if (params.sort)    qs.set("sort",    params.sort);
    if (params.order)   qs.set("order",   params.order);
    if (params.page)    qs.set("page",    String(params.page));
    if (params.limit)   qs.set("limit",   String(params.limit));
    return get<AdminUserListResponse>(`/api/admin/users?${qs.toString()}`);
  },

  createUser(payload: { name: string; email: string; phone: string; role: UserRole; password: string }) {
    return post<AdminUserItem>("/api/admin/users", payload);
  },

  updateUser(id: string, payload: { name?: string; phone?: string; role?: UserRole; status?: UserStatus }) {
    return put<AdminUserItem>(`/api/admin/users/${id}`, payload);
  },

  deleteUser(id: string) {
    return del<{ id: string }>(`/api/admin/users/${id}`);
  },
};
