// Survey Page — v2.0
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, CheckCircle, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  surveyService,
  type SurveySubmitPayload,
} from '@/services/survey.service';

// ── Types ─────────────────────────────────────────────────────────────────

interface RatingQuestionProps {
  label: string;
  emoji: string;
  value: number;
  onChange: (rating: number) => void;
}

interface SurveyRatings {
  musicRating: number;
  serviceRating: number;
  ambienceRating: number;
  hygieneRating: number;
}

// ── Sub-component: RatingQuestion ─────────────────────────────────────────

function RatingQuestion({ label, emoji, value, onChange }: RatingQuestionProps) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="space-y-2">
      <span className="text-white/80 text-sm flex items-center gap-2">
        <span className="text-lg">{emoji}</span>
        {label}
      </span>

      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="p-1 transition-transform active:scale-90"
            aria-label={`${star} estrella${star > 1 ? 's' : ''}`}
          >
            <Star
              className={`w-8 h-8 transition-colors ${
                star <= (hovered || value)
                  ? 'fill-[var(--accent-gold)] text-[var(--accent-gold)]'
                  : 'fill-transparent text-white/30'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

export function SurveyPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  // Verification state
  const [isVerifying, setIsVerifying] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Form state
  const [ratings, setRatings] = useState<SurveyRatings>({
    musicRating: 0,
    serviceRating: 0,
    ambienceRating: 0,
    hygieneRating: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Derived
  const allRated =
    ratings.musicRating > 0 &&
    ratings.serviceRating > 0 &&
    ratings.ambienceRating > 0 &&
    ratings.hygieneRating > 0;

  // ── Verify token on mount ───────────────────────────────────────────────

  useEffect(() => {
    if (!token) {
      setIsVerifying(false);
      setVerifyError('No se proporcionó un enlace válido.');
      return;
    }

    let cancelled = false;

    const verify = async () => {
      try {
        const result = await surveyService.verifySurveyToken(token);

        if (cancelled) return;

        if (result.valid) {
          setIsTokenValid(true);
          setCustomerName(result.customerName);
        } else {
          setVerifyError(
            'Este enlace ya no es válido. Pide uno nuevo al mesero.',
          );
        }
      } catch (err: unknown) {
        if (cancelled) return;

        if (err && typeof err === 'object' && 'response' in err) {
          const axiosErr = err as {
            response?: { status: number; data?: { error?: string } };
          };
          if (axiosErr.response?.status === 429) {
            setVerifyError(
              'Demasiados intentos. Por favor espera unos minutos.',
            );
          } else {
            setVerifyError(
              axiosErr.response?.data?.error ||
                'No se pudo verificar el enlace. Intenta de nuevo.',
            );
          }
        } else {
          setVerifyError(
            err instanceof Error
              ? err.message
              : 'No se pudo verificar el enlace. Intenta de nuevo.',
          );
        }
      } finally {
        if (!cancelled) setIsVerifying(false);
      }
    };

    verify();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // ── Submit handler ──────────────────────────────────────────────────────

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!allRated) return;

      setIsSubmitting(true);
      setSubmitError(null);

      const payload: SurveySubmitPayload = { token, ...ratings };

      try {
        await surveyService.submitSurvey(payload);
        setIsSuccess(true);
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'response' in err) {
          const axiosErr = err as {
            response?: { status: number; data?: { error?: string } };
          };
          if (axiosErr.response?.status === 429) {
            setSubmitError(
              'Demasiados intentos. Por favor espera unos minutos.',
            );
          } else {
            setSubmitError(
              axiosErr.response?.data?.error ||
                'Error al enviar tu opinión. Intenta de nuevo.',
            );
          }
        } else {
          setSubmitError(
            err instanceof Error
              ? err.message
              : 'Error al enviar tu opinión. Intenta de nuevo.',
          );
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [allRated, token, ratings],
  );

  // ── Rating updater ─────────────────────────────────────────────────────

  const updateRating = useCallback(
    (key: keyof SurveyRatings) => (value: number) => {
      setRatings((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  // ── Shared wrapper ─────────────────────────────────────────────────────

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-dark)] via-[var(--color-dark)] to-[var(--accent-red)]/20 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/60 backdrop-blur-lg border-b border-[var(--glass-border)]">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-center">
          <img
            src="/logo_dorado_sin_fondo.png"
            alt="Pachanga"
            className="h-8 object-contain opacity-90"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        {children}
      </div>

      {/* Footer */}
      <div className="py-6 text-center">
        <p className="text-xs text-white/30">
          Pachanga y Pochola • Desde 1992
        </p>
      </div>
    </div>
  );

  // ── STATE: Loading ─────────────────────────────────────────────────────

  if (isVerifying) {
    return shell(
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-md bg-black/40 backdrop-blur-xl rounded-2xl border border-[var(--glass-border)] p-8 text-center"
      >
        <Loader2 className="w-10 h-10 mx-auto mb-4 animate-spin text-[var(--accent-gold)]" />
        <p className="text-white/70">Verificando tu enlace…</p>
      </motion.div>,
    );
  }

  // ── STATE: Token invalid / error ───────────────────────────────────────

  if (!isTokenValid || verifyError) {
    return shell(
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-black/40 backdrop-blur-xl rounded-2xl border border-[var(--glass-border)] p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: 'spring' }}
          className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center"
        >
          <XCircle className="w-10 h-10 text-red-400" />
        </motion.div>

        <h2 className="text-2xl font-heading text-white mb-3">
          Enlace no válido
        </h2>

        <p className="text-white/70">
          {verifyError ||
            'Este enlace ya no es válido. Pide uno nuevo al mesero.'}
        </p>
      </motion.div>,
    );
  }

  // ── STATE: Success ─────────────────────────────────────────────────────

  if (isSuccess) {
    return shell(
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-black/40 backdrop-blur-xl rounded-2xl border border-[var(--glass-border)] p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center"
        >
          <CheckCircle className="w-10 h-10 text-green-500" />
        </motion.div>

        <h2 className="text-2xl font-heading text-white mb-3">
          ¡Gracias por tu opinión!
        </h2>

        <p className="text-white/70 mb-6">
          Tu feedback nos ayuda a mejorar cada día.
        </p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-3 bg-[var(--accent-gold)]/10 rounded-full border border-[var(--accent-gold)]/30"
        >
          <span className="text-[var(--accent-gold)] font-medium">
            ¡Tu opinión fue registrada! ✨
          </span>
        </motion.div>
      </motion.div>,
    );
  }

  // ── STATE: Survey form ─────────────────────────────────────────────────

  return shell(
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md bg-black/40 backdrop-blur-xl rounded-2xl border border-[var(--glass-border)] p-6"
    >
      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-heading text-white mb-2">
          ¡Hola, {customerName}!
        </h1>
        <p className="text-sm text-white/60">
          Queremos conocer tu experiencia en Pachanga.
          <br />
          Califica cada aspecto del 1 al 5.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <RatingQuestion
          emoji="🎵"
          label="Música"
          value={ratings.musicRating}
          onChange={updateRating('musicRating')}
        />

        <RatingQuestion
          emoji="🍸"
          label="Atención del mesero"
          value={ratings.serviceRating}
          onChange={updateRating('serviceRating')}
        />

        <RatingQuestion
          emoji="🌿"
          label="Ambiente"
          value={ratings.ambienceRating}
          onChange={updateRating('ambienceRating')}
        />

        <RatingQuestion
          emoji="✨"
          label="Higiene"
          value={ratings.hygieneRating}
          onChange={updateRating('hygieneRating')}
        />

        {/* Submit error */}
        <AnimatePresence>
          {submitError && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-sm text-red-400 text-center bg-red-500/10 p-3 rounded-lg"
            >
              {submitError}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Submit button */}
        <Button
          type="submit"
          disabled={isSubmitting || !allRated}
          className="w-full h-14 text-lg font-heading bg-[var(--accent-red)] hover:bg-[var(--accent-red)]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Enviando…
            </>
          ) : (
            'Enviar mi opinión'
          )}
        </Button>
      </form>
    </motion.div>,
  );
}
