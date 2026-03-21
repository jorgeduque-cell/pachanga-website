import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Gift, CheckCircle, Loader2, Wine, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { captureService, type CaptureInput } from '@/services/capture.service';

const COUNTRY_CODES = [
  { code: '+57', country: 'CO', flag: '🇨🇴', name: 'Colombia' },
  { code: '+1', country: 'US', flag: '🇺🇸', name: 'Estados Unidos' },
  { code: '+52', country: 'MX', flag: '🇲🇽', name: 'México' },
  { code: '+54', country: 'AR', flag: '🇦🇷', name: 'Argentina' },
  { code: '+56', country: 'CL', flag: '🇨🇱', name: 'Chile' },
  { code: '+51', country: 'PE', flag: '🇵🇪', name: 'Perú' },
  { code: '+58', country: 'VE', flag: '🇻🇪', name: 'Venezuela' },
  { code: '+593', country: 'EC', flag: '🇪🇨', name: 'Ecuador' },
  { code: '+507', country: 'PA', flag: '🇵🇦', name: 'Panamá' },
  { code: '+506', country: 'CR', flag: '🇨🇷', name: 'Costa Rica' },
  { code: '+34', country: 'ES', flag: '🇪🇸', name: 'España' },
  { code: '+55', country: 'BR', flag: '🇧🇷', name: 'Brasil' },
] as const;

// Mensaje de error amigable para teléfono duplicado
const FRIENDLY_DUPLICATE_MESSAGE = '¡Ya te conocemos! Bienvenido de vuelta 🎶';

