import { useMemo, useState } from 'react';

/**
 * ═══════════════════════════════════════════════════════════════════════
 *  CalculadoraTokens — Herramienta de control de la Economía de Tokens
 * ───────────────────────────────────────────────────────────────────────
 *  Gemelo exacto de backend/src/modules/chatbot/chatbot.token-economy.ts.
 *  Misma fórmula:
 *
 *        CT(x) = c·x + k/x        k = p_ref · x_ref · C_error
 *        x* = √(k / c)            (recortado a [min, max])
 *
 *  Entradas de MODELO (c) → precio por 1M tokens de OpenRouter.
 *  Entradas de NEGOCIO (k) → costo de que un analista corrija un error.
 *  Salida → presupuesto dinámico de memoria (tokens y # de mensajes) que
 *  debes darle al agente en n8n / en CHATBOT via TOKENECON_*.
 *
 *  Autocontenido: sin librerías externas. Copia/pega en cualquier app React.
 * ═══════════════════════════════════════════════════════════════════════
 */

const AVG_TOKENS_PER_MESSAGE = 60;

// ─── Núcleo de cálculo (idéntico al backend) ────────────────────────────
function computeBudget({ costPerMTok, errorRate, refContextTokens, errorCostUsd, minTokens, maxTokens }) {
    const costPerToken = costPerMTok / 1_000_000;
    const k = errorRate * refContextTokens * errorCostUsd;

    const optimalTokens = costPerToken > 0 && k > 0 ? Math.sqrt(k / costPerToken) : maxTokens;

    let budgetTokens = Math.round(optimalTokens);
    let clamped = 'none';
    if (budgetTokens < minTokens) { budgetTokens = minTokens; clamped = 'min'; }
    else if (budgetTokens > maxTokens) { budgetTokens = maxTokens; clamped = 'max'; }

    const messages = Math.max(2, Math.round(budgetTokens / AVG_TOKENS_PER_MESSAGE));
    const tokenCostAtOpt = budgetTokens * costPerToken;   // término c·x
    const errorCostAtOpt = k / budgetTokens;              // término k/x
    return { costPerToken, k, optimalTokens, budgetTokens, clamped, messages, tokenCostAtOpt, errorCostAtOpt };
}

