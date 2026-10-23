// This module is imported by Client Components. Next.js only exposes
// NEXT_PUBLIC_* values to the browser, so a server-only GITHUB_PAGES check
// would silently collapse the prefix to an empty string after deployment.
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/+$/, "");

export function assetPath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;

  return `${basePath}${normalized}`;
}
