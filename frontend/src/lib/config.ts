// Mirror of api/src/config.ts for browser-visible config.
// Next.js inlines NEXT_PUBLIC_* at build time; rebuild Vercel project to flip.

function flag(v: string | undefined): boolean {
  return v === "true" || v === "1";
}

export interface SiteFeatures {
  translator: boolean;
  copies: boolean;
}

export interface SiteConfig {
  siteName: string;
  siteDescription: string;
  robotsDisallow: boolean;
  features: SiteFeatures;
}

export const config: SiteConfig = {
  siteName: process.env.NEXT_PUBLIC_SITE_NAME || "shelflet",
  siteDescription:
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION || "Ammar's book collection",
  robotsDisallow: flag(process.env.NEXT_PUBLIC_ROBOTS_DISALLOW),
  features: {
    translator: flag(process.env.NEXT_PUBLIC_FEATURE_TRANSLATOR),
    copies: flag(process.env.NEXT_PUBLIC_FEATURE_COPIES),
  },
};