// ─── Estilos (inline, tema Pachanga: dorado/rojo/negro) ─────────────────
const C = { bg: '#0d0d0f', card: '#17171b', line: '#26262c', gold: '#D4AF37', red: '#C1121F', text: '#ECECEC', dim: '#9a9aa2', good: '#3fb950' };
const s = {
    wrap: { background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif', minHeight: '100vh', padding: 24 },
    shell: { maxWidth: 920, margin: '0 auto' },
    h1: { fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: -0.3 },
    sub: { color: C.dim, fontSize: 13, marginTop: 4, marginBottom: 20 },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 },
    card: { background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 18 },
    label: { display: 'block', fontSize: 12, color: C.dim, marginBottom: 6, marginTop: 12 },
    input: { width: '100%', boxSizing: 'border-box', background: C.bg, border: `1px solid ${C.line}`, borderRadius: 8, color: C.text, padding: '9px 11px', fontSize: 14 },
    section: { fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: C.gold, marginBottom: 4 },
    kpi: { fontSize: 30, fontWeight: 800, color: C.gold, lineHeight: 1.1 },
    kpiSub: { fontSize: 12, color: C.dim, marginTop: 2 },
    row: { display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${C.line}`, fontSize: 13 },
    formula: { background: C.bg, border: `1px solid ${C.line}`, borderRadius: 10, padding: 14, fontFamily: 'ui-monospace, monospace', fontSize: 13, lineHeight: 1.7, overflowX: 'auto' },
    badge: (bg) => ({ display: 'inline-block', background: bg, color: '#0d0d0f', fontWeight: 700, fontSize: 11, padding: '2px 8px', borderRadius: 999 }),
};

function Field({ label, value, set, step = '0.01', suffix }) {
    return (
        <label>
            <span style={s.label}>{label}{suffix ? ` (${suffix})` : ''}</span>
            <input style={s.input} type="number" step={step} value={value}
                onChange={(e) => set(parseFloat(e.target.value) || 0)} />
        </label>
    );
}

export default function CalculadoraTokens() {
    // Entradas de MODELO (c)
    const [costPerMTok, setCostPerMTok] = useState(0.10);   // respondedor (Gemini 2.5 Flash-Lite)
    const [escCostPerMTok, setEscCostPerMTok] = useState(3.00); // modelo de escalamiento (comparación)

    // Entradas de NEGOCIO (k)
    const [errorRate, setErrorRate] = useState(0.15);       // p_ref
    const [refContextTokens, setRefContextTokens] = useState(900); // x_ref
    const [analystUsdHour, setAnalystUsdHour] = useState(10);
    const [minutesPerFix, setMinutesPerFix] = useState(3);

    // Recorte
    const [minTokens, setMinTokens] = useState(300);
    const [maxTokens, setMaxTokens] = useState(2000);

    const errorCostUsd = (analystUsdHour / 60) * minutesPerFix; // C_error

    const main = useMemo(() => computeBudget({ costPerMTok, errorRate, refContextTokens, errorCostUsd, minTokens, maxTokens }),
        [costPerMTok, errorRate, refContextTokens, errorCostUsd, minTokens, maxTokens]);
    const esc = useMemo(() => computeBudget({ costPerMTok: escCostPerMTok, errorRate, refContextTokens, errorCostUsd, minTokens, maxTokens }),
        [escCostPerMTok, errorRate, refContextTokens, errorCostUsd, minTokens, maxTokens]);

    const clampNote = { none: null, min: 'Recortado al PISO (x* quedó por debajo del mínimo)', max: 'Recortado al TECHO (tokens tan baratos que el óptimo se dispara)' }[main.clamped];

    return (
        <div style={s.wrap}><div style={s.shell}>
            <h1 style={s.h1}>🎛️ Calculadora de Economía de Tokens</h1>
            <p style={s.sub}>Encuentra la "dosis exacta" de memoria rentable: <b>x* = √(k/c)</b>. Idéntica al motor del backend.</p>

            <div style={s.grid}>
                {/* ── ENTRADAS ── */}
                <div style={s.card}>
                    <div style={s.section}>① Modelo (c)</div>
                    <Field label="Precio entrada respondedor" suffix="USD / 1M tok" value={costPerMTok} set={setCostPerMTok} />
                    <Field label="Precio entrada modelo escalamiento" suffix="USD / 1M tok" value={escCostPerMTok} set={setEscCostPerMTok} />

                    <div style={{ ...s.section, marginTop: 18 }}>② Negocio (k)</div>
                    <Field label="Tasa de error actual  p_ref" suffix="0–1" value={errorRate} set={setErrorRate} step="0.01" />
                    <Field label="Contexto de referencia  x_ref" suffix="tokens" value={refContextTokens} set={setRefContextTokens} step="10" />
                    <Field label="Costo analista" suffix="USD / hora" value={analystUsdHour} set={setAnalystUsdHour} step="0.5" />
                    <Field label="Minutos por corrección" value={minutesPerFix} set={setMinutesPerFix} step="0.5" />

                    <div style={{ ...s.section, marginTop: 18 }}>③ Recorte</div>
                    <Field label="Mínimo de memoria" suffix="tokens" value={minTokens} set={setMinTokens} step="50" />
                    <Field label="Máximo de memoria" suffix="tokens" value={maxTokens} set={setMaxTokens} step="50" />
                </div>

                {/* ── RESULTADO ── */}
                <div style={s.card}>
                    <div style={s.section}>Resultado — presupuesto de memoria</div>
                    <div style={{ display: 'flex', gap: 24, marginTop: 8, marginBottom: 6 }}>
                        <div>
                            <div style={s.kpi}>{main.budgetTokens.toLocaleString()}</div>
                            <div style={s.kpiSub}>tokens de historial</div>
                        </div>
                        <div>
                            <div style={s.kpi}>{main.messages}</div>
                            <div style={s.kpiSub}>mensajes (take)</div>
                        </div>
                    </div>
                    {clampNote && <div style={{ marginTop: 8 }}><span style={s.badge(C.red)}>CLAMP</span> <span style={{ color: C.dim, fontSize: 12 }}> {clampNote}</span></div>}

                    <div style={{ marginTop: 16 }}>
                        <div style={s.row}><span>C_error (costo de un error)</span><b>${errorCostUsd.toFixed(3)}</b></div>
                        <div style={s.row}><span>k = p_ref · x_ref · C_error</span><b>{main.k.toFixed(2)}</b></div>
                        <div style={s.row}><span>c por token</span><b>${main.costPerToken.toExponential(2)}</b></div>
                        <div style={s.row}><span>x* teórico (sin recorte)</span><b>{Math.round(main.optimalTokens).toLocaleString()} tok</b></div>
                        <div style={s.row}><span>Costo memoria c·x</span><b>${main.tokenCostAtOpt.toFixed(5)}</b></div>
                        <div style={s.row}><span>Costo error esperado k/x</span><b>${main.errorCostAtOpt.toFixed(5)}</b></div>
                    </div>

                    <div style={{ ...s.formula, marginTop: 16 }}>
                        <div>k = {errorRate} · {refContextTokens} · {errorCostUsd.toFixed(3)} = <b style={{ color: C.gold }}>{main.k.toFixed(2)}</b></div>
                        <div>x* = √(k / c) = √({main.k.toFixed(2)} / {main.costPerToken.toExponential(2)})</div>
                        <div>x* = <b style={{ color: C.gold }}>{Math.round(main.optimalTokens).toLocaleString()}</b> tok → recortado → <b style={{ color: C.good }}>{main.budgetTokens.toLocaleString()}</b> tok</div>
                    </div>
                </div>
            </div>

            {/* ── ENRUTAMIENTO: comparación respondedor vs escalamiento ── */}
            <div style={{ ...s.card, marginTop: 16 }}>
                <div style={s.section}>Pilar 1 — Enrutamiento: cuánto se contrae la memoria con un modelo caro</div>
                <div style={{ display: 'flex', gap: 32, marginTop: 10, flexWrap: 'wrap' }}>
                    <div>
                        <span style={s.badge(C.good)}>RESPONDEDOR</span>
                        <div style={{ ...s.kpi, fontSize: 24, marginTop: 8 }}>{main.budgetTokens.toLocaleString()} tok</div>
                        <div style={s.kpiSub}>c = ${costPerMTok}/1M · {main.messages} mensajes</div>
                    </div>
                    <div>
                        <span style={s.badge(C.red)}>ESCALAMIENTO</span>
                        <div style={{ ...s.kpi, fontSize: 24, marginTop: 8, color: C.red }}>{esc.budgetTokens.toLocaleString()} tok</div>
                        <div style={s.kpiSub}>c = ${escCostPerMTok}/1M · {esc.messages} mensajes</div>
                    </div>
                    <div style={{ alignSelf: 'center', color: C.dim, fontSize: 13, maxWidth: 320 }}>
                        Al subir el precio del modelo <b>{(escCostPerMTok / costPerMTok).toFixed(0)}×</b>, el óptimo de memoria
                        se reduce <b>√{(escCostPerMTok / costPerMTok).toFixed(0)} ≈ {Math.sqrt(escCostPerMTok / costPerMTok).toFixed(1)}×</b>.
                        Por eso el clasificador barato responde primero y el caro solo interviene cuando vale la pena.
                    </div>
                </div>
            </div>

            {/* ── EXPORT: qué poner en el .env ── */}
            <div style={{ ...s.card, marginTop: 16 }}>
                <div style={s.section}>Aplicar en el backend (.env)</div>
                <div style={{ ...s.formula, marginTop: 8 }}>
                    <div>TOKENECON_RESPONDER_COST_PER_MTOK={costPerMTok}</div>
                    <div>TOKENECON_ERROR_RATE={errorRate}</div>
                    <div>TOKENECON_REF_CONTEXT_TOKENS={refContextTokens}</div>
                    <div>TOKENECON_ERROR_COST_USD={errorCostUsd.toFixed(3)}</div>
                    <div>TOKENECON_MIN_TOKENS={minTokens}</div>
                    <div>TOKENECON_MAX_TOKENS={maxTokens}</div>
                    <div style={{ color: C.dim }}># → presupuesto vigente: {main.budgetTokens} tok / {main.messages} mensajes de historial</div>
                </div>
            </div>
        </div></div>
    );
}
