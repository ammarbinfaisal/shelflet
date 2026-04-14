// Central per-deployment config. All knobs read from env so the same code
// powers every site — the .env file is the site-specific switch.

function flag(name: string): boolean {
  const v = process.env[name];
  if (!v) return false;
  const t = v.trim().toLowerCase();
  return t === "true" || t === "1";
}

function str(name: string, fallback: string): string {
  return (process.env[name]?.trim() || fallback);
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
  siteName: str("SITE_NAME", "shelflet"),
  siteDescription: str("SITE_DESCRIPTION", "Ammar's book collection"),
  robotsDisallow: flag("ROBOTS_DISALLOW"),
  features: {
    translator: flag("FEATURE_TRANSLATOR"),
    copies: flag("FEATURE_COPIES"),
  },
};
