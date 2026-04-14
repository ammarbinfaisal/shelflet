// Mirror of api/src/config.ts for browser-visible config.
// Next.js inlines NEXT_PUBLIC_* at build time; rebuild Vercel project to flip.

function flag(v: string | undefined): boolean {
  if (!v) return false;
  const t = v.trim().toLowerCase();
  return t === "true" || t === "1";
}

function str(v: string | undefined, fallback: string): string {
  return (v?.trim() || fallback);
}

export interface SiteFeatures {
  translator: boolean;
  copies: boolean;
}

// Columns on the public book list that can be suppressed per-site.
// Known values: "info" (the explanation column).
export type PublicListColumn = "info";

export interface SiteConfig {
  siteName: string;
  siteDescription: string;
  robotsDisallow: boolean;
  features: SiteFeatures;
  hiddenListColumns: Set<PublicListColumn>;
}

function csvSet<T extends string>(v: string | undefined): Set<T> {
  if (!v) return new Set();
  return new Set(
    v.split(",").map((s) => s.trim()).filter(Boolean) as T[]
  );
}

export const config: SiteConfig = {
  siteName: str(process.env.NEXT_PUBLIC_SITE_NAME, "shelflet"),
  siteDescription: str(process.env.NEXT_PUBLIC_SITE_DESCRIPTION, "Ammar's book collection"),
  robotsDisallow: flag(process.env.NEXT_PUBLIC_ROBOTS_DISALLOW),
  features: {
    translator: flag(process.env.NEXT_PUBLIC_FEATURE_TRANSLATOR),
    copies: flag(process.env.NEXT_PUBLIC_FEATURE_COPIES),
  },
  hiddenListColumns: csvSet<PublicListColumn>(process.env.NEXT_PUBLIC_HIDE_LIST_COLUMNS),
};
