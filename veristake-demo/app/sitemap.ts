import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://veristake-demo.vercel.app";
  const routes = ["/", "/demo", "/demo/carrier", "/demo/claimant", "/demo/verifier", "/dashboard", "/docs", "/legal"];

  return routes.map((route) => ({
    url: new URL(route, siteUrl).toString(),
    lastModified: new Date()
  }));
}
