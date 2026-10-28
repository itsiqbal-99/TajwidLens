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
    expect(request.headers.get("x-tajwidlens-proxy")).toBe("p".repeat(32));
    expect(request.headers.get("x-tajwidlens-client-ip")).toBe("203.0.113.7");
    expect(await request.json()).toEqual({ email: "user@example.com" });
    const headers = new Headers({ location: "https://tajwidlens.pages.dev/dashboard/" });
    headers.append("set-cookie", "tajwidlens-oauth-state=; Max-Age=0; Secure; HttpOnly; SameSite=Lax; Path=/api/v1/auth/google");
    headers.append("set-cookie", "__Host-tajwidlens=new; Secure; HttpOnly; SameSite=Lax; Path=/");
    return new Response(null, { status: 302, headers });
  });
  const request = new Request("https://tajwidlens.pages.dev/api/v1/auth/login?source=test", {
    method: "POST",
    headers: { cookie: "__Host-tajwidlens=session", origin: "https://tajwidlens.pages.dev", "content-type": "application/json", "x-tajwidlens-csrf": "1", "cf-connecting-ip": "203.0.113.7", "x-tajwidlens-proxy": "attacker" },
    body: JSON.stringify({ email: "user@example.com" }),
  });
  const response = await onRequest({ request, env: { AUTH_API_ORIGIN: "https://tajwid-lens-vezh.vercel.app", API_PROXY_SECRET: "p".repeat(32) } });
  expect(fetchMock).toHaveBeenCalledOnce();
  expect(response.status).toBe(302);
  expect(response.headers.get("location")).toBe("https://tajwidlens.pages.dev/dashboard/");
  expect(response.headers.getSetCookie()).toHaveLength(2);
});

it("fails closed for an invalid upstream or an untrusted redirect", async () => {
  const request = new Request("https://tajwidlens.pages.dev/api/v1/auth/google/start");
  await expect(onRequest({ request, env: { AUTH_API_ORIGIN: "https://evil.test/path", API_PROXY_SECRET: "p".repeat(32) } }).then(response => response.status)).resolves.toBe(503);
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 302, headers: { location: "https://evil.test/steal" } }));
  await expect(onRequest({ request, env: { AUTH_API_ORIGIN: "https://tajwid-lens-vezh.vercel.app", API_PROXY_SECRET: "p".repeat(32) } }).then(response => response.status)).resolves.toBe(502);
});

it("reports an upstream network failure without exposing details", async () => {
  vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("private network detail"));
  const response = await onRequest({
    request: new Request("https://tajwidlens.pages.dev/api/v1/auth/me"),
    env: { AUTH_API_ORIGIN: "https://tajwid-lens-vezh.vercel.app", API_PROXY_SECRET: "p".repeat(32) },
  });
  expect(response.status).toBe(502);
  await expect(response.text()).resolves.not.toContain("private network detail");
});

it("rejects unconfigured secrets and oversized or non-JSON bodies before fetch", async () => {
  const fetchMock = vi.spyOn(globalThis, "fetch");
  const url = "https://tajwidlens.pages.dev/api/v1/auth/login";
  await expect(onRequest({ request: new Request(url), env: { AUTH_API_ORIGIN: "https://tajwid-lens-vezh.vercel.app" } }).then(r => r.status)).resolves.toBe(503);
  await expect(onRequest({ request: new Request(url, { method: "POST", headers: { "content-type": "text/plain" }, body: "x" }), env: { AUTH_API_ORIGIN: "https://tajwid-lens-vezh.vercel.app", API_PROXY_SECRET: "p".repeat(32) } }).then(r => r.status)).resolves.toBe(415);
  await expect(onRequest({ request: new Request(url, { method: "POST", headers: { "content-type": "application/json", "content-length": "262145" }, body: "{}" }), env: { AUTH_API_ORIGIN: "https://tajwid-lens-vezh.vercel.app", API_PROXY_SECRET: "p".repeat(32) } }).then(r => r.status)).resolves.toBe(415);
  expect(fetchMock).not.toHaveBeenCalled();
});
