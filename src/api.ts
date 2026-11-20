// Backend API-র সাথে কথা বলার একমাত্র জায়গা।
// সব request-এ credentials: "include" থাকে, তাই httpOnly login cookie নিজে থেকে যায়।
// কোনো token JavaScript-এ রাখা হয় না (localStorage-এ নয়)।

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

// Render free server ঘুমিয়ে থাকলে প্রথম request ~৫০ সেকেন্ড নেয়, তাই অপেক্ষার সীমা বেশি
const REQUEST_TIMEOUT_MS = 65_000;

// 401 এলে (login নেই বা মেয়াদ শেষ) পুরো app-কে জানানোর event
export const UNAUTHORIZED_EVENT = "dt:unauthorized";

export class ApiClientError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
  }
}

type QueryValue = string | number | boolean | null | undefined;
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export interface RequestOptions {
  query?: Record<string, QueryValue>;
  signal?: AbortSignal;
  // login-এর ভুল password-এও 401 আসে; সেটা "session শেষ" নয়, তাই event বন্ধ রাখার সুযোগ
  skipUnauthorizedEvent?: boolean;
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    // ফাঁকা মান পাঠানো হয় না (backend ফাঁকা মান পছন্দ করে না)
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const queryString = params.toString();
  return `${API_URL}${path}${queryString ? `?${queryString}` : ""}`;
}

function extractMessage(payload: unknown): string | null {
  if (typeof payload === "object" && payload !== null && "message" in payload) {
    const message = (payload as { message: unknown }).message;
    if (typeof message === "string" && message.length > 0) return message;
  }
  return null;
}

async function request<T>(
  method: HttpMethod,
  path: string,
  body: unknown,
  options: RequestOptions = {}
): Promise<T> {
  if (!API_URL) {
    throw new ApiClientError(0, "API address is not configured (NEXT_PUBLIC_API_URL).");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  // বাইরের কেউ (যেমন TanStack Query) বাতিল করলে আমাদের request-ও বাতিল
  if (options.signal) {
    if (options.signal.aborted) controller.abort();
    else options.signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  const hasBody = body !== undefined;
  let response: Response;

  try {
    response = await fetch(buildUrl(path, options.query), {
      method,
      credentials: "include",
      cache: "no-store",
      headers: hasBody
        ? { Accept: "application/json", "Content-Type": "application/json" }
        : { Accept: "application/json" },
      body: hasBody ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (error) {
    // ইচ্ছাকৃত বাতিল হলে error সরাসরি ছোড়া (user-কে "সংযোগ নেই" দেখানো ঠিক নয়)
    if (options.signal?.aborted) throw error;
    throw new ApiClientError(
      0,
      "Cannot reach the server. It may be waking up (free hosting) - please try again in a moment."
    );
  } finally {
    clearTimeout(timeoutId);
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    if (response.status === 401 && !options.skipUnauthorizedEvent && typeof window !== "undefined") {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    throw new ApiClientError(response.status, extractMessage(payload) ?? "Request failed. Please try again.");
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>("GET", path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>("POST", path, body ?? {}, options),
  put: <T>(path: string, body: unknown, options?: RequestOptions) => request<T>("PUT", path, body, options),
  delete: <T>(path: string, options?: RequestOptions) => request<T>("DELETE", path, undefined, options),
};

// error থেকে user-কে দেখানোর বার্তা বের করা
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) return error.message;
  return "Something went wrong. Please try again.";
}
