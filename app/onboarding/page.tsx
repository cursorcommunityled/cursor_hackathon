"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Check, Compass, Users, Trophy, Clock, Globe } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import {
  isStaffPortalRole,
  requiresParticipantOnboarding,
} from "@/lib/auth/roles";
import { NoiseOverlay } from "@/components/ui";

type OnboardingLanguage = "en" | "de" | "es";

const LANG_LABELS: Record<OnboardingLanguage, string> = {
  en: "English",
  de: "Deutsch",
  es: "Español",
};

type StepContent = {
  icon: typeof Compass;
  title: string;
  text: string;
};

const STEPS: Record<OnboardingLanguage, StepContent[]> = {
  en: [
    {
      icon: Compass,
      title: "Welcome to Cursor 48H",
      text: "This is a hackathon for AI product development. Complete this short onboarding to learn how the participation process works.",
    },
    {
      icon: Users,
      title: "Registration & Team Formation",
      text: "After onboarding, you'll access your dashboard. There you can create a team or join an existing one with an invite code. Assemble a team of up to 5 people and wait for the screening to begin.",
    },
    {
      icon: Clock,
      title: "Screening Round",
      text: "When the admin starts the screening, a button to the tasks will appear on your dashboard. Each team member answers logic questions, and the team adds a link to a short demo video (YouTube or Google Drive). After submitting, wait for the results.",
    },
    {
      icon: Trophy,
      title: "Results & Finals",
      text: "Screening results will be shown on your dashboard. If your team passes — welcome to the finals! You'll gain access to partner credits and the next stages of the hackathon.",
    },
  ],
  de: [
    {
      icon: Compass,
      title: "Willkommen bei Cursor 48H",
      text: "Dies ist ein Hackathon zur Entwicklung von KI-Produkten. Schließen Sie dieses kurze Onboarding ab, um den Ablauf kennenzulernen.",
    },
    {
      icon: Users,
      title: "Registrierung & Teams",
      text: "Nach dem Onboarding gelangen Sie ins Dashboard. Dort können Sie ein Team erstellen oder mit einem Einladungscode einem Team beitreten. Bis zu 5 Personen — dann warten Sie auf den Start des Screenings.",
    },
    {
      icon: Clock,
      title: "Screening",
      text: "Wenn die Administration das Screening startet, erscheint im Dashboard ein Link zu den Aufgaben. Jedes Teammitglied beantwortet Fragen; das Team fügt einen Link zu einem kurzen Demo-Video (YouTube oder Google Drive) hinzu. Danach warten Sie auf die Ergebnisse.",
    },
    {
      icon: Trophy,
      title: "Ergebnisse & Finale",
      text: "Die Ergebnisse erscheinen im Dashboard. Wenn Ihr Team besteht — willkommen im Finale! Sie erhalten Zugang zu Partner-Credits und den nächsten Phasen.",
    },
  ],
  es: [
    {
      icon: Compass,
      title: "Bienvenido a Cursor 48H",
      text: "Este es un hackathon de desarrollo de productos de IA. Completa este onboarding breve para conocer el proceso.",
    },
    {
      icon: Users,
      title: "Registro y equipos",
      text: "Después del onboarding accederás al panel. Allí puedes crear un equipo o unirte con un código de invitación. Hasta 5 personas y espera al inicio del screening.",
    },
    {
      icon: Clock,
      title: "Screening",
      text: "Cuando el administrador inicie el screening, verás un enlace a las tareas en el panel. Cada miembro responde preguntas y el equipo añade un enlace a un vídeo demo corto (YouTube o Google Drive). Luego espera los resultados.",
    },
    {
      icon: Trophy,
      title: "Resultados y final",
      text: "Los resultados aparecerán en el panel. Si tu equipo aprueba — ¡bienvenido a la final! Tendrás acceso a créditos de partner y a las siguientes fases.",
    },
  ],
};

const BUTTON_LABELS: Record<OnboardingLanguage, { next: string; finish: string; saving: string; loading: string; redirecting: string }> = {
  en: { next: "Next", finish: "Finish", saving: "Saving…", loading: "Loading…", redirecting: "Redirecting…" },
  de: { next: "Weiter", finish: "Fertig", saving: "Speichern…", loading: "Laden…", redirecting: "Weiterleitung…" },
  es: { next: "Siguiente", finish: "Terminar", saving: "Guardando…", loading: "Cargando…", redirecting: "Redirigiendo…" },
};

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [step, setStep] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<OnboardingLanguage>("en");

  useEffect(() => {
    if (isPending || !session?.user) return;
    const role = (session.user as { role?: string }).role ?? "participant";
    if (!requiresParticipantOnboarding(role)) {
      if (isStaffPortalRole(role)) {
        router.replace("/staff");
      } else if (role === "super_admin") {
        router.replace("/admin/dashboard");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [isPending, session, router]);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.replace("/register");
    }
  }, [isPending, session, router]);

  const handleComplete = async () => {
    setError(null);
    setCompleting(true);
    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? "Failed to complete");
      router.replace("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setCompleting(false);
    }
  };

  const steps = STEPS[lang];
  const labels = BUTTON_LABELS[lang];

  if (isPending || !session?.user) {
    return (
      <>
        <NoiseOverlay />
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
          <div className="text-[var(--text-muted)]">{labels.loading}</div>
        </div>
      </>
    );
  }

  const sessionRole = (session.user as { role?: string }).role ?? "participant";
  if (!requiresParticipantOnboarding(sessionRole)) {
    return (
      <>
        <NoiseOverlay />
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
          <div className="text-[var(--text-muted)]">{labels.redirecting}</div>
        </div>
      </>
    );
  }

  const current = steps[step];
  const Icon = current?.icon ?? Compass;
  const isLast = step === steps.length - 1;

  return (
    <>
      <NoiseOverlay />
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-8 shadow-xl">
          {/* Language toggle */}
          <div className="mb-6 flex items-center justify-center gap-1">
            <Globe className="mr-1.5 h-4 w-4 text-[var(--text-muted)]" />
            {(Object.entries(LANG_LABELS) as [OnboardingLanguage, string][]).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => { setLang(key); setStep(0); }}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  lang === key
                    ? "bg-[var(--accent-blue)]/20 text-[var(--accent-blue)]"
                    : "text-[var(--text-muted)] hover:text-white hover:bg-white/5"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex justify-center mb-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--accent-blue)]/20">
              <Icon className="h-7 w-7 text-[var(--accent-blue)]" />
            </div>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${lang}-${step}`}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="text-xl font-bold text-white text-center">
                {current?.title}
              </h1>
              <p className="mt-4 text-[var(--text-secondary)] text-center text-sm leading-relaxed">
                {current?.text}
              </p>
            </motion.div>
          </AnimatePresence>
          <div className="mt-8 flex items-center justify-between gap-4">
            <div className="flex gap-1">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 w-8 rounded-full ${
                    i <= step ? "bg-[var(--accent-blue)]" : "bg-[var(--border-color)]"
                  }`}
                />
              ))}
            </div>
            {!isLast ? (
              <button
                type="button"
                onClick={() => setStep((s) => Math.min(s + 1, steps.length - 1))}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-blue)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-blue)]/90"
              >
                {labels.next}
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleComplete}
                disabled={completing}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-blue)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-blue)]/90 disabled:opacity-50"
              >
                {completing ? labels.saving : labels.finish}
                <Check className="h-4 w-4" />
              </button>
            )}
          </div>
          {error && (
            <p className="mt-4 text-center text-sm text-red-400">{error}</p>
          )}
        </div>
      </div>
    </>
  );
}
