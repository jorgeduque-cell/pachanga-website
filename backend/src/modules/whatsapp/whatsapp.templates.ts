import { MessageType } from '@prisma/client';

// ─── Types ───────────────────────────────────────────────────
export interface TemplateConfig {
    name: string;
    category: 'UTILITY' | 'MARKETING';
    language: string;
    type: MessageType;
}

// ─── Template Registry ──────────────────────────────────────
export const WHATSAPP_TEMPLATES: Record<string, TemplateConfig> = {
    bienvenida_pachanga: {
        name: 'bienvenida_pachanga',
        category: 'UTILITY',
        language: 'es',
        type: 'WELCOME',
    },
    cumpleanos_pachanga: {
        name: 'cumpleanos_pachanga',
        category: 'MARKETING',
        language: 'es',
        type: 'BIRTHDAY',
    },
    encuesta_pachanga: {
        name: 'encuesta_pachanga',
        category: 'UTILITY',
        language: 'es',
        type: 'SURVEY',
    },
};

/**
 * Resolves a template name to its config.
 * Throws if template is not registered.
 */
export function getTemplateConfig(templateName: string): TemplateConfig {
    const config = WHATSAPP_TEMPLATES[templateName];
    if (!config) {
        throw new Error(`Template "${templateName}" no está registrado`);
    }
    return config;
}
