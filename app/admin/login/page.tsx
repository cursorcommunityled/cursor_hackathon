"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Logo, NoiseOverlay } from "@/components/ui";

const LOADING_UI = (
  <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
    <div className="text-[var(--text-muted)]">Loading...</div>
  </div>
);

export default function AdminLoginPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needs2FA, setNeeds2FA] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifySubmitting, setVerifySubmitting] = useState(false);

  useEffect(() => {
    if (!isPending && session?.user) {
      const user = session.user as { role?: string };
      if (user.role === "super_admin") {
        router.replace("/admin/dashboard");
      } else {
        router.replace("/");
      }
    }
  }, [isPending, router, session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setVerifyError(null);
    setIsSubmitting(true);

    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await authClient.signUp.email({
          name: name.trim() || email.trim(),
          email: email.trim(),
          password,
          callbackURL: "/admin/dashboard",
        });

        if (signUpError) {
          const err = signUpError as { message?: string };
          setError(err.message ?? "Sign-up failed. Your email must be in SUPER_ADMIN_EMAILS.");
          setIsSubmitting(false);
          return;
        }

        const redirectUrl = (data as { url?: string })?.url;
        if (redirectUrl) {
          window.location.href = redirectUrl;
          return;
        }
      } else {
        const { data, error: signInError } = await authClient.signIn.email(
          {
            email: email.trim(),
            password,
            callbackURL: "/admin/dashboard",
          },
          {
            onSuccess(context) {
              if ((context.data as { twoFactorRedirect?: boolean })?.twoFactorRedirect) {
                setNeeds2FA(true);
                setIsSubmitting(false);
              }
            },
          },
        );

        if (signInError) {
          const err = signInError as { message?: string };
          setError(err.message ?? "Sign-in failed.");
          setIsSubmitting(false);
          return;
        }

        const redirectUrl = (data as { url?: string })?.url;
        if (redirectUrl) {
          window.location.href = redirectUrl;
          return;
        }
        if ((data as { twoFactorRedirect?: boolean })?.twoFactorRedirect) {
          setNeeds2FA(true);
        }
      }

      setIsSubmitting(false);
    } catch (err) {
      setIsSubmitting(false);
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totpCode.trim().length < 6) {
      setVerifyError("Enter the 6-digit code from your authenticator app.");
      return;
    }
    setVerifyError(null);
    setVerifySubmitting(true);
    try {
      const { data, error: verifyErr } = await authClient.twoFactor.verifyTotp({
        code: totpCode.trim(),
        trustDevice: false,
      });
      if (verifyErr) {
        setVerifyError((verifyErr as { message?: string }).message ?? "Invalid code. Try again.");
        setVerifySubmitting(false);
        return;
      }
      if (data) {
        router.replace("/admin/dashboard");
        return;
      }
      setVerifySubmitting(false);
    } catch {
      setVerifyError("Verification failed. Try again.");
      setVerifySubmitting(false);
    }
  };

  if (isPending || (session?.user && !needs2FA)) {
    return (
      <>
        <NoiseOverlay />
        {LOADING_UI}
      </>
    );
  }

  if (needs2FA) {
    return (
      <>
        <NoiseOverlay />
        <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-primary)] px-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm"
          >
            <div className="glass-card p-8">
              <div className="flex justify-center mb-6">
                <ShieldCheck className="w-10 h-10 text-white/80" />
              </div>
              <h1 className="text-xl font-bold text-white text-center mb-2">
                Two-factor verification
              </h1>
              <p className="text-[var(--text-secondary)] text-center text-sm mb-6">
                Enter the code from your authenticator app to finish signing in.
              </p>
              {verifyError ? (
                <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {verifyError}
                </div>
              ) : null}
              <form onSubmit={handleVerify2FA} className="flex flex-col gap-4">
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="000000"
                  value={totpCode}
                  onChange={(e) =>
                    setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className="w-full rounded-xl border border-[var(--border-color)] bg-white/5 px-4 py-3 text-white text-center text-lg tracking-[0.5em] placeholder:text-[var(--text-muted)] focus:border-white/30 focus:outline-none"
                  maxLength={6}
                />
                <button
                  type="submit"
                  disabled={verifySubmitting || totpCode.length < 6}
                  className="w-full min-h-[48px] rounded-xl border border-[var(--border-color)] bg-white px-6 py-3 font-semibold text-black hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verifySubmitting ? "Verifying…" : "Verify"}
                </button>
              </form>
              <button
                type="button"
                onClick={() => setNeeds2FA(false)}
                className="mt-6 w-full text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              >
                Use different account
              </button>
              <Link
                href="/"
                className="mt-4 block text-center text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              >
                Back to home
              </Link>
            </div>
          </motion.div>
        </div>
      </>
    );
  }

  return (
    <>
      <NoiseOverlay />
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-primary)] px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="glass-card p-8 sm:p-10 flex flex-col items-center text-center">
            <Logo size={48} className="mb-6" />
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Super Admin
            </h1>
            <p className="text-[var(--text-secondary)] mb-6">
              Sign in or create an account with an email in SUPER_ADMIN_EMAILS.
            </p>

            <div className="flex rounded-xl border border-[var(--border-color)] p-1 mb-6 w-full">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === "signin"
                    ? "bg-white text-black"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === "signup"
                    ? "bg-white text-black"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                }`}
              >
                Sign up
              </button>
            </div>

            {error ? (
              <div className="w-full mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
              {mode === "signup" ? (
                <input
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border-color)] bg-white/5 px-4 py-3 text-white placeholder:text-[var(--text-muted)] focus:border-white/30 focus:outline-none"
                  autoComplete="name"
                />
              ) : null}
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-[var(--border-color)] bg-white/5 px-4 py-3 text-white placeholder:text-[var(--text-muted)] focus:border-white/30 focus:outline-none"
                autoComplete="email"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full rounded-xl border border-[var(--border-color)] bg-white/5 px-4 py-3 text-white placeholder:text-[var(--text-muted)] focus:border-white/30 focus:outline-none"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[48px] rounded-xl border border-[var(--border-color)] bg-white px-6 py-4 font-semibold text-black transition-all duration-300 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting
                  ? "Please wait..."
                  : mode === "signup"
                    ? "Create super admin account"
                    : "Sign in"}
              </button>
            </form>

            <Link
              href="/"
              className="mt-8 text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
            >
              Back to home
            </Link>
          </div>
        </motion.div>
      </div>
    </>
  );
}
