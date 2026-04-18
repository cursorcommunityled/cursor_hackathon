"use client";

import { motion, useInView, useTransform, useScroll } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { SectionTag, IconTrophy, IconStar, IconCrown } from "@/components/ui";
import { fadeUp } from "@/lib/animations";

function Counter({
  value,
  duration = 3,
}: {
  value: number;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number | null = null;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min(
        (currentTime - startTime) / (duration * 1000),
        1,
      );
      const easeOut = 1 - Math.pow(1 - progress, 4); // Smoother exponential ease
      setCount(Math.floor(easeOut * value));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isInView, value, duration]);

  return <span ref={ref}>{count.toLocaleString("en-US")}</span>;
}

const prizes = [
  {
    place: 2,
    credits: 1500,
    color: "var(--accent-purple)",
    label: "2nd",
    icon: IconStar,
    height: 180,
  },
  {
    place: 1,
    credits: 2500,
    color: "var(--accent-blue)",
    label: "1st",
    icon: IconTrophy,
    height: 240,
  },
  {
    place: 3,
    credits: 1000,
    color: "var(--accent-green)",
    label: "3rd",
    icon: IconCrown,
    height: 140,
  },
];

export function PrizeFund() {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [30, -30]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.95, 1]);

  return (
    <section
      id="prizes"
      ref={containerRef}
      className="relative py-16 sm:py-24 md:py-32 overflow-hidden bg-[var(--bg-secondary)] perspective-1000"
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--accent-blue)/10_0%,transparent_70%)] opacity-30 pointer-events-none" />
      <motion.div
        style={{ y, scale }}
        className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-10 pointer-events-none origin-center"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-12 sm:mb-16 md:mb-24"
        >
          <motion.div variants={fadeUp}>
            <SectionTag color="blue">{t("prizeFund", "tag")}</SectionTag>
          </motion.div>

          <motion.div className="mt-8 mb-6 relative inline-block">
            {/* Glitch Effect Text */}
            <motion.h2
              className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white relative z-10"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
            >
              {t("prizeFund", "title")}
            </motion.h2>
            <div className="absolute -inset-1 bg-blue-500/20 blur-xl -z-10" />
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="flex flex-col items-center justify-center gap-2"
          >
            <div className="text-[50px] sm:text-[80px] md:text-[100px] lg:text-[140px] font-black leading-none bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/10 tracking-tighter drop-shadow-[0_0_30px_rgba(59,130,246,0.3)]">
              <Counter value={5000} />
            </div>
            <p className="text-[var(--text-secondary)] text-lg max-w-xl mx-auto uppercase tracking-widest font-mono">
              {t("prizeFund", "creditsLabel")} · {t("prizeFund", "forTeam")}
            </p>
          </motion.div>
        </motion.div>

        {/* 3D Podium Display */}
        <div className="flex flex-col md:flex-row items-end justify-center gap-4 md:gap-8 h-auto md:h-[400px] lg:h-[500px] perspective-1000">
          {prizes.map((prize, index) => (
            <motion.div
              key={prize.place}
              className={`relative flex flex-col items-center justify-end w-full md:w-1/3 max-w-full sm:max-w-[280px] md:max-w-[320px] mx-auto ${
                prize.place === 1 
                  ? "order-1 md:order-2 z-20" 
                  : prize.place === 2 
                    ? "order-2 md:order-1 z-10" 
                    : "order-3 md:order-3 z-10"
              }`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                delay: index * 0.15,
                duration: 0.5,
                ease: [0.25, 0.4, 0.25, 1],
              }}
            >
              {/* Floating Card */}
              <motion.div
                className="relative w-full mb-6 sm:mb-8 p-4 sm:p-6 rounded-2xl border bg-[var(--bg-primary)] sm:backdrop-blur-xl text-center group"
                style={{ borderColor: prize.color }}
                initial={{ y: 0 }}
                animate={{ y: [0, -6, 0] }}
                transition={{
                  duration: 5 + index,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                whileHover={{
                  y: -12,
                  scale: 1.03,
                  boxShadow: `0 16px 32px ${prize.color}20`,
                }}
              >
                {/* Top Icon */}
                <div
                  className="absolute -top-8 sm:-top-10 left-1/2 -translate-x-1/2 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-3xl font-bold bg-[var(--bg-secondary)] border-2 shadow-lg"
                  style={{
                    borderColor: prize.color,
                    boxShadow: `0 10px 30px ${prize.color}40`,
                  }}
                >
                  <prize.icon size={32} className="sm:hidden" style={{ color: prize.color }} />
                  <prize.icon size={40} className="hidden sm:block" style={{ color: prize.color }} />
                </div>

                <div className="mt-8 sm:mt-10">
                  <div className="text-xs sm:text-sm uppercase tracking-widest text-[var(--text-muted)] mb-2 font-mono">
                    {t("prizeFund", `place${prize.place}`)}
                  </div>
                  <div
                    className="text-2xl sm:text-4xl md:text-5xl font-black text-white"
                    style={{ textShadow: `0 0 20px ${prize.color}50` }}
                  >
                    {prize.credits.toLocaleString("en-US")}
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1 font-mono">
                    {t("prizeFund", "creditsLabel")} · {t("prizeFund", "forTeam")}
                  </p>
                </div>

                {/* Shine effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </motion.div>

              {/* Podium Base */}
              <motion.div
                className="w-full rounded-t-3xl relative overflow-hidden flex items-end justify-center pb-6"
                style={{
                  height: prize.height,
                  background: `linear-gradient(to bottom, ${prize.color}20, transparent)`,
                  borderTop: `1px solid ${prize.color}50`,
                  borderLeft: `1px solid ${prize.color}20`,
                  borderRight: `1px solid ${prize.color}20`,
                }}
                initial={{ height: 0 }}
                whileInView={{ height: prize.height }}
                viewport={{ once: true }}
                transition={{
                  delay: 0.5 + index * 0.2,
                  duration: 1,
                  ease: "easeOut",
                }}
              >
                {/* Internal Grid/Tech pattern */}
                <div
                  className="absolute inset-0 w-full h-full opacity-30"
                  style={{
                    backgroundImage: `linear-gradient(${prize.color} 1px, transparent 1px), linear-gradient(90deg, ${prize.color} 1px, transparent 1px)`,
                    backgroundSize: "20px 20px",
                  }}
                />

                {/* Glowing Core */}
                <motion.div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-1/2 blur-2xl opacity-40"
                  style={{ background: prize.color }}
                  animate={{ opacity: [0.2, 0.35, 0.2] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />

                <div className="relative z-10 text-4xl sm:text-5xl md:text-6xl font-black text-white/10 select-none">
                  {prize.place}
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
