"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { SectionTag } from "@/components/ui";
import { staggerContainer, fadeUp, scaleUp, viewportOnce } from "@/lib/animations";

const JUDGE_PLACEHOLDER = "/judges/judge_placeholder.jpg";
const judgeKeys = [
  {
    id: "1",
    photoSrc: JUDGE_PLACEHOLDER,
    nameKey: "judge1Name",
    roleKey: "judge1Role",
    descKey: "judge1Desc",
  },
  {
    id: "2",
    photoSrc: JUDGE_PLACEHOLDER,
    nameKey: "judge2Name",
    roleKey: "judge2Role",
    descKey: "judge2Desc",
  },
  {
    id: "3",
    photoSrc: JUDGE_PLACEHOLDER,
    nameKey: "judge3Name",
    roleKey: "judge3Role",
    descKey: "judge3Desc",
  },
  {
    id: "4",
    photoSrc: JUDGE_PLACEHOLDER,
    nameKey: "judge4Name",
    roleKey: "judge4Role",
    descKey: "judge4Desc",
  },
  {
    id: "5",
    photoSrc: JUDGE_PLACEHOLDER,
    nameKey: "judge5Name",
    roleKey: "judge5Role",
    descKey: "judge5Desc",
  },
  {
    id: "6",
    photoSrc: JUDGE_PLACEHOLDER,
    nameKey: "judge6Name",
    roleKey: "judge6Role",
    descKey: "judge6Desc",
  },
] as const;

export function JudgesSection() {
  const { t } = useLanguage();

  return (
    <section id="judges" className="relative py-16 sm:py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--bg-secondary)]" />
      <div className="absolute inset-0 grid-pattern opacity-25 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="text-center mb-12 sm:mb-16 md:mb-20"
        >
          <motion.div variants={fadeUp}>
            <SectionTag color="green">{t("judges", "tag")}</SectionTag>
          </motion.div>
          <motion.h2
            variants={fadeUp}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mt-6 mb-4"
          >
            {t("judges", "title")}
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto"
          >
            {t("judges", "subtitle")}
          </motion.p>
        </motion.div>

        <motion.div
          className="flex flex-wrap justify-center gap-8 lg:gap-10"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          {judgeKeys.map((judge) => (
            <motion.article
              key={judge.id}
              variants={scaleUp}
              className="flex w-full flex-col items-center text-center md:max-w-[calc((100%-4rem)/3)] lg:max-w-[calc((100%-5rem)/3)]"
            >
              <div className="relative w-full max-w-[280px] mx-auto aspect-[4/5] rounded-2xl overflow-hidden border border-[var(--border-color)] bg-[var(--bg-tertiary)] shadow-lg shadow-black/20">
                <Image
                  src={judge.photoSrc}
                  alt={t("judges", judge.nameKey)}
                  fill
                  sizes="(max-width: 768px) 100vw, 280px"
                  className="object-cover object-top"
                />
              </div>
              <h3 className="mt-6 text-xl font-bold text-white text-center text-balance">
                {t("judges", judge.nameKey)}
              </h3>
              <p className="mt-1 text-sm font-medium text-[var(--accent-green)] text-center text-balance">
                {t("judges", judge.roleKey)}
              </p>
              <p className="mt-3 text-sm text-[var(--text-secondary)] leading-relaxed max-w-sm mx-auto text-center text-balance">
                {t("judges", judge.descKey)}
              </p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
