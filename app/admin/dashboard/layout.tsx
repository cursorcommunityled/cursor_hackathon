"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Users,
  UserCog,
  Coins,
  Building2,
  ClipboardCheck,
  ListChecks,
  Gavel,
  FolderGit2,
  Trophy,
  BarChart3,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Logo, NoiseOverlay } from "@/components/ui";

type AuthStatus = "loading" | "forbidden" | "no-2fa" | "unverified" | "ok";

const LOADING_UI = (
  <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
    <div className="text-[var(--text-muted)]">Loading...</div>
  </div>
);

export default function AdminDashboardLayout({
  children,
}: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const [stepUpCode, setStepUpCode] = useState("");
  const [stepUpError, setStepUpError] = useState<string | null>(null);
  const [stepUpSubmitting, setStepUpSubmitting] = useState(false);

  const check2FA = useCallback(async () => {
    const res = await fetch("/api/admin/security/2fa", { credentials: "include" });
    if (res.status === 401 || res.status === 403) {
      setAuthStatus("forbidden");
      return;
    }
    if (!res.ok) {
      setAuthStatus("forbidden");
      return;
    }
    const json = await res.json();
    if (!json.success || !json.data) {
      setAuthStatus("forbidden");
      return;
    }
    const { twoFactorEnabled, verified } = json.data;
    if (!twoFactorEnabled) {
      setAuthStatus("no-2fa");
      return;
    }
    if (!verified) {
      setAuthStatus("unverified");
      return;
    }
    setAuthStatus("ok");
  }, []);

  useEffect(() => {
    if (sessionPending) return;
    if (!session?.user) {
      router.replace("/admin/login?callbackUrl=/admin/dashboard");
      return;
    }
    const user = session.user as { role?: string };
    if (user.role !== "super_admin") {
      setAuthStatus("forbidden");
      return;
    }
    void check2FA();
  }, [sessionPending, session?.user, router, check2FA]);

  const handleSignOut = async () => {
    await authClient.signOut();
    router.replace("/admin/login");
  };

  const handleStepUpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setStepUpError(null);
    setStepUpSubmitting(true);
    try {
      const res = await fetch("/api/admin/security/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code: stepUpCode.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setStepUpError(json?.error?.message ?? "Verification failed. Check the code and try again.");
        setStepUpSubmitting(false);
        return;
      }
      setAuthStatus("ok");
    } catch {
      setStepUpError("Request failed. Try again.");
    } finally {
      setStepUpSubmitting(false);
    }
  };

  if (sessionPending || authStatus === "loading") {
    return (
      <>
        <NoiseOverlay />
        {LOADING_UI}
      </>
    );
  }

  if (authStatus === "forbidden") {
    return (
      <>
        <NoiseOverlay />
        <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-primary)] px-4">
          <div className="glass-card p-8 text-center max-w-md">
            <h1 className="text-xl font-bold text-white mb-2">Access denied</h1>
            <p className="text-[var(--text-secondary)] mb-6">
              Super admin dashboard requires 2FA verification.
            </p>
            <Link
              href="/"
              className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            >
              Back to home
            </Link>
          </div>
        </div>
      </>
    );
  }

  if (authStatus === "no-2fa") {
    return (
      <>
        <NoiseOverlay />
        <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-primary)] px-4">
          <div className="glass-card p-8 text-center max-w-md">
            <ShieldCheck className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">2FA required</h1>
            <p className="text-[var(--text-secondary)] mb-6">
              Enable two-factor authentication in your account first, then return here to verify and access the dashboard.
            </p>
            <Link
              href="/admin/2fa-setup"
              className="inline-flex items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--accent-blue)]/20 px-5 py-2.5 text-sm font-medium text-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/30"
            >
              Enable 2FA now
            </Link>
          </div>
        </div>
      </>
    );
  }

  if (authStatus === "unverified") {
    return (
      <>
        <NoiseOverlay />
        <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-primary)] px-4">
          <div className="glass-card p-8 w-full max-w-sm">
            <div className="flex justify-center mb-6">
              <ShieldCheck className="w-10 h-10 text-white/80" />
            </div>
            <h1 className="text-xl font-bold text-white text-center mb-2">
              Step-up verification
            </h1>
            <p className="text-[var(--text-secondary)] text-center text-sm mb-6">
              Enter the code from your authenticator app to continue.
            </p>
            {stepUpError && (
              <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {stepUpError}
              </div>
            )}
            <form onSubmit={handleStepUpVerify} className="flex flex-col gap-4">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                value={stepUpCode}
                onChange={(e) =>
                  setStepUpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className="w-full rounded-xl border border-[var(--border-color)] bg-white/5 px-4 py-3 text-white text-center text-lg tracking-[0.5em] placeholder:text-[var(--text-muted)] focus:border-white/30 focus:outline-none"
                maxLength={6}
              />
              <button
                type="submit"
                disabled={stepUpSubmitting || stepUpCode.length < 6}
                className="w-full min-h-[48px] rounded-xl border border-[var(--border-color)] bg-white px-6 py-3 font-semibold text-black hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {stepUpSubmitting ? "Verifying…" : "Verify"}
              </button>
            </form>
            <p className="mt-4 text-center text-xs text-[var(--text-muted)]">
              Verification lasts 15 minutes.
            </p>
          </div>
        </div>
      </>
    );
  }

  const navItems = [
    { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/dashboard/teams", label: "Teams", icon: Users },
    { href: "/admin/dashboard/users", label: "Users", icon: UserCog },
    { href: "/admin/dashboard/staff", label: "Judges & Mentors", icon: Gavel },
    { href: "/admin/dashboard/projects", label: "Projects", icon: FolderGit2 },
    { href: "/admin/dashboard/screening", label: "Screening", icon: ClipboardCheck },
    { href: "/admin/dashboard/screening/questions", label: "Screening questions", icon: ListChecks },
    { href: "/admin/dashboard/partners", label: "Partners", icon: Building2 },
    { href: "/admin/dashboard/credits", label: "Credits", icon: Coins },
    { href: "/admin/dashboard/scores", label: "Final scores", icon: BarChart3 },
    { href: "/admin/dashboard/ranking", label: "Publish Results", icon: Trophy },
  ];

  const user = session?.user as { name?: string; email?: string } | undefined;
  const userName = user?.name ?? user?.email ?? "Admin";
  const userEmail = user?.email ?? "";

  const sidebar = (
    <div className="flex h-full flex-col border-r border-[var(--border-color)] bg-[var(--card-bg)]">
      <div className="shrink-0 border-b border-[var(--border-color)] bg-[linear-gradient(135deg,rgba(59,130,246,0.1),rgba(168,85,247,0.06))] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/5">
            <Logo size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-white">
              Super Admin
            </span>
            <span className="block truncate text-xs text-[var(--text-secondary)]">
              {userEmail || "—"}
            </span>
          </div>
        </div>
      </div>
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/admin/dashboard"
              ? pathname === "/admin/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex h-11 w-full items-center gap-3 rounded-lg px-3 transition-all duration-200 ${
                isActive
                  ? "bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] border-l-2 border-[var(--accent-blue)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="shrink-0 border-t border-[var(--border-color)] p-2">
        <button
          type="button"
          onClick={handleSignOut}
          className="flex h-11 w-full items-center gap-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)]/80 px-3 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-tertiary)] hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <NoiseOverlay />
      <DashboardLayout sidebar={sidebar}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      </DashboardLayout>
    </>
  );
}
