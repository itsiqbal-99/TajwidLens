import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";

const repoName = process.env.NEXT_PUBLIC_REPO_NAME;

if (isGitHubPages && !repoName) {
  throw new Error("NEXT_PUBLIC_REPO_NAME isn't configured yet");
}

const basePath = isGitHubPages ? `/${repoName}` : "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,

  basePath,

  images: {
    unoptimized: true,
  },
};

export default nextConfig;
