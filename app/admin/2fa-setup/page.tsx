"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ShieldCheck, Copy, Check } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Logo, NoiseOverlay } from "@/components/ui";

const ISSUER = "CURSOR 48H";

type Step = "password" | "scan" | "verify" | "done";

const LOADING_UI = (
  <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
    <div className="text-[var(--text-muted)]">Loading...</div>
  </div>
);

export default function Admin2FASetupPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [step, setStep] = useState<Step>("password");
  const [password, setPassword] = useState("");
  const [totpUri, setTotpUri] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState<"codes" | "uri" | null>(null);

  useEffect(() => {
    if (isPending) return;
    if (!session?.user) {
      router.replace("/admin/login?callbackUrl=/admin/2fa-setup");
      return;
    }
    const user = session.user as { role?: string; twoFactorEnabled?: boolean };
    if (user.role !== "super_admin") {
      router.replace("/");
      return;
    }
    if (user.twoFactorEnabled) {
      router.replace("/admin/dashboard");
    }
  }, [isPending, session, router]);

  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const { data, error: err } = await authClient.twoFactor.enable({
        password,
        issuer: ISSUER,
      });
      if (err) {
        setError((err as { message?: string }).message ?? "Failed to start 2FA setup.");
        setIsSubmitting(false);
        return;
      }
      if (data?.totpURI) {
        setTotpUri(data.totpURI);
        setBackupCodes(data.backupCodes ?? []);
        setStep("scan");
      } else {
        setError("No TOTP data returned. Try again.");
      }
    } catch {
      setError("Something went wrong. Check your password and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || code.trim().length < 6) {
      setError("Enter the 6-digit code from your authenticator app.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const { data, error: err } = await authClient.twoFactor.verifyTotp({
        code: code.trim(),
        trustDevice: false,
      });
      if (err) {
        setError((err as { message?: string }).message ?? "Invalid code. Try again.");
        setIsSubmitting(false);
        return;
      }
      if (data) {
        setStep("done");
        setTimeout(() => router.replace("/admin/dashboard"), 1500);
      }
    } catch {
      setError("Verification failed. Check the code and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = useCallback(async (text: string, kind: "codes" | "uri") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // ignore
    }
  }, []);

  if (isPending || !session?.user) {
    return (
      <>
        <NoiseOverlay />
        {LOADING_UI}
      </>
    );
  }

  const user = session.user as { role?: string };
  if (user.role !== "super_admin") {
    return null;
  }

  return (
    <>
      <NoiseOverlay />
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-primary)] px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="glass-card p-8">
            <div className="flex justify-center mb-6">
              <ShieldCheck className="h-12 w-12 text-[var(--accent-blue)]" />
            </div>
            <h1 className="text-xl font-bold text-white text-center mb-2">
              Enable two-factor authentication
            </h1>
            <p className="text-[var(--text-secondary)] text-center text-sm mb-6">
              Super admin access requires 2FA. Add your account to an authenticator app, then verify with a code.
            </p>

            {error && (
              <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            {step === "password" && (
              <form onSubmit={handleSubmitPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Your password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-[var(--border-color)] bg-white/5 px-4 py-3 text-white placeholder:text-[var(--text-muted)] focus:border-white/30 focus:outline-none"
                    placeholder="Enter your account password"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full min-h-[48px] rounded-xl border border-[var(--border-color)] bg-white px-6 py-3 font-semibold text-black hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Starting setup…" : "Continue"}
                </button>
              </form>
            )}

            {step === "scan" && (
              <div className="space-y-6">
                <p className="text-sm text-[var(--text-secondary)]">
                  Scan the QR code with your authenticator app (Google Authenticator, Authy, 1Password, etc.), or add the secret manually.
                </p>

                {totpUri && (
                  <div className="flex justify-center rounded-xl bg-white p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(totpUri)}`}
                      alt="TOTP QR code"
                      width={200}
                      height={200}
                    />
                  </div>
                )}

                {backupCodes.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Backup codes (store them safely)
                    </p>
                    <div className="rounded-lg border border-[var(--border-color)] bg-white/5 p-3 font-mono text-xs text-[var(--text-secondary)] break-all">
                      {backupCodes.join(" ")}
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(backupCodes.join("\n"), "codes")}
                      className="mt-2 inline-flex items-center gap-2 text-sm text-[var(--accent-blue)] hover:underline"
                    >
                      {copied === "codes" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied === "codes" ? "Copied" : "Copy backup codes"}
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => copyToClipboard(totpUri, "uri")}
                  className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                >
                  {copied === "uri" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied === "uri" ? "Copied" : "Copy TOTP URI for manual entry"}
                </button>

                <form onSubmit={handleVerify} className="space-y-4 pt-2">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                      Enter the 6-digit code from your app
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="000000"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="w-full rounded-xl border border-[var(--border-color)] bg-white/5 px-4 py-3 text-white text-center text-lg tracking-[0.5em] placeholder:text-[var(--text-muted)] focus:border-white/30 focus:outline-none"
                      maxLength={6}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting || code.length < 6}
                    className="w-full min-h-[48px] rounded-xl border border-[var(--border-color)] bg-white px-6 py-3 font-semibold text-black hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Verifying…" : "Verify and enable 2FA"}
                  </button>
                </form>
              </div>
            )}

            {step === "done" && (
              <div className="text-center py-4">
                <p className="text-emerald-400 font-medium">2FA is now enabled.</p>
                <p className="text-sm text-[var(--text-muted)] mt-2">Redirecting to dashboard…</p>
              </div>
            )}

            <Link
              href="/admin/dashboard"
              className="mt-6 block text-center text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            >
              Back to dashboard
            </Link>
          </div>
        </motion.div>
      </div>
    </>
  );
}
