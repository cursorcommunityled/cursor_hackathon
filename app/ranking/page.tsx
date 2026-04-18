"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Medal,
  Award,
  BarChart3,
  Lock,
  Flag,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Logo, NoiseOverlay } from "@/components/ui";

type JudgeSlotPub = { displayName: string } | null;

type CriterionPub = {
  key: "innovation" | "technicalExecution" | "aiUsage" | "uxUi" | "businessPotential";
  label: string;
  shortLabel: string;
  max: number;
};

type JudgeScorePub = {
  innovation: number;
  technicalExecution: number;
  aiUsage: number;
  uxUi: number;
  businessPotential: number;
  total: number;
} | null;

type RankedTeamPublic = {
  teamId: number;
  teamName: string;
  totalAvg: number;
  grossTotalAvg: number;
  lateSubmissionPenaltyPoints: number;
  usesFinalScoreOverride: boolean;
  avgInnovation: number;
  avgTechnicalExecution: number;
  avgAiUsage: number;
  avgUxUi: number;
  avgBusinessPotential: number;
  judgeCount: number;
  judgeScores: JudgeScorePub[];
};

function getRankIcon(rank: number) {
  if (rank === 1) return <Trophy className="h-6 w-6 text-amber-400" />;
  if (rank === 2) return <Medal className="h-6 w-6 text-gray-300" />;
  if (rank === 3) return <Award className="h-6 w-6 text-orange-400" />;
  return <span className="text-sm font-bold text-[var(--text-muted)]">{rank}</span>;
}

function getRankBorder(rank: number) {
  if (rank === 1) return "border-amber-400/40 bg-amber-400/5";
  if (rank === 2) return "border-gray-300/30 bg-gray-300/5";
  if (rank === 3) return "border-orange-400/30 bg-orange-400/5";
  return "border-[var(--border-color)] bg-[var(--card-bg)]";
}

