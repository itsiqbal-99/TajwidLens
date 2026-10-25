import type { NextConfig } from "next";
import path from "node:path";

const isGitHubPages = process.env.GITHUB_PAGES === "true";

const repoName = process.env.NEXT_PUBLIC_REPO_NAME;
const configuredBasePath = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/+$/, "");

const basePath = isGitHubPages ? configuredBasePath || (repoName ? `/${repoName}` : "") : "";

if (isGitHubPages && !basePath) throw new Error("NEXT_PUBLIC_BASE_PATH or NEXT_PUBLIC_REPO_NAME must be configured for GitHub Pages");

const nextConfig: NextConfig = {
  devIndicators: false,
  output: "export",
  trailingSlash: true,
  turbopack: { root: path.resolve(__dirname, '..') },

  basePath,

  images: {
    unoptimized: true,
  },
};

export default nextConfig;
