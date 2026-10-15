import { afterEach, describe, expect, it, vi } from "vitest";

const originalBasePath = process.env.NEXT_PUBLIC_BASE_PATH;

afterEach(() => {
  if (originalBasePath === undefined) delete process.env.NEXT_PUBLIC_BASE_PATH;
  else process.env.NEXT_PUBLIC_BASE_PATH = originalBasePath;
  vi.resetModules();
});

describe("assetPath", () => {
  it("keeps root-relative assets unchanged for local builds", async () => {
    delete process.env.NEXT_PUBLIC_BASE_PATH;
    vi.resetModules();
    const { assetPath } = await import("./asset-path");

    expect(assetPath("/data/tajweed/113.json")).toBe("/data/tajweed/113.json");
  });

  it("prefixes browser assets with the GitHub Pages repository path", async () => {
    process.env.NEXT_PUBLIC_BASE_PATH = "/TajwidLens/";
    vi.resetModules();
    const { assetPath } = await import("./asset-path");

    expect(assetPath("/data/tajweed/113.json")).toBe("/TajwidLens/data/tajweed/113.json");
    expect(assetPath("favicon.ico")).toBe("/TajwidLens/favicon.ico");
  });
});
