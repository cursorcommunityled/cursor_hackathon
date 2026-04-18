"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { authClient } from "@/lib/auth-client";
import { Logo, NoiseOverlay } from "@/components/ui";

const LOADING_UI = (
  <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
    <div className="text-[var(--text-muted)]">Loading...</div>
  </div>
);

export default function RegisterPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && session?.user) {
      router.replace("/dashboard");
    }
  }, [isPending, router, session]);

  const handleSignIn = async () => {
    setSignInError(null);
    setIsSubmitting(true);

    try {
      const { data, error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
        newUserCallbackURL: "/dashboard",
        errorCallbackURL: "/register",
      });

      if (error) {
        setIsSubmitting(false);
        const err = error as { message?: string; status?: number; code?: string };
        const raw = err.message ?? "";
        const isPathOnly = /^[\s'"]*api\/auth\/[^a-z]*$/i.test(raw.trim());

        if (raw.toLowerCase().includes("provider") || raw.toLowerCase().includes("configured")) {
          setSignInError(
            "Google sign-in is not configured. Add the OAuth credentials to your .env.",
          );
          return;
        }

        if (raw && !isPathOnly) {
          setSignInError(raw);
          return;
        }

        setSignInError(
          `Sign-in failed${err.status ? ` (${err.status})` : ""}${err.code ? ` ${err.code}` : ""}. Ensure BETTER_AUTH_URL matches this site and in Google Cloud Console add redirect URI: ${typeof window !== "undefined" ? window.location.origin : ""}/api/auth/callback/google`,
        );
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      setIsSubmitting(false);
      setSignInError("Sign-in did not return a redirect. Please try again.");
    } catch (error) {
      setIsSubmitting(false);
      const message =
        error instanceof Error ? error.message : "Authentication is currently unavailable.";
      setSignInError(
        message.includes("fetch") || message.includes("network")
          ? "Cannot reach the auth server. Check that the app is running and DATABASE_URL is correct."
          : message,
      );
    }
  };

  if (isPending || session?.user) {
    return (
      <>
        <NoiseOverlay />
        {LOADING_UI}
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
              {t("registerPage", "title")}
            </h1>
            <p className="text-[var(--text-secondary)] mb-8">
              {t("registerPage", "subtitle")}
            </p>
            {signInError ? (
              <div className="mb-6 w-full rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {signInError}
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => void handleSignIn()}
              disabled={isSubmitting}
              className="w-full inline-flex min-h-[48px] items-center justify-center gap-3 rounded-xl border border-[var(--border-color)] bg-white px-6 py-4 font-semibold text-black transition-all duration-300 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {isSubmitting ? t("registerPage", "connecting") : t("registerPage", "signInGoogle")}
            </button>
            <p className="mt-6 text-sm text-[var(--text-muted)]">{t("registerPage", "help")}</p>

            <Link
              href="/"
              className="mt-8 text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
            >
              {t("registerPage", "backHome")}
            </Link>
          </div>
        </motion.div>
      </div>
    </>
  );
}
