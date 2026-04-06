/**
 * api.helper.ts - Unified HTTP communication layer for the entire application.
 * Provides consistent error handling, response parsing, and typing.
 */

export interface ApiResponse<T = null> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

/**
 * Custom Error class for API-related failures
 */
export class ApiError extends Error {
  constructor(public message: string, public status?: number) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Standardized response parser
 */
async function parseResponse<T>(res: Response): Promise<ApiResponse<T>> {
  try {
    const text = await res.text();
    if (!text) {
      if (res.ok) return { success: true };
      return { success: false, error: "Empty response from server", status: res.status };
    }

    const json = JSON.parse(text);
    if (!res.ok) {
      return { 
        success: false, 
        error: json.error || json.message || "An unexpected error occurred", 
        status: res.status 
      };
    }

    return { success: true, data: json.data || json };
  } catch (error) {
    return { success: false, error: "Failed to parse server response", status: res.status };
  }
}

/**
 * Base fetch wrapper with common headers and credentials
 */
async function request<T>(
  url: string, 
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      credentials: "same-origin",
    });

    return await parseResponse<T>(res);
  } catch (error) {
    console.error(`[API ERROR] ${url}:`, error);
    return { 
      success: false, 
      error: "Network connection failed. Please check your internet." 
    };
  }
}

export const http = {
  get: <T>(url: string, options?: RequestInit) => 
    request<T>(url, { ...options, method: "GET" }),
    
  post: <T>(url: string, body: unknown, options?: RequestInit) => 
    request<T>(url, { 
      ...options, 
      method: "POST", 
      body: body instanceof FormData ? body : JSON.stringify(body) 
    }),
    
  put: <T>(url: string, body: unknown, options?: RequestInit) => 
    request<T>(url, { 
      ...options, 
      method: "PUT", 
      body: body instanceof FormData ? body : JSON.stringify(body) 
    }),
    
  patch: <T>(url: string, body: unknown, options?: RequestInit) => 
    request<T>(url, { 
      ...options, 
      method: "PATCH", 
      body: body instanceof FormData ? body : JSON.stringify(body) 
    }),
    
  delete: <T>(url: string, options?: RequestInit) => 
    request<T>(url, { ...options, method: "DELETE" }),
};
