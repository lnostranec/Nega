import type { NextConfig } from "next";

/** Домены, с которых next/image может брать фото товаров. */
function imageHostnames(): string[] {
  const hosts = new Set<string>(["images.unsplash.com"]);

  const publicBase = process.env.S3_PUBLIC_BASE_URL?.trim();
  const endpoint = process.env.S3_ENDPOINT?.trim() || "https://storage.yandexcloud.net";

  for (const url of [publicBase, endpoint]) {
    if (!url) continue;
    try {
      hosts.add(new URL(url).hostname);
    } catch {
      /* некорректный URL — пропускаем */
    }
  }

  return [...hosts];
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: imageHostnames().map((hostname) => ({
      protocol: "https" as const,
      hostname,
    })),
  },
};

export default nextConfig;
