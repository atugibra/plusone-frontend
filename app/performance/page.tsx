"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { getPerformance, getPerformanceDrift, getCalibration, getPerLeague, getConfusionMatrix, evaluatePredictions } from "@/lib/api"
import { BarChart3, TrendingUp, Target, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react"
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell
} from "recharts"

function StatCard({ icon: Icon, label, value, sub, good }: { icon: React.ElementType; label: string; value: string; sub: string; good?: boolean }) {
    return (
        <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-muted-foreground mb-3"><Icon className="h-4 w-4" /></div>
            <p className={`text-2xl font-bold font-mono ${good === true ? "text-success" : good === false ? "text-destructive" : "text-foreground"}`}>{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">{sub}</p>
        </div>
    )
}

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
    return (
        <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-0.5">{title}</h3>
            {sub && <p className="text-xs text-muted-foreground mb-4">{sub}</p>}
            {!sub && <div className="mb-4" />}
            {children}
        </div>
    )
}

export default function PerformancePage() {
    const [perf, setPerf] = useState<any>(null)
    const [drift, setDrift] = useState<any>(null)
    const [cal, setCal] = useState<any>(null)
    const [perLeague, setPerLeague] = useState<any>(null)
    const [confusion, setConfusion] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [evaluating, setEvaluating] = useState(false)
    const [evalMsg, setEvalMsg] = useState("")

    const runEvaluate = async () => {
        setEvaluating(true)
        setEvalMsg("")
        try {
            const res = await evaluatePredictions()
            setEvalMsg(`✅ ${res.evaluated} prediction(s) graded. Reload the page to see updated metrics.`)
        } catch (e: any) {
            setEvalMsg(`❌ Evaluate failed: ${e?.message || "unknown error"}`)
        } finally {
            setEvaluating(false)
        }
    }

    useEffect(() => {
        Promise.all([getPerformance(), getPerformanceDrift(), getCalibration(), getPerLeague(), getConfusionMatrix()])
            .then(([p, d, c, l, cm]) => { setPerf(p); setDrift(d); setCal(c); setPerLeague(l); setConfusion(cm) })
            .catch(e => setError(e.message || "Failed to load metrics."))
            .finally(() => setLoading(false))
    }, [])

    if (loading) return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <p className="text-muted-foreground animate-pulse">Loading performance metrics…</p>
        </div>
    )

    const empty = !perf || perf.n === 0

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="mx-auto max-w-[1280px] px-4 lg:px-6 py-6">
                <div className="mb-6">
                    <h1 className="text-xl font-bold text-foreground">Model Performance</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Brier Score · RPS · Log Loss · Calibration · Confusion Matrix · ROI — from <code className="text-primary">prediction_log</code>
                    </p>
                </div>

                {error && (
                    <div className="rounded-lg border border-destructive bg-destructive/5 px-4 py-3 flex items-center gap-2 mb-6 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
                    </div>
                )}

                {empty ? (
                    <div className="rounded-lg border border-border bg-card p-12 text-center">
                        <BarChart3 className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-30" />
                        <p className="text-sm font-semibold text-foreground mb-1">No completed predictions yet</p>
                        <p className="text-xs text-muted-foreground mb-5">Performance metrics appear once matches in <code>prediction_log</code> have actual results recorded.</p>
                        <button
                            onClick={runEvaluate}
                            disabled={evaluating}
                            className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`h-4 w-4 ${evaluating ? "animate-spin" : ""}`} />
                            {evaluating ? "Evaluating…" : "Evaluate Predictions"}
                        </button>
                        {evalMsg && (
                            <p className="text-xs mt-3 text-muted-foreground">{evalMsg}</p>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Stat Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                            <StatCard icon={Target} label="Accuracy" value={`${Math.round((perf?.accuracy ?? 0) * 100)}%`} sub={`${perf?.n} predictions`} good={(perf?.accuracy ?? 0) > 0.45} />
                            <StatCard icon={TrendingUp} label="Brier Score" value={String(perf?.brier_score ?? "—")} sub="Lower = better (0 is perfect, 0.667 = random)" good={(perf?.brier_score ?? 1) < 0.5} />
                            <StatCard icon={BarChart3} label="RPS" value={String(perf?.rps ?? "—")} sub="Ranked Probability Score (< 0.33 = beats random)" good={(perf?.rps ?? 1) < 0.33} />
                            <StatCard icon={CheckCircle2} label="Log Loss" value={String(perf?.log_loss ?? "—")} sub="Cross-entropy (< 1.0 = good)" good={(perf?.log_loss ?? 2) < 1.0} />
                        </div>

                        {/* Significance */}
                        {perf?.significance && (
                            <div className={`rounded-lg border px-5 py-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${perf.significance.significant ? "border-success/30 bg-success/5" : "border-warning/30 bg-warning/5"}`}>
                                <div>
                                    <p className={`text-sm font-bold ${perf.significance.significant ? "text-success" : "text-warning"}`}>
                                        {perf.significance.significant ? "✅ Statistically Significant Skill Detected" : "⚠️ Not Yet Statistically Significant"}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Observed accuracy {perf.significance.observed_accuracy_pct}% vs baseline {perf.significance.baseline_accuracy_pct}% · p-value {perf.significance.p_value}
                                        {" · "}{perf.significance.n_predictions} predictions tested
                                    </p>
                                </div>
                                {perf?.roi && perf.roi.bets > 0 && (
                                    <div className="text-right flex-shrink-0">
                                        <p className={`text-lg font-black font-mono ${perf.roi.roi_pct >= 0 ? "text-success" : "text-destructive"}`}>{perf.roi.roi_pct >= 0 ? "+" : ""}{perf.roi.roi_pct}%</p>
                                        <p className="text-xs text-muted-foreground">Flat-stake ROI ({perf.roi.bets} bets)</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Rolling Drift */}
                        {drift?.drift?.length > 0 && (
                            <Section title="Rolling Performance Drift" sub={`${drift.window}-match rolling Brier score and accuracy over time`}>
                                <div className="h-[220px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={drift.drift} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.01 260)" vertical={false} />
                                            <XAxis dataKey="match_number" tick={{ fontSize: 10, fill: "oklch(0.55 0.01 260)" }} tickLine={false} axisLine={false} />
                                            <YAxis tick={{ fontSize: 10, fill: "oklch(0.55 0.01 260)" }} tickLine={false} axisLine={false} />
                                            <Tooltip content={({ active, payload }: any) => {
                                                if (!active || !payload?.length) return null
                                                const d = payload[0].payload
                                                return (
                                                    <div className="rounded-lg border border-border bg-card p-3 shadow-xl text-xs">
                                                        <p className="font-semibold text-foreground mb-1">Match #{d.match_number}</p>
                                                        <p className="text-muted-foreground">Brier: <span className="font-bold text-foreground">{d.rolling_brier}</span></p>
                                                        <p className="text-muted-foreground">Accuracy: <span className="font-bold text-foreground">{d.rolling_acc}%</span></p>
                                                        <p className="text-muted-foreground">RPS: <span className="font-bold text-foreground">{d.rolling_rps}</span></p>
                                                    </div>
                                                )
                                            }} />
                                            <ReferenceLine y={0.5} stroke="oklch(0.6 0.18 27)" strokeDasharray="4 4" label={{ value: "Brier 0.5", fill: "oklch(0.55 0.01 260)", fontSize: 10 }} />
                                            <Line type="monotone" dataKey="rolling_brier" stroke="oklch(0.65 0.19 145)" dot={false} strokeWidth={2} name="Brier" />
                                            <Line type="monotone" dataKey="rolling_rps" stroke="oklch(0.6 0.18 220)" dot={false} strokeWidth={1.5} strokeDasharray="4 2" name="RPS" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </Section>
                        )}

                        {/* Calibration */}
                        {cal?.bins?.length > 0 && (
                            <Section title="Probability Calibration" sub="When the model says 70%, does it win 70% of the time? Perfect model = diagonal line.">
                                <div className="h-[220px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={cal.bins} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.01 260)" vertical={false} />
                                            <XAxis dataKey="predicted_prob" tickFormatter={(v: number) => `${Math.round(v * 100)}%`} tick={{ fontSize: 10, fill: "oklch(0.55 0.01 260)" }} tickLine={false} axisLine={false} />
                                            <YAxis tickFormatter={(v: number) => `${Math.round(v * 100)}%`} tick={{ fontSize: 10, fill: "oklch(0.55 0.01 260)" }} tickLine={false} axisLine={false} />
                                            <Tooltip content={({ active, payload }: any) => {
                                                if (!active || !payload?.length) return null
                                                const d = payload[0].payload
                                                return (
                                                    <div className="rounded-lg border border-border bg-card p-3 shadow-xl text-xs">
                                                        <p className="font-semibold text-foreground">Predicted {Math.round(d.predicted_prob * 100)}%</p>
                                                        <p className="text-muted-foreground">Actual: <span className="font-bold text-foreground">{Math.round(d.actual_freq * 100)}%</span></p>
                                                        <p className="text-muted-foreground">Gap: <span className={`font-bold ${Math.abs(d.gap) < 0.05 ? "text-success" : "text-warning"}`}>{d.gap > 0 ? "+" : ""}{Math.round(d.gap * 100)}%</span></p>
                                                        <p className="text-muted-foreground">n={d.n_samples}</p>
                                                    </div>
                                                )
                                            }} />
                                            <ReferenceLine stroke="oklch(0.55 0.01 260)" strokeDasharray="4 4" segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }] as any} />
                                            <Line type="monotone" dataKey="predicted_prob" stroke="oklch(0.55 0.01 260)" dot={false} strokeDasharray="4 2" name="Perfect" />
                                            <Line type="monotone" dataKey="actual_freq" stroke="oklch(0.65 0.19 250)" dot={{ fill: "oklch(0.65 0.19 250)", r: 3 }} strokeWidth={2} name="Actual" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                                    <span>✅ Well-calibrated bins: <strong className="text-foreground">{cal.well_calibrated_bins}/{cal.n_bins}</strong></span>
                                    <span>Total predictions: <strong className="text-foreground">{cal.n_predictions}</strong></span>
                                </div>
                            </Section>
                        )}

                        {/* Per-League */}
                        {perLeague?.leagues?.length > 0 && (
                            <Section title="Per-League Performance" sub="Ranked by Brier score (lower = better)">
                                <div className="h-[200px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={perLeague.leagues} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.01 260)" vertical={false} />
                                            <XAxis dataKey="league" tick={{ fontSize: 9, fill: "oklch(0.55 0.01 260)" }} tickLine={false} axisLine={false} />
                                            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "oklch(0.55 0.01 260)" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}%`} />
                                            <Tooltip content={({ active, payload }: any) => {
                                                if (!active || !payload?.length) return null
                                                const d = payload[0].payload
                                                return (
                                                    <div className="rounded-lg border border-border bg-card p-3 shadow-xl text-xs">
                                                        <p className="font-semibold text-foreground">{d.league}</p>
                                                        <p className="text-muted-foreground">Matches: <strong className="text-foreground">{d.matches}</strong></p>
                                                        <p className="text-muted-foreground">Accuracy: <strong className="text-foreground">{d.accuracy}%</strong></p>
                                                        <p className="text-muted-foreground">Brier: <strong className="text-foreground">{d.brier}</strong></p>
                                                        <p className="text-muted-foreground">RPS: <strong className="text-foreground">{d.rps}</strong></p>
                                                    </div>
                                                )
                                            }} />
                                            <Bar dataKey="accuracy" radius={[4, 4, 0, 0]} maxBarSize={80}>
                                                {perLeague.leagues.map((row: any, i: number) => (
                                                    <Cell key={i} fill={row.accuracy >= 55 ? "oklch(0.65 0.19 145)" : row.accuracy >= 45 ? "oklch(0.7 0.18 55)" : "oklch(0.55 0.2 27)"} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-4 overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead><tr className="border-b border-border">{["League", "Matches", "Accuracy", "Brier", "RPS"].map(h => <th key={h} className="py-2 text-muted-foreground font-medium text-right first:text-left">{h}</th>)}</tr></thead>
                                        <tbody>
                                            {perLeague.leagues.map((row: any, i: number) => (
                                                <tr key={i} className="border-b border-border/40 hover:bg-secondary/10">
                                                    <td className="py-2">{row.league}</td>
                                                    <td className="py-2 text-right font-mono">{row.matches}</td>
                                                    <td className={`py-2 text-right font-mono font-bold ${row.accuracy >= 55 ? "text-success" : row.accuracy < 40 ? "text-destructive" : "text-foreground"}`}>{row.accuracy}%</td>
                                                    <td className={`py-2 text-right font-mono ${row.brier < 0.45 ? "text-success" : "text-foreground"}`}>{row.brier}</td>
                                                    <td className="py-2 text-right font-mono">{row.rps}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Section>
                        )}

                        {/* Confusion Matrix */}
                        {confusion?.matrix && (() => {
                            // Detect Home Win bias: check if all predictions land in Home Win column
                            const matrix = confusion.matrix
                            const totalPredictions = confusion.n_predictions ?? 0
                            const predHomeWin = (["Away Win", "Draw", "Home Win"]
                                .reduce((sum: number, actual: string) => sum + (matrix[`Actual ${actual}`]?.["Pred Home Win"] ?? 0), 0))
                            const isBiased = totalPredictions > 0 && predHomeWin === totalPredictions
                            const biasedToward = isBiased ? "Home Win" : null

                            return (
                                <>
                                    <Section title="Confusion Matrix" sub="Where is the model going wrong? Rows = actual, Columns = predicted.">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs">
                                                <thead>
                                                    <tr className="border-b border-border">
                                                        <th className="py-2 text-muted-foreground font-medium text-left">Actual \ Pred</th>
                                                        {["Away Win", "Draw", "Home Win"].map(l => <th key={l} className="py-2 text-muted-foreground font-medium text-right">{l}</th>)}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {["Away Win", "Draw", "Home Win"].map((actual, ri) => {
                                                        const row = confusion.matrix
                                                        const actKey = `Actual ${actual}`
                                                        return (
                                                            <tr key={actual} className="border-b border-border/40">
                                                                <td className="py-2 font-medium text-foreground">{actual}</td>
                                                                {["Away Win", "Draw", "Home Win"].map((pred, ci) => {
                                                                    const v = row[actKey]?.[`Pred ${pred}`] ?? 0
                                                                    const isDiag = ri === ci
                                                                    return (
                                                                        <td key={pred} className={`py-2 text-right font-mono font-bold ${isDiag ? "text-success" : v > 0 ? "text-destructive" : "text-muted-foreground"}`}>{v}</td>
                                                                    )
                                                                })}
                                                            </tr>
                                                        )
                                                    })}
                                                </tbody>
                                            </table>
                                            <p className="text-[10px] text-muted-foreground mt-3">Green diagonal = correct predictions · Red off-diagonal = errors · n={confusion.n_predictions}</p>
                                        </div>
                                    </Section>

                                    {biasedToward && (
                                        <div className="rounded-lg border border-warning/30 bg-warning/5 px-5 py-4 mt-6">
                                            <p className="text-sm font-bold text-warning mb-1">⚠️ Model Bias Detected — Always Predicting {biasedToward}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Every prediction in the log is classified as <strong className="text-foreground">{biasedToward}</strong>. This typically means:
                                            </p>
                                            <ul className="mt-2 space-y-1 text-xs text-muted-foreground list-disc list-inside">
                                                <li>The ML model was trained on an imbalanced dataset (Home Win dominates historical data)</li>
                                                <li>The model needs more data across all league and outcome types</li>
                                                <li>Try <strong className="text-foreground">retraining</strong> the ML engine on the Predictions page after syncing richer data</li>
                                                <li>The <strong className="text-foreground">Dynamic Consensus Engine</strong> blends DC + ML + Legacy to mitigate this bias</li>
                                            </ul>
                                        </div>
                                    )}
                                </>
                            )
                        })()}
                    </>
                )}
            </main>
            <Footer />
        </div>
    )
}
