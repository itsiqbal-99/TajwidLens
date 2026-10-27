import { afterEach, expect, it, vi } from "vitest";
import { onRequest } from "./[[path]]";

afterEach(() => vi.restoreAllMocks());

it("forwards cookies, CSRF context, body, Location, and Set-Cookie only to the fixed backend", async () => {
  const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async input => {
    const request = input as Request;
    expect(request.url).toBe("https://tajwid-lens-vezh.vercel.app/api/v1/auth/login?source=test");
    expect(request.headers.get("cookie")).toBe("__Host-tajwidlens=session");
    expect(request.headers.get("origin")).toBe("https://tajwidlens.pages.dev");
    expect(request.headers.get("x-tajwidlens-csrf")).toBe("1");
    expect(await request.json()).toEqual({ email: "user@example.com" });
    const headers = new Headers({ location: "https://tajwidlens.pages.dev/dashboard/" });
    headers.append("set-cookie", "tajwidlens-oauth-state=; Max-Age=0; Secure; HttpOnly; SameSite=Lax; Path=/api/v1/auth/google");
    headers.append("set-cookie", "__Host-tajwidlens=new; Secure; HttpOnly; SameSite=Lax; Path=/");
    return new Response(null, { status: 302, headers });
  });
  const request = new Request("https://tajwidlens.pages.dev/api/v1/auth/login?source=test", {
    method: "POST",
    headers: { cookie: "__Host-tajwidlens=session", origin: "https://tajwidlens.pages.dev", "content-type": "application/json", "x-tajwidlens-csrf": "1" },
    body: JSON.stringify({ email: "user@example.com" }),
  });
  const response = await onRequest({ request, env: { AUTH_API_ORIGIN: "https://tajwid-lens-vezh.vercel.app" } });
  expect(fetchMock).toHaveBeenCalledOnce();
  expect(response.status).toBe(302);
  expect(response.headers.get("location")).toBe("https://tajwidlens.pages.dev/dashboard/");
  expect(response.headers.getSetCookie()).toHaveLength(2);
});

it("fails closed for an invalid upstream or an untrusted redirect", async () => {
  const request = new Request("https://tajwidlens.pages.dev/api/v1/auth/google/start");
  await expect(onRequest({ request, env: { AUTH_API_ORIGIN: "https://evil.test/path" } }).then(response => response.status)).resolves.toBe(503);
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 302, headers: { location: "https://evil.test/steal" } }));
  await expect(onRequest({ request, env: { AUTH_API_ORIGIN: "https://tajwid-lens-vezh.vercel.app" } }).then(response => response.status)).resolves.toBe(502);
});

it("reports an upstream network failure without exposing details", async () => {
  vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("private network detail"));
  const response = await onRequest({
    request: new Request("https://tajwidlens.pages.dev/api/v1/auth/me"),
    env: { AUTH_API_ORIGIN: "https://tajwid-lens-vezh.vercel.app" },
  });
  expect(response.status).toBe(502);
  await expect(response.text()).resolves.not.toContain("private network detail");
});
