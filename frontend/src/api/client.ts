import { ApiError } from "@/types/api";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://qihk58gv4g.execute-api.ap-south-1.amazonaws.com/prod";
const CLIENT_TIMEOUT = 25000;

function getActorEmail(): string | null {
  return sessionStorage.getItem("hr_actor_email") || localStorage.getItem("hr_actor_email");
}

function mapErrorMessage(status: number, body: any): string {
  const detail = body?.detail || body?.message || "";
  switch (status) {
    case 400: return detail || "Invalid request. Please check your input.";
    case 401: return "Authentication required. Please select a demo account.";
    case 403: return "Admin privileges required for this action.";
    case 404: return detail || "Resource not found.";
    case 409: return detail || "A conflict occurred. The resource may already exist.";
    case 500: return "Server error. Please try again later.";
    default: return detail || `Request failed (${status}).`;
  }
}

export async function apiRequest<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
    actorAuth?: boolean;
    signal?: AbortSignal;
  } = {}
): Promise<T> {
  const { method = "GET", body, headers = {}, actorAuth = false, signal } = options;

  const url = `${API_BASE_URL}${path}`;
  const reqHeaders: Record<string, string> = {
    ...headers,
  };

  if (body !== undefined) {
    reqHeaders["Content-Type"] = reqHeaders["Content-Type"] || "application/json";
  }

  if (actorAuth) {
    const email = getActorEmail();
    if (email) reqHeaders["X-Actor-Email"] = email;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CLIENT_TIMEOUT);
  const mergedSignal = signal || controller.signal;

  try {
    const res = await fetch(url, {
      method,
      headers: reqHeaders,
      body: body ? JSON.stringify(body) : undefined,
      signal: mergedSignal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      let errorBody: any = {};
      try { errorBody = await res.json(); } catch {}
      const err: ApiError = {
        status: res.status,
        message: mapErrorMessage(res.status, errorBody),
        detail: errorBody?.detail,
      };
      throw err;
    }

    const text = await res.text();
    return text ? JSON.parse(text) : ({} as T);
  } catch (e: any) {
    clearTimeout(timeout);
    if (e.name === "AbortError") {
      throw { status: 408, message: "Request timed out. Please try again." } as ApiError;
    }
    if (e.status) throw e;
    throw { status: 0, message: "Network error. Check your connection and API URL." } as ApiError;
  }
}

export function buildQueryString(params: Record<string, any>): string {
  const parts: string[] = [];
  for (const [key, val] of Object.entries(params)) {
    if (val === undefined || val === null || val === "") continue;
    if (key === "filters" && typeof val === "object") {
      for (const [col, fval] of Object.entries(val as Record<string, string>)) {
        if (fval) parts.push(`filters=${encodeURIComponent(`${col}:${fval}`)}`);
      }
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(val))}`);
    }
  }
  return parts.length ? `?${parts.join("&")}` : "";
}
