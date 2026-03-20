import { MessageType } from '@prisma/client';

// ─── Types ───────────────────────────────────────────────────
export type HeaderFormat = 'IMAGE' | 'VIDEO' | 'TEXT' | 'NONE';

export interface TemplateConfig {
    name: string;
    category: 'UTILITY' | 'MARKETING';
    language: string;
    type: MessageType;
    headerFormat: HeaderFormat;
    /** Maps body variable names from Meta to positional args. Index = position in vars array. */
    bodyParamNames: string[];
}

// ─── Template Registry ──────────────────────────────────────
export const WHATSAPP_TEMPLATES: Record<string, TemplateConfig> = {
    pachanga_bienvenida: {
        name: 'pachanga_bienvenida',
        category: 'MARKETING',
        language: 'es_CO',
        type: 'WELCOME',
        headerFormat: 'IMAGE',
        bodyParamNames: ['customer_name'],
    },
    cumpleanos_pachanga: {
        name: 'cumpleanos_pachanga',
        category: 'MARKETING',
        language: 'es_CO',
        type: 'BIRTHDAY',
        headerFormat: 'NONE',
        bodyParamNames: ['customer_name'],
    },
    encuesta_pachanga: {
        name: 'encuesta_pachanga',
        category: 'UTILITY',
        language: 'es_CO',
        type: 'SURVEY',
        headerFormat: 'VIDEO',
        bodyParamNames: ['customer_name'],
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
