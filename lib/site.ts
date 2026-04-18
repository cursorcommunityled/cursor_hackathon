/**
 * Canonical site URL for metadata, sitemap, and JSON-LD.
 * Set NEXT_PUBLIC_SITE_URL in production (e.g. https://your-domain.example).
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}`;
  }
  return "http://localhost:3000";
}

export const siteConfig = {
  name: "CURSOR 48H",
  shortName: "CURSOR 48H",
  tagline: "AI Hackathon | Tashkent",
  /** Primary description for metadata (English). */
  description:
    "48-hour AI hackathon in Tashkent. Intensive marathon of AI product development with mentorship and expert support.",
  descriptionEn:
    "48-hour AI hackathon in Tashkent. Intensive marathon of AI product development with mentorship and expert support.",
  locale: "en_US",
  twitterHandle: undefined as string | undefined,
} as const;