export default function RankingPage() {
  const [ranking, setRanking] = useState<RankedTeamPublic[]>([]);
  const [judgeSlots, setJudgeSlots] = useState<JudgeSlotPub[]>([]);
  const [criteria, setCriteria] = useState<CriterionPub[]>([]);
  const [finalized, setFinalized] = useState(false);
  const [connected, setConnected] = useState(false);
  const [expandedTeams, setExpandedTeams] = useState<Set<number>>(() => new Set());

  function toggleDetail(teamId: number) {
    setExpandedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) next.delete(teamId);
      else next.add(teamId);
      return next;
    });
  }

  useEffect(() => {
    const es = new EventSource("/api/ranking/stream");

    es.onopen = () => setConnected(true);
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data && Array.isArray(data.ranking)) {
          setRanking(
            data.ranking.map(
              (r: Record<string, unknown>) =>
                ({
                  teamId: Number(r.teamId),
                  teamName: String(r.teamName ?? ""),
                  totalAvg: Number(r.totalAvg),
                  grossTotalAvg: Number(r.grossTotalAvg ?? r.totalAvg),
                  lateSubmissionPenaltyPoints: Number(r.lateSubmissionPenaltyPoints ?? 0),
                  usesFinalScoreOverride: Boolean(r.usesFinalScoreOverride),
                  avgInnovation: Number(r.avgInnovation ?? 0),
                  avgTechnicalExecution: Number(r.avgTechnicalExecution ?? 0),
                  avgAiUsage: Number(r.avgAiUsage ?? 0),
                  avgUxUi: Number(r.avgUxUi ?? 0),
                  avgBusinessPotential: Number(r.avgBusinessPotential ?? 0),
                  judgeCount: Number(r.judgeCount ?? 0),
                  judgeScores: Array.isArray(r.judgeScores)
                    ? (r.judgeScores as JudgeScorePub[])
                    : [],
                }) satisfies RankedTeamPublic,
            ),
          );
          if (Array.isArray(data.judgeSlots)) {
            setJudgeSlots(data.judgeSlots as JudgeSlotPub[]);
          }
          if (Array.isArray(data.criteria)) {
            setCriteria(data.criteria as CriterionPub[]);
          }
          if (typeof data.finalized === "boolean") setFinalized(data.finalized);
        }
      } catch {
        /* ignore parse errors */
      }
    };
    es.onerror = () => {
      setConnected(false);
    };

    return () => {
      es.close();
    };
  }, []);

  const hasJudgeDetail =
    judgeSlots.length > 0 && criteria.length > 0 && judgeSlots.some((s) => s !== null);

  return (
    <>
      <NoiseOverlay />
      <div className="min-h-screen bg-[var(--bg-primary)] px-4 py-8 md:py-12">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="group flex items-center gap-3">
                <Logo size={36} />
                <span className="font-bold text-white hidden sm:block">CURSOR 48H</span>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              {finalized && (
                <div className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Lock className="h-3 w-3" />
                  Final
                </div>
              )}
              <div
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${
                  connected
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}
              >
                <span
                  className={`inline-block h-1.5 w-1.5 rounded-full ${connected ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`}
                />
                {connected ? "Live" : "Reconnecting…"}
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Team ranking</h1>
            <p className="text-[var(--text-secondary)] text-sm md:text-base">
              {finalized
                ? "Official results (0–100). Expand a team to see scores from each judge."
                : "Results will be published by the organizers when ready."}
            </p>
          </motion.div>

          {!finalized ? (
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-12 text-center">
              <Lock className="mx-auto mb-4 h-10 w-10 text-[var(--text-muted)]" />
              <p className="text-[var(--text-secondary)]">Results not published yet</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                The ranking will be available after organizers publish it
              </p>
            </div>
          ) : ranking.length === 0 ? (
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-12 text-center">
              <BarChart3 className="mx-auto mb-4 h-10 w-10 text-[var(--text-muted)]" />
              <p className="text-[var(--text-secondary)]">No scores yet</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Scores will appear here once they are entered
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {ranking.map((team, idx) => {
                  const rank = idx + 1;
                  const detailOpen = expandedTeams.has(team.teamId);
                  return (
                    <motion.div
                      key={team.teamId}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className={`rounded-xl border p-4 md:p-5 transition-colors ${getRankBorder(rank)}`}
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white/5">
                            {getRankIcon(rank)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 min-w-0">
                              <h3
                                className={`font-semibold truncate ${rank <= 3 ? "text-white" : "text-[var(--text-secondary)]"}`}
                              >
                                {team.teamName}
                              </h3>
                              {team.lateSubmissionPenaltyPoints > 0 && (
                                <span
                                  className="inline-flex shrink-0 text-red-500"
                                  title="Team submitted after the project deadline"
                                  aria-label="Late submission: penalty applied after deadline"
                                >
                                  <Flag className="h-4 w-4 text-red-500" strokeWidth={2} aria-hidden />
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <div
                              className={`text-2xl font-bold tabular-nums ${rank <= 3 ? "text-white" : "text-[var(--text-secondary)]"}`}
                            >
                              {team.totalAvg.toFixed(1)}
                            </div>
                            <div className="text-xs text-[var(--text-muted)]">/ 100</div>
                            {!team.usesFinalScoreOverride && team.lateSubmissionPenaltyPoints > 0 && (
                              <div className="text-[10px] text-amber-400/90 mt-0.5">
                                Includes −{team.lateSubmissionPenaltyPoints} late submission
                              </div>
                            )}
                            {team.usesFinalScoreOverride && (
                              <div className="text-[10px] text-sky-400/90 mt-0.5">
                                Official total set by organizers
                              </div>
                            )}
                          </div>
                        </div>

                        {hasJudgeDetail && (
                          <div className="border-t border-[var(--border-color)]/50 pt-3">
                            <button
                              type="button"
                              onClick={() => toggleDetail(team.teamId)}
                              className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-sm text-[var(--accent-blue)] hover:bg-white/5"
                              aria-expanded={detailOpen}
                            >
                              <span className="font-medium">Scores by judge</span>
                              {detailOpen ? (
                                <ChevronDown className="h-4 w-4 shrink-0" />
                              ) : (
                                <ChevronRight className="h-4 w-4 shrink-0" />
                              )}
                            </button>
                            <AnimatePresence initial={false}>
                              {detailOpen && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="mt-2 overflow-x-auto rounded-lg border border-[var(--border-color)]/40 bg-[var(--bg-secondary)]/30">
                                    <table className="w-full min-w-[560px] text-left text-xs">
                                      <thead>
                                        <tr className="border-b border-[var(--border-color)]/50">
                                          <th className="px-2 py-2 font-medium text-[var(--text-secondary)] w-32">
                                            Criterion
                                          </th>
                                          {judgeSlots.map((slot, ji) => (
                                            <th
                                              key={ji}
                                              className="px-2 py-2 text-center font-medium text-[var(--text-secondary)] min-w-[72px]"
                                              title={slot?.displayName}
                                            >
                                              {slot ? (
                                                <span className="line-clamp-2">{slot.displayName}</span>
                                              ) : (
                                                <span className="text-[var(--text-muted)]">—</span>
                                              )}
                                            </th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {criteria.map((c) => (
                                          <tr
                                            key={c.key}
                                            className="border-b border-[var(--border-color)]/30"
                                          >
                                            <td className="px-2 py-1.5 text-[var(--text-secondary)]">
                                              {c.label}{" "}
                                              <span className="text-[var(--text-muted)]">(max {c.max})</span>
                                            </td>
                                            {team.judgeScores.map((cell, ji) => (
                                              <td
                                                key={ji}
                                                className="px-2 py-1.5 text-center tabular-nums text-white"
                                              >
                                                {cell ? (
                                                  cell[c.key]
                                                ) : judgeSlots[ji] ? (
                                                  "—"
                                                ) : (
                                                  ""
                                                )}
                                              </td>
                                            ))}
                                          </tr>
                                        ))}
                                        <tr className="bg-white/5 font-semibold">
                                          <td className="px-2 py-2 text-[var(--text-secondary)]">
                                            Judge total
                                          </td>
                                          {team.judgeScores.map((cell, ji) => (
                                            <td
                                              key={ji}
                                              className="px-2 py-2 text-center tabular-nums text-white"
                                            >
                                              {cell ? (
                                                cell.total.toFixed(1)
                                              ) : judgeSlots[ji] ? (
                                                "—"
                                              ) : (
                                                ""
                                              )}
                                            </td>
                                          ))}
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                  <p className="mt-2 text-[11px] leading-relaxed text-[var(--text-muted)]">
                                    Average across judges (by criterion): Innov.{" "}
                                    {team.avgInnovation.toFixed(1)} · Tech.{" "}
                                    {team.avgTechnicalExecution.toFixed(1)} · AI{" "}
                                    {team.avgAiUsage.toFixed(1)} · UX {team.avgUxUi.toFixed(1)} · Bus.{" "}
                                    {team.avgBusinessPotential.toFixed(1)} · before penalty:{" "}
                                    {team.grossTotalAvg.toFixed(1)} · judges counted: {team.judgeCount}
                                  </p>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
