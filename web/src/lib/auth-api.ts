export type Account = {
  id: string;
  email: string;
  nickname: string;
  fullName: string | null;
  learningGoal: string | null;
  level: string | null;
  emailVerified: boolean;
  loginMethods: string[];
};
export function parseApiUrl(value?: string) {
  if (!value) return "";
  try {
    const url = new URL(value);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== "/"
    )
      return "";
    if (
      process.env.NODE_ENV === "production" &&
      url.protocol !== "https:" &&
      !["localhost", "127.0.0.1"].includes(url.hostname)
    )
      return "";
    return url.origin;
  } catch {
    return "";
  }
}
export const apiUrl = parseApiUrl(process.env.NEXT_PUBLIC_API_URL);
export type AuthCapabilities = {
  google: boolean;
  emailRegistration: boolean;
  emailDelivery: boolean;
  developmentRegistration: boolean;
};
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function authApi<T>(
  path: string,
  body?: unknown,
  method = "POST",
): Promise<T> {
  if (!apiUrl)
    throw new ApiError(
      "Konfigurasi layanan akun belum valid. Anda tetap dapat melanjutkan tanpa akun.",
      503,
    );
  let response: Response;
  try {
    response = await fetch(`${apiUrl}/api/v1${path}`, {
      method: body === undefined ? "GET" : method,
      credentials: "include",
      cache: "no-store",
      headers:
        body === undefined
          ? {}
          : { "Content-Type": "application/json", "X-TajwidLens-CSRF": "1" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    throw new ApiError(
      "Layanan akun sementara tidak dapat dijangkau. Coba lagi atau lanjutkan tanpa akun.",
      0,
    );
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new ApiError(
      response.status === 429
        ? "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi."
        : Array.isArray(data.message)
          ? data.message.join(" ")
          : data.message || "Permintaan gagal. Silakan coba lagi.",
      response.status,
    );
  return data;
}
