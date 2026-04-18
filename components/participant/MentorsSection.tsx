"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { SectionTag } from "@/components/ui";
import {
  staggerContainer,
  fadeUp,
  scaleUp,
  viewportOnce,
} from "@/lib/animations";

/** Generic silhouette for open-source template (replace with your event assets). */
const MENTOR_PLACEHOLDER = "/judges/judge_placeholder.jpg";
const mentorKeys = [
  {
    id: "1",
    photoSrc: MENTOR_PLACEHOLDER,
    nameKey: "mentor1Name",
    companyKey: "mentor1Company",
  },
  {
    id: "2",
    photoSrc: MENTOR_PLACEHOLDER,
    nameKey: "mentor2Name",
    companyKey: "mentor2Company",
  },
  {
    id: "3",
    photoSrc: MENTOR_PLACEHOLDER,
    nameKey: "mentor3Name",
    companyKey: "mentor3Company",
  },
  {
    id: "4",
    photoSrc: MENTOR_PLACEHOLDER,
    nameKey: "mentor4Name",
    companyKey: "mentor4Company",
  },
  {
    id: "5",
    photoSrc: MENTOR_PLACEHOLDER,
    nameKey: "mentor5Name",
    companyKey: "mentor5Company",
  },
  {
    id: "6",
    photoSrc: MENTOR_PLACEHOLDER,
    nameKey: "mentor6Name",
    companyKey: "mentor6Company",
  },
    {
      id: "7",
      photoSrc: MENTOR_PLACEHOLDER,
      nameKey: "mentor7Name",
      companyKey: "mentor7Company",
    },
    {
      id: "8",
      photoSrc: MENTOR_PLACEHOLDER,
      nameKey: "mentor8Name",
      companyKey: "mentor8Company",
    },
    {
      id: "9",
      photoSrc: MENTOR_PLACEHOLDER,
      nameKey: "mentor9Name",
      companyKey: "mentor9Company",
    },
    {
      id: "10",
      photoSrc: MENTOR_PLACEHOLDER,
      nameKey: "mentor10Name",
      companyKey: "mentor10Company",
    },

] as const;

export function MentorsSection() {
  const { t } = useLanguage();

  return (
    <section
      id="mentors"
      className="relative py-16 sm:py-24 md:py-32 overflow-hidden bg-[var(--bg-primary)]"
    >
      <div className="absolute inset-0 grid-pattern opacity-20 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="text-center mb-12 sm:mb-16 md:mb-20"
        >
          <motion.div variants={fadeUp}>
            <SectionTag color="purple">{t("mentors", "tag")}</SectionTag>
          </motion.div>
          <motion.h2
            variants={fadeUp}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mt-6 mb-4"
          >
            {t("mentors", "title")}
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto"
          >
            {t("mentors", "subtitle")}
          </motion.p>
        </motion.div>

        <motion.div
          className="flex flex-wrap justify-center gap-6 lg:gap-8"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          {mentorKeys.map((mentor) => (
            <motion.article
              key={mentor.id}
              variants={scaleUp}
              className="w-full md:w-[calc((100%-3rem)/3)] lg:w-[calc((100%-4rem)/3)] rounded-2xl border border-[var(--border-color)] p-6 text-center flex flex-col items-center shadow-lg shadow-black/20"
            >
              {/* 80% of JudgesSection photo frame (max-w-[280px] aspect 4/5 → 224px wide). */}
              <div className="relative w-full max-w-[224px] mx-auto aspect-[4/5] rounded-2xl overflow-hidden border border-[var(--border-color)] bg-[var(--bg-tertiary)] shadow-lg shadow-black/20">
                <Image
                  src={mentor.photoSrc}
                  alt={t("mentors", mentor.nameKey)}
                  fill
                  sizes="(max-width: 768px) 100vw, 224px"
                  className="object-cover object-top"
                />
              </div>
              <h3 className="mt-6 text-lg font-bold text-white text-center text-balance">
                {t("mentors", mentor.nameKey)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)] text-center text-balance max-w-sm mx-auto">
                {t("mentors", mentor.companyKey)}
              </p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
