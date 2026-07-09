/**
 * Prueba el motor nuevo (OpenRouter + economía de tokens) de forma AISLADA:
 * sin WhatsApp y sin base de datos. Valida que la key, el slug del modelo,
 * el JSON estricto y la contabilidad de costo funcionen antes de tocar prod.
 *
 * Uso:  npx tsx scripts/test-token-economy.ts
 */
import 'dotenv/config';
import { tokenEconomy } from '../src/modules/chatbot/chatbot.token-economy.js';
import { chatbotRouter } from '../src/modules/chatbot/chatbot.router.js';
import { chatbotAiEngine } from '../src/modules/chatbot/chatbot.ai-engine.js';

async function main(): Promise<void> {
    console.log('\n🎛️  ═══ TEST: OpenRouter + Economía de Tokens ═══\n');

    if (!process.env.OPENROUTER_API_KEY) {
        console.error('❌ Falta OPENROUTER_API_KEY en .env. Agrégala y reintenta.');
        process.exit(1);
    }
    console.log(`✅ OPENROUTER_API_KEY configurada`);
    console.log(`   Respondedor: ${process.env.CHATBOT_MODEL ?? 'google/gemini-2.5-flash-lite'}`);
    console.log(`   Router:      ${process.env.CHATBOT_ROUTER_MODEL ?? 'google/gemini-2.5-flash-lite'}`);

    // ── 1) Presupuesto de memoria (la fórmula) ──
    const b = tokenEconomy.currentBudget();
    console.log('\n── PRESUPUESTO (x* = √(k/c)) ──');
    console.log({
        k: b.k,
        x_optimo: Math.round(b.optimalTokens),
        presupuesto: b.budgetTokens,
        recorte: b.clamped,
        mensajes_historial: tokenEconomy.tokensToMessages(b.budgetTokens),
    });

    // ── 2) Router: deflexión vs escalamiento ──
    console.log('\n── ROUTER (triage barato) ──');
    for (const msg of ['hola', '¡gracias!', '¿cuánto vale la entrada el viernes?']) {
        const t = await chatbotRouter.triage(msg);
        console.log(`"${msg}"  →  ${t.decision} (${t.category})  $${t.costUsd.toFixed(6)}` +
            (t.reply ? `  ⟶  ${t.reply}` : '  ⟶  [escala al respondedor]'));
    }

    // ── 3) Respondedor con una KB de ejemplo ──
    console.log('\n── RESPONDEDOR ──');
    const kb = '### HORARIOS\n- **Viernes:** 8:00 pm a 3:00 am\n\n### UBICACION\n- **Direccion:** Calle 73 #14-53, Bogotá';
    const r = await chatbotAiEngine.generateResponse(kb, [], '¿a qué hora abren los viernes?');
    console.log('reply     :', r.reply);
    console.log('intent    :', r.intent, '| confidence:', r.confidence);
    console.log('usage     :', r.usage);

    const total = (r.usage?.costUsd ?? 0);
    console.log(`\n✅ Todo funcionando. Costo de esta respuesta: $${total.toFixed(6)}\n`);
}

main().catch((e) => {
    console.error('❌ Error:', e instanceof Error ? e.message : e);
    process.exit(1);
});
