"use client";

import { motion, useInView } from "framer-motion";
import { useRef, type CSSProperties } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { SectionTag } from "@/components/ui";
import { fadeUp, staggerContainer, staggerContainerFast } from "@/lib/animations";

export type Sponsor = {
  name: string;
  logoUrl?: string;
  href?: string;
  /** Logo width in CSS pixels (`<img width>` / style). Omit both dimensions to use default Tailwind sizing. */
  logoWidth?: number;
  /** Logo height in CSS pixels. */
  logoHeight?: number;
};

/** Fallback when `logoWidth` / `logoHeight` are omitted (matches previous `max-h-12 sm:max-h-14` look). */
const DEFAULT_LOGO_TAILWIND =
  "max-h-12 sm:max-h-14 w-auto object-contain opacity-85";

/** Uniform tile logo for all sponsor rows (see `public/logo-dark.png`). */
const SPONSOR_LOGO_SRC = "/logo-dark.png";
const SPONSOR_LOGO_SIZE = { logoWidth: 160, logoHeight: 48 } as const;

const CURSOR_NAME = "Cursor";
const CURSOR_WEB = "https://cursor.com";

function cursorSponsor(): Sponsor {
  return {
    name: CURSOR_NAME,
    href: CURSOR_WEB,
    logoUrl: SPONSOR_LOGO_SRC,
    ...SPONSOR_LOGO_SIZE,
  };
}

/** Slot counts preserved for layout; each tile shows Cursor → cursor.com */
const CO_ORGANIZER_SLOTS = 1;
const MAIN_SPONSOR_SLOTS = 6;
const SOCIAL_SLOTS = 7;

const coOrganizers: Sponsor[] = Array.from({ length: CO_ORGANIZER_SLOTS }, () =>
  cursorSponsor(),
);

const sponsors: Sponsor[] = Array.from({ length: MAIN_SPONSOR_SLOTS }, () =>
  cursorSponsor(),
);

const socialSponsors: Sponsor[] = Array.from({ length: SOCIAL_SLOTS }, () =>
  cursorSponsor(),
);

function SponsorLogo({
  sponsor,
  variant = "default",
}: {
  sponsor: Sponsor;
  variant?: "default" | "social";
}) {
  const isSocial = variant === "social";
  const hasLogo = Boolean(sponsor.logoUrl);
  const defaultLinkClass =
    "flex items-center justify-center min-h-[80px] sm:min-h-[96px] px-6 py-5 transition-opacity duration-200 hover:opacity-100";

  const hasLogoSize = sponsor.logoWidth != null || sponsor.logoHeight != null;
  const logoStyle: CSSProperties | undefined = hasLogoSize
    ? {
        width: sponsor.logoWidth ?? "auto",
        height: sponsor.logoHeight ?? "auto",
        maxWidth: "100%",
      }
    : undefined;

  const link = (
    <motion.a
      href={sponsor.href ?? "#"}
      target="_blank"
      rel="noopener noreferrer"
      variants={fadeUp}
      className={
        isSocial
          ? hasLogo
            ? defaultLinkClass + " text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            : defaultLinkClass + " text-sm font-medium uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          : hasLogo
            ? defaultLinkClass
            : "flex items-center justify-center min-h-[80px] sm:min-h-[96px] px-6 py-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/60 hover:bg-[var(--bg-tertiary)] hover:border-[var(--border-hover)] transition-all duration-200"
      }
    >
      {sponsor.logoUrl ? (
        <img
          src={sponsor.logoUrl}
          alt={sponsor.name}
          className={
            hasLogoSize
              ? "object-contain opacity-85"
              : DEFAULT_LOGO_TAILWIND
          }
          style={logoStyle}
        />
      ) : (
        !isSocial && (
          <span className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            {sponsor.name}
          </span>
        )
      )}
      {isSocial && !sponsor.logoUrl ? (
        <span>{sponsor.name}</span>
      ) : null}
    </motion.a>
  );

  const showCaption = hasLogo;
  if (showCaption) {
    return (
      <motion.div variants={fadeUp} className="flex flex-col items-center gap-2.5 sm:gap-3">
        {link}
        <span
          className={
            isSocial
              ? "max-w-[28ch] text-center text-sm text-[var(--text-muted)] text-balance"
              : "max-w-[28ch] text-center text-sm text-[var(--text-muted)] text-balance"
          }
        >
          {sponsor.name}
        </span>
      </motion.div>
    );
  }
  return link;
}

export function SponsorsSection() {
  const { t } = useLanguage();
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      className="relative py-14 sm:py-20 overflow-hidden bg-[var(--bg-primary)]"
      aria-label={t("sponsors", "sectionLabel")}
    >
      {/* Top edge: thin gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-[linear-gradient(90deg,transparent_0%,var(--border-color)_20%,var(--border-color)_80%,transparent_100%)] opacity-60" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="text-center mb-12"
        >
          <motion.div variants={fadeUp} className="mb-3">
            <SectionTag color="blue">{t("sponsors", "tag")}</SectionTag>
          </motion.div>
          <motion.h2
            variants={fadeUp}
            className="text-2xl sm:text-3xl font-bold tracking-tight text-white tabular-nums"
          >
            {t("sponsors", "title")}
          </motion.h2>
        </motion.div>

        {/* Co-organizers — centered */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="mb-12"
        >
          <motion.p
            variants={fadeUp}
            className="text-[11px] font-mono uppercase tracking-[0.25em] text-[var(--text-muted)] mb-5 text-center"
          >
            {t("sponsors", "coOrganizersLabel")}
          </motion.p>
          <motion.div
            variants={staggerContainerFast}
            className="flex justify-center gap-4 sm:gap-5"
          >
            {coOrganizers.map((sponsor, index) => (
              <SponsorLogo
                key={`co-${index}`}
                sponsor={sponsor}
                variant="default"
              />
            ))}
          </motion.div>
        </motion.div>

        {/* Divider */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.2 }}
          className="w-12 h-px bg-[var(--border-color)] mb-8 mx-auto"
        />

        {/* Main sponsors — prominent grid */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="mb-12"
        >
          <motion.p
            variants={fadeUp}
            className="text-[11px] font-mono uppercase tracking-[0.25em] text-[var(--text-muted)] mb-5 pl-0.5"
          >
            {t("sponsors", "sponsorsLabel")}
          </motion.p>
          <motion.div
            variants={staggerContainerFast}
            className="flex flex-wrap justify-center gap-4 sm:gap-5"
          >
            {sponsors.map((sponsor, index) => (
              <div
                key={`main-${index}`}
                className="w-full sm:w-[calc((100%-2.5rem)/3)] sm:flex-none"
              >
                <SponsorLogo sponsor={sponsor} variant="default" />
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Divider: short rule before social block */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.3 }}
          className="w-12 h-px bg-[var(--border-color)] mb-8 mx-auto"
        />

        {/* Social sponsors — compact strip */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="mb-12"
        >
          <motion.p
            variants={fadeUp}
            className="text-[11px] font-mono uppercase tracking-[0.25em] text-[var(--text-muted)] mb-5 pl-0.5"
          >
            {t("sponsors", "socialSponsorsLabel")}
          </motion.p>
          <motion.div
            variants={staggerContainerFast}
            className="flex flex-wrap justify-center gap-4 sm:gap-5"
          >
            {socialSponsors.map((sponsor, index) => (
              <div
                key={`social-${index}`}
                className="w-full sm:w-[calc((100%-2.5rem)/3)] sm:flex-none"
              >
                <SponsorLogo sponsor={sponsor} variant="social" />
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
