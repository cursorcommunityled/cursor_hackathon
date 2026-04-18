import { getSiteUrl, siteConfig } from "@/lib/site";

/** Hackathon dates — update when the program is finalized. */
const EVENT_START = "2026-04-10T10:00:00+05:00";
const EVENT_END = "2026-04-12T22:00:00+05:00";

/** Example venue (replace with your real location for production). */
const VENUE_NAME_EN = "School 21";
const STREET_ADDRESS_EN = "13 Ziyolilar Street";

/** Event JSON-LD — homepage only. */
export function StructuredData() {
  const url = getSiteUrl();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.descriptionEn,
    startDate: EVENT_START,
    endDate: EVENT_END,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: VENUE_NAME_EN,
      address: {
        "@type": "PostalAddress",
        streetAddress: STREET_ADDRESS_EN,
        addressLocality: "Tashkent",
        addressCountry: "UZ",
      },
    },
    organizer: { "@id": `${url}/#organization` },
    image: `${url}/opengraph-image`,
    url,
    offers: {
      "@type": "Offer",
      url: `${url}/register`,
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
