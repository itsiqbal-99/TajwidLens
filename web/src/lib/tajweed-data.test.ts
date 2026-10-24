import { readFileSync } from "node:fs";
import { afterEach, expect, it, vi } from "vitest";
import { loadTajweedSurah, tajweedIndex } from "./tajweed-data";

afterEach(() => vi.unstubAllGlobals());

it("loads verified payloads and rejects altered bytes", async () => {
  const entry = tajweedIndex.files[0];
  const bytes = readFileSync(`public/data/tajweed/${entry.file}`);
  const fetchMock = vi.fn().mockResolvedValue(new Response(bytes));
  vi.stubGlobal("fetch", fetchMock);
  expect((await loadTajweedSurah(entry.surah)).verses).toHaveLength(7);
  expect(fetchMock).toHaveBeenCalledWith(
    expect.stringContaining(`${entry.file}?v=${entry.sha256.slice(0,16)}`),
    { cache: "force-cache" },
  );
  const other = tajweedIndex.files[1];
  const original = readFileSync(`public/data/tajweed/${other.file}`, "utf8");
  fetchMock.mockResolvedValueOnce(new Response(original.replaceAll("\n", "\r\n")));
  await expect(loadTajweedSurah(other.surah)).rejects.toThrow("Integritas data tajwid");
  fetchMock.mockResolvedValueOnce(new Response(original));
  expect((await loadTajweedSurah(other.surah)).surah.number).toBe(other.surah);
});
