import type { MetadataRoute } from "next";
import { config } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  if (config.robotsDisallow) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return { rules: [{ userAgent: "*", allow: "/" }] };
}
