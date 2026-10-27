import { afterEach, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.resetModules();
});

async function loadAuthApi() {
  vi.stubEnv("NEXT_PUBLIC_API_URL", "https://tajwidlens.pages.dev");
  vi.stubEnv("NODE_ENV", "production");
  return import("./auth-api");
}

it("classifies successful, unauthorized, network, and timeout session checks", async () => {
  const { authApi } = await loadAuthApi();
  const fetchMock = vi.spyOn(globalThis, "fetch");

  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ id: "account" }), { status: 200 }));
  await expect(authApi("/auth/me")).resolves.toEqual({ id: "account" });

  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 }));
  await expect(authApi("/auth/me")).rejects.toMatchObject({ status: 401, kind: "unauthorized" });

  fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
  await expect(authApi("/auth/me")).rejects.toMatchObject({ status: 0, kind: "network" });

  const timeout = new Error("timed out");
  timeout.name = "TimeoutError";
  fetchMock.mockRejectedValueOnce(timeout);
  await expect(authApi("/auth/me")).rejects.toMatchObject({ status: 0, kind: "timeout" });
});

it("keeps credentialed requests on the configured frontend origin", async () => {
  const { authApi } = await loadAuthApi();
  const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));
  await authApi("/auth/me");
  expect(fetchMock).toHaveBeenCalledWith("https://tajwidlens.pages.dev/api/v1/auth/me", expect.objectContaining({ credentials: "include" }));
});
