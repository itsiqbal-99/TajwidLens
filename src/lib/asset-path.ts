const repoName = process.env.NEXT_PUBLIC_REPO_NAME;

const basePath =
  process.env.GITHUB_PAGES === "true" && repoName ? `/${repoName}` : "";

export function assetPath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;

  return `${basePath}${normalized}`;
}
