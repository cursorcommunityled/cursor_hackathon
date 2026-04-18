"use client";

import React, { useState, useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import type { TranslationKey } from "@/lib/i18n";
import {
  SectionTag,
  IconChip,
  IconCode,
  IconGlobe,
  IconTarget,
  IconZap,
} from "@/components/ui";
import { fadeUp } from "@/lib/animations";

const criteria = [
  {
    id: "innovation",
    percentage: 25,
    color: "var(--accent-blue)",
    icon: IconZap,
    titleKey: "innovation",
    descKey: "innovationDesc",
  },
  {
    id: "technical",
    percentage: 25,
    color: "var(--accent-purple)",
    icon: IconCode,
    titleKey: "technical",
    descKey: "technicalDesc",
  },
  {
    id: "ai",
    percentage: 20,
    color: "var(--accent-green)",
    icon: IconChip,
    titleKey: "ai",
    descKey: "aiDesc",
  },
  {
    id: "ux",
    percentage: 15,
    color: "#0891B2",
    icon: IconGlobe, // utilizing existing icon
    titleKey: "ux",
    descKey: "uxDesc",
  },
  {
    id: "business",
    percentage: 15,
    color: "#B45309",
    icon: IconTarget,
    titleKey: "business",
    descKey: "businessDesc",
  },
];

/** Stabilizes SVG path strings across Node (SSR) and browser (different float semantics). */
function svgCoord(n: number): number {
  return Math.round(n * 10_000) / 10_000;
}

// Calculate pie chart segments
function calculatePieSegments() {
  let currentAngle = -90;
  return criteria.map((item) => {
    const angle = (item.percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    // Geometry
    const radius = 120;
    const innerRadius = 80; // Increased inner radius for "ring" look
    const centerX = 150;
    const centerY = 150;

    // SVG Path calculation
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = svgCoord(centerX + radius * Math.cos(startRad));
    const y1 = svgCoord(centerY + radius * Math.sin(startRad));
    const x2 = svgCoord(centerX + radius * Math.cos(endRad));
    const y2 = svgCoord(centerY + radius * Math.sin(endRad));

    const x3 = svgCoord(centerX + innerRadius * Math.cos(endRad));
    const y3 = svgCoord(centerY + innerRadius * Math.sin(endRad));
    const x4 = svgCoord(centerX + innerRadius * Math.cos(startRad));
    const y4 = svgCoord(centerY + innerRadius * Math.sin(startRad));

    const largeArc = angle > 180 ? 1 : 0;

    return {
      ...item,
      d: `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`,
      midAngle: (startAngle + endAngle) / 2,
    };
  });
}

function CircularChart({
  hoveredId,
  setHoveredId,
}: {
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const rotate = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const rotateReverse = useTransform(scrollYProgress, [0, 1], [0, -45]);
  const smoothRotate = useSpring(rotate, { stiffness: 50, damping: 20 });
  const smoothRotateReverse = useSpring(rotateReverse, {
    stiffness: 50,
    damping: 20,
  });

  const segments = calculatePieSegments();

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-full sm:max-w-[400px] md:max-w-[500px] aspect-square flex items-center justify-center"
    >
      {/* Outer Decorative Ring - Spins Fast */}
      <motion.div
        style={{ rotate: smoothRotate }}
        className="absolute inset-0 rounded-full border border-[var(--border-color)] border-dashed opacity-20 pointer-events-none"
      />

      {/* Inner Decorative Ring - Spins Reverse */}
      <motion.div
        style={{ rotate: smoothRotateReverse }}
        className="absolute inset-[15%] rounded-full border border-[var(--border-color)] opacity-30 pointer-events-none"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full" />
      </motion.div>

      {/* Main Chart SVG */}
      <motion.svg
        viewBox="0 0 300 300"
        className="w-full h-full relative z-10"
        style={{ rotate: smoothRotate }}
      >
        {segments.map((segment) => (
          <motion.path
            key={segment.id}
            d={segment.d}
            fill={segment.color}
            stroke="rgba(0,0,0,0.5)"
            strokeWidth="2"
            initial={{ opacity: 0.8, scale: 1 }}
            animate={{
              opacity: hoveredId === segment.id ? 1 : hoveredId ? 0.3 : 0.8,
              scale: hoveredId === segment.id ? 1.05 : 1,
              filter:
                hoveredId === segment.id
                  ? `drop-shadow(0 0 10px ${segment.color})`
                  : "none",
            }}
            transition={{ duration: 0.3 }}
            style={{ transformOrigin: "150px 150px", cursor: "pointer" }}
            onMouseEnter={() => setHoveredId(segment.id)}
            onMouseLeave={() => setHoveredId(null)}
          />
        ))}
      </motion.svg>

      {/* Center Display */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
        <div className="text-center">
          <div className="text-xs uppercase tracking-widest text-[var(--text-muted)] mb-1">
            Total
          </div>
          <div className="text-2xl sm:text-3xl md:text-4xl font-black text-white">100%</div>
        </div>
      </div>
    </div>
  );
}

function CriteriaList({
  t,
  hoveredId,
  setHoveredId,
}: {
  t: (section: TranslationKey, key: string) => string;
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
}) {
  return (
    <div className="space-y-4">
      {criteria.map((item) => (
        <motion.div
          key={item.id}
          className="group relative p-3 sm:p-4 rounded-xl border transition-all cursor-pointer overflow-hidden"
          style={{
            borderColor: hoveredId === item.id ? item.color : "transparent",
            backgroundColor:
              hoveredId === item.id ? `${item.color}10` : "var(--bg-secondary)",
          }}
          onMouseEnter={() => setHoveredId(item.id)}
          onMouseLeave={() => setHoveredId(null)}
          whileHover={{ x: 10 }}
        >
          {/* Progress Bar Background */}
          <div className="absolute bottom-0 left-0 h-1 bg-[var(--border-color)] w-full opacity-20">
            <motion.div
              className="h-full"
              style={{
                backgroundColor: item.color,
                width: `${item.percentage}%`,
              }}
            />
          </div>

            <div className="flex items-start gap-3 sm:gap-4 relative z-10">
            {/* Icon Box */}
            <div
              className="w-11 h-11 min-w-[44px] min-h-[44px] sm:w-12 sm:h-12 rounded-lg flex items-center justify-center shrink-0 border border-[var(--border-color)] group-hover:border-transparent transition-colors"
              style={{
                backgroundColor:
                  hoveredId === item.id ? item.color : "transparent",
              }}
            >
              <item.icon
                size={24}
                className={
                  hoveredId === item.id
                    ? "text-white"
                    : "text-[var(--text-muted)]"
                }
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base sm:text-lg font-bold text-white group-hover:text-[var(--accent-blue)] transition-colors">
                  {t("criteria", item.titleKey)}
                </span>
                <span className="text-xs sm:text-sm font-mono opacity-50">
                  {item.percentage}%
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                {t("criteria", item.descKey)}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function EvaluationCriteria() {
  const { t } = useLanguage();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <section id="criteria" className="relative py-16 sm:py-24 md:py-32 overflow-hidden bg-[var(--bg-primary)]">
      {/* Background Noise/Grid */}
      <div className="absolute inset-0 grid-pattern opacity-30 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16 md:mb-20">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <SectionTag color="blue">{t("criteria", "tag")}</SectionTag>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mt-8 mb-6">
              {t("criteria", "title")}
            </h2>
            <p className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto">
              {t("criteria", "subtitle")}
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          {/* Left: Spinning Chart */}
          <div className="flex justify-center order-1">
            <CircularChart hoveredId={hoveredId} setHoveredId={setHoveredId} />
          </div>

          {/* Right: Bullet Points */}
          <div className="order-2">
            <CriteriaList
              t={t}
              hoveredId={hoveredId}
              setHoveredId={setHoveredId}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
