// ============================================
// Integración con Club PyP (app de lealtad)
// ============================================
// Cuando alguien se registra por el QR, además de guardarse en el CRM de Pachanga,
// dejamos un "pre-registro" en el Supabase de Club PyP. Así, cuando descargue la
// app y entre con su WhatsApp, la app lo reconoce y solo le pide crear un PIN.
//
// Usa la REST API de Supabase con fetch (sin agregar @supabase/supabase-js).
// La anon key es PÚBLICA (va en el bundle del frontend), no es un secreto.
//
// Config (Vercel del sitio + .env local):
//   VITE_CLUBPYP_SUPABASE_URL       = https://zbzcamdgmukqqamjqcuy.supabase.co
//   VITE_CLUBPYP_SUPABASE_ANON_KEY  = <anon key del proyecto Club PyP>

const CLUBPYP_URL = import.meta.env.VITE_CLUBPYP_SUPABASE_URL || '';
const CLUBPYP_ANON = import.meta.env.VITE_CLUBPYP_SUPABASE_ANON_KEY || '';

export const isClubPyPConfigured = Boolean(CLUBPYP_URL && CLUBPYP_ANON);

export interface PreRegisterInput {
  /** Teléfono completo (ej. +573001234567); se normaliza a solo dígitos */
  phone: string;
  name: string;
  /** YYYY-MM-DD (opcional) */
  birthDate?: string;
  qrTable?: string;
}

/**
 * Crea/actualiza el pre-registro en Club PyP. Best-effort: si no está configurado
 * o falla, NO rompe el registro del CRM (solo loguea).
 */
export async function preRegisterClubPyP(input: PreRegisterInput): Promise<boolean> {
  if (!isClubPyPConfigured) {
    console.warn('[ClubPyP] Falta VITE_CLUBPYP_SUPABASE_URL / ANON_KEY: se omite el pre-registro.');
    return false;
  }

  const phoneDigits = (input.phone || '').replace(/\D/g, '');
  if (phoneDigits.length < 7) return false;

  const body = [
    {
      phone: phoneDigits,
      name: input.name,
      birthDate: input.birthDate || null,
      qrTable: input.qrTable || null,
      source: 'QR_PACHANGA',
    },
  ];

  try {
    // upsert por phone (on_conflict) → si ya existe, actualiza nombre/cumpleaños.
    const res = await fetch(
      `${CLUBPYP_URL}/rest/v1/pending_registrations?on_conflict=phone`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: CLUBPYP_ANON,
          Authorization: `Bearer ${CLUBPYP_ANON}`,
          Prefer: 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify(body),
      },
    );

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.warn('[ClubPyP] pre-registro falló:', res.status, text);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[ClubPyP] error de red en pre-registro:', err);
    return false;
  }
}