export function QrCapturePage() {
  const [searchParams] = useSearchParams();
  const tableParam = searchParams.get('table') || '';
  
  const [formData, setFormData] = useState<CaptureInput & { optIn: boolean }>({
    name: '',
    phone: '',
    birthDate: '',
    rating: 5,
    qrTable: tableParam,
    optIn: false,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState('+57');
  const [isCodeDropdownOpen, setIsCodeDropdownOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setIsDuplicate(false);

    try {
      const cleanedPhone = formData.phone.replace(/[\s\-()]/g, '');
      const fullPhone = `${countryCode}${cleanedPhone}`;
      const response = await captureService.capture({ ...formData, phone: fullPhone });
      
      // Verificar si es un cliente que regresa basado en el mensaje del servidor
      if (response.message?.includes('de nuevo') || response.message?.includes('gusto verte')) {
        setIsDuplicate(true);
      }
      
      setIsSuccess(true);
    } catch (err: unknown) {
      // Manejar error 409: teléfono ya registrado
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { status: number; data?: { error?: string } } };
        if (axiosError.response?.status === 409) {
          setIsDuplicate(true);
          setIsSuccess(true); // Aún mostramos éxito pero con mensaje de bienvenida
        } else {
          setError(axiosError.response?.data?.error || 'Error al enviar el formulario');
        }
      } else {
        setError(err instanceof Error ? err.message : 'Error al enviar el formulario');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRatingChange = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  // Pantalla de éxito
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--color-dark)] via-[var(--color-dark)] to-[var(--accent-red)]/20 flex items-center justify-center p-4">
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
            {isDuplicate ? (
              <Star className="w-10 h-10 text-[var(--accent-gold)]" />
            ) : (
              <CheckCircle className="w-10 h-10 text-green-500" />
            )}
          </motion.div>
          
          <h2 className="text-2xl font-heading text-white mb-3">
            {isDuplicate ? '¡Bienvenido de vuelta!' : '¡Bienvenido a Pachanga!'}
          </h2>
          
          <p className="text-white/70 mb-6">
            {isDuplicate 
              ? FRIENDLY_DUPLICATE_MESSAGE 
              : 'Gracias por registrarte. Hemos enviado un mensaje de bienvenida a tu WhatsApp.'}
          </p>
          
          {/* Animación del shot de cortesía */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-3 bg-[var(--accent-gold)]/10 rounded-full border border-[var(--accent-gold)]/30"
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <Wine className="w-5 h-5 text-[var(--accent-gold)]" />
            </motion.div>
            <span className="text-[var(--accent-gold)] font-medium">
              ¡Tu shot de cortesía está listo! 🥃
            </span>
          </motion.div>
          
          {formData.qrTable && (
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
              <Gift className="w-4 h-4 text-white/60" />
              <span className="text-sm text-white/60">
                Mesa: {formData.qrTable}
              </span>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-dark)] via-[var(--color-dark)] to-[var(--accent-red)]/20">
      {/* Header móvil */}
      <div className="sticky top-0 z-10 bg-black/60 backdrop-blur-lg border-b border-[var(--glass-border)]">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-center">
          <img 
            src="/logo_dorado_sin_fondo.png" 
            alt="Pachanga" 
            className="h-8 object-contain opacity-90"
          />
        </div>
      </div>

      {/* Formulario */}
      <div className="max-w-md mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/40 backdrop-blur-xl rounded-2xl border border-[var(--glass-border)] p-6"
        >
          {/* Título */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-heading text-white mb-2">
              Únete al Club Pachanga
            </h1>
            <p className="text-sm text-white/60">
              Registra tus datos y recibe beneficios exclusivos
            </p>
            {formData.qrTable && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-[var(--accent-gold)]/10 rounded-full">
                <Gift className="w-3 h-3 text-[var(--accent-gold)]" />
                <span className="text-xs text-[var(--accent-gold)]">
                  Mesa {formData.qrTable}
                </span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Rating - Primero según especificación */}
            <div className="space-y-3">
              <Label className="text-white/80 text-sm flex items-center gap-2">
                ¿Cómo la pasaste?
                <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingChange(star)}
                    className="p-1 transition-transform active:scale-90"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        star <= formData.rating
                          ? 'fill-[var(--accent-gold)] text-[var(--accent-gold)]'
                          : 'fill-transparent text-white/30'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white/80 text-sm flex items-center gap-2">
                Tu nombre
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Tu nombre completo"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                minLength={2}
                maxLength={100}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-12"
              />
            </div>

            {/* Teléfono */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-white/80 text-sm flex items-center gap-2">
                Tu WhatsApp
                <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                {/* Country code selector */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsCodeDropdownOpen(!isCodeDropdownOpen)}
                    className={`flex items-center gap-1.5 px-3 h-12 rounded-md bg-white/5 border text-white whitespace-nowrap min-w-[110px] cursor-pointer transition-colors ${
                      isCodeDropdownOpen ? 'border-[var(--accent-gold)]' : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <span className="text-base">{(COUNTRY_CODES.find(c => c.code === countryCode) ?? COUNTRY_CODES[0]).flag}</span>
                    <span className="text-sm text-white/80">{countryCode}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-white/50 transition-transform ml-auto ${isCodeDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isCodeDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 mt-1 w-56 max-h-52 overflow-y-auto rounded-lg z-50"
                        style={{
                          background: 'rgba(20, 20, 30, 0.97)',
                          border: '1px solid rgba(255,215,0,0.2)',
                          backdropFilter: 'blur(20px)',
                          boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
                        }}
                      >
                        {COUNTRY_CODES.map((c) => (
                          <button
                            key={c.code + c.country}
                            type="button"
                            onClick={() => {
                              setCountryCode(c.code);
                              setIsCodeDropdownOpen(false);
                            }}
                            className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-left text-sm transition-colors cursor-pointer ${
                              countryCode === c.code
                                ? 'text-[var(--accent-gold)] bg-[var(--accent-gold)]/5 hover:bg-[var(--accent-gold)]/10'
                                : 'text-white/80 hover:bg-[var(--accent-gold)]/10'
                            }`}
                          >
                            <span className="text-base">{c.flag}</span>
                            <span className="font-medium">{c.name}</span>
                            <span className="ml-auto text-white/40 text-xs">{c.code}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Phone number input */}
                <Input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  placeholder="300 123 4567"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  required
                  minLength={7}
                  maxLength={15}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-12 flex-1"
                />
              </div>
            </div>

            {/* Fecha de nacimiento */}
            <div className="space-y-2">
              <Label htmlFor="birthDate" className="text-white/80 text-sm flex items-center gap-2">
                ¿Cuándo cumples?
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                required
                max={new Date().toISOString().split('T')[0]}
                className="bg-white/5 border-white/10 text-white h-12 [color-scheme:dark]"
              />
              <p className="text-xs text-white/40">
                ¡Te enviaremos un regalo en tu cumpleaños! 🎂
              </p>
            </div>

            {/* Checkbox Opt-in - Obligatorio */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="optIn"
                  checked={formData.optIn}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, optIn: checked === true }))}
                  required
                  className="mt-1 border-white/30 data-[state=checked]:bg-[var(--accent-red)] data-[state=checked]:border-[var(--accent-red)]"
                />
                <Label htmlFor="optIn" className="text-white/70 text-sm leading-relaxed cursor-pointer">
                  Acepto recibir mensajes por WhatsApp con promociones, novedades y beneficios del Club Pachanga
                  <span className="text-red-500 ml-1">*</span>
                </Label>
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm text-red-400 text-center bg-red-500/10 p-3 rounded-lg"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isSubmitting || !formData.optIn}
              className="w-full h-14 text-lg font-heading bg-[var(--accent-red)] hover:bg-[var(--accent-red)]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Unirme al Club'
              )}
            </Button>

            {/* Disclaimer */}
            <p className="text-xs text-white/40 text-center">
              Al registrarte aceptas nuestra política de privacidad y el uso de tus datos para enviarte comunicaciones.
              Puedes darte de baja en cualquier momento respondiendo STOP.
            </p>
          </form>
        </motion.div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-white/30">
            Pachanga y Pochola • Desde 1992
          </p>
        </div>
      </div>
    </div>
  );
}
