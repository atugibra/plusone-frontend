"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { getPublicPredictions, getLeagues } from "@/lib/api"
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  AlertCircle,
  Target,
  Zap,
  Clock,
  Trophy,
  BarChart3,
  ChevronRight,
  Shield,
} from "lucide-react"

// ─── Types ───────────────────────────────────────────────────────────────────

interface Prediction {
  predicted_outcome: string
  confidence: string
  confidence_score: number
  probabilities: { home_win: number; draw: number; away_win: number }
  expected_goals?: { home_xg: number; away_xg: number; predicted_score: string }
  match?: {
    home_team: string
    away_team: string
    league: string
    league_id?: number
    date?: string
    match_date?: string
    gameweek?: number | string
  }
  key_factors?: string[]
  h2h?: { home_wins: number; draws: number; away_wins: number; last_5?: string[] }
  team_comparison?: {
    home?: { clean_sheet_rate?: number; blank_rate?: number; form_score?: number }
    away?: { clean_sheet_rate?: number; blank_rate?: number; form_score?: number }
  }
  bet_recommendations?: Array<{ bet: string; prob: number | null; tier: string }>
}

// ─── Helper components ───────────────────────────────────────────────────────

function OutcomeBadge({ outcome, confidence }: { outcome: string; confidence: string }) {
  const colours: Record<string, string> = {
    "Home Win": "bg-primary/15 text-primary border-primary/30",
    "Draw": "bg-amber-500/15 text-amber-400 border-amber-500/30",
    "Away Win": "bg-sky-500/15 text-sky-400 border-sky-500/30",
  }
  const icons: Record<string, JSX.Element> = {
    "Home Win": <TrendingUp className="h-3 w-3" />,
    "Draw": <Minus className="h-3 w-3" />,
    "Away Win": <TrendingDown className="h-3 w-3" />,
  }
  const confColour =
    confidence === "High"
      ? "text-emerald-400"
      : confidence === "Medium"
      ? "text-amber-400"
      : "text-muted-foreground"

  return (
    <div className="flex flex-col items-end gap-1">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${colours[outcome] || "bg-secondary text-muted-foreground"}`}
      >
        {icons[outcome]}
        {outcome}
      </span>
      <span className={`text-[10px] font-semibold ${confColour}`}>{confidence} Confidence</span>
    </div>
  )
}

function ProbBar({ label, value, colour }: { label: string; value: number; colour: string }) {
  const pct = Math.round(value * 100)
  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <span className="text-xs font-mono font-bold text-foreground">{pct}%</span>
      <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${colour}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] text-muted-foreground leading-none text-center">{label}</span>
    </div>
  )
}

function BetBadge({ bet, tier }: { bet: string; tier: string }) {
  const styles: Record<string, string> = {
    high: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
    medium: "bg-primary/10 border-primary/30 text-primary",
    btts: "bg-sky-500/10 border-sky-500/30 text-sky-400",
    draw_value: "bg-amber-500/10 border-amber-500/30 text-amber-400",
  }
  return (
    <div
      className={`rounded-md border px-3 py-2 text-xs font-medium leading-snug ${styles[tier] || "bg-secondary border-border text-muted-foreground"}`}
    >
      {bet}
    </div>
  )
}

function formatDate(d?: string) {
  if (!d) return "TBD"
  const dt = new Date(d + (!d.includes("T") ? "T12:00:00" : ""))
  return dt.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
}

function ConfidenceBar({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  const colour =
    pct >= 60 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-muted-foreground/50"
  return (
    <div className="flex items-center gap-2 w-full max-w-[120px]">
      <div className="flex-1 h-1 rounded-full bg-secondary overflow-hidden">
        <div className={`h-full rounded-full ${colour}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-muted-foreground font-mono">{pct}%</span>
    </div>
  )
}


// ─── Match card ───────────────────────────────────────────────────────────────

function MatchCard({ pred, rank }: { pred: Prediction; rank: number }) {
  const [open, setOpen] = useState(false)
  const match = pred.match || {}
  const probs = pred.probabilities || { home_win: 0.33, draw: 0.33, away_win: 0.34 }
  const xg = pred.expected_goals || null
  const h2h = pred.h2h || null
  const tc = pred.team_comparison || {}
  const bets = pred.bet_recommendations || []
  const factors = pred.key_factors || []

  const h2hTotal = h2h ? h2h.home_wins + h2h.draws + h2h.away_wins : 0

  return (
    <div
      className={`rounded-xl border bg-card overflow-hidden transition-all duration-200 ${
        open ? "border-primary/40 shadow-lg shadow-primary/5" : "border-border hover:border-border/60"
      }`}
    >
      {/* Card header */}
      <button
        className="w-full text-left"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <div className="flex items-start justify-between gap-4 px-5 py-4">
          {/* Rank pill */}
          <div className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-[11px] font-bold text-muted-foreground mt-0.5">
            {rank}
          </div>

          {/* Teams + league */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] font-semibold text-primary truncate">{match.league}</span>
              {match.gameweek && (
                <span className="text-[10px] text-muted-foreground">· GW{match.gameweek}</span>
              )}
            </div>
            <p className="text-sm font-bold text-foreground leading-tight">
              {match.home_team}{" "}
              <span className="text-muted-foreground font-normal text-xs">vs</span>{" "}
              {match.away_team}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
              <Clock className="h-3 w-3 inline-block" />
              {formatDate(match.date || match.match_date)}
            </p>
          </div>

          {/* Outcome badge */}
          <div className="flex-shrink-0 flex flex-col items-end gap-2">
            <OutcomeBadge outcome={pred.predicted_outcome} confidence={pred.confidence} />
            <ConfidenceBar score={pred.confidence_score} />
          </div>

          {/* Chevron */}
          <div className="flex-shrink-0 mt-1 text-muted-foreground">
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>

        {/* Probability mini-bars */}
        <div className="flex items-end gap-3 px-5 pb-4 pt-0">
          <ProbBar label={match.home_team || "Home"} value={probs.home_win} colour="bg-primary" />
          <ProbBar label="Draw" value={probs.draw} colour="bg-amber-500" />
          <ProbBar label={match.away_team || "Away"} value={probs.away_win} colour="bg-sky-500" />
        </div>
      </button>

      {/* ── Expanded detail ────────────────────────────────────────────────── */}
      {open && (
        <div className="border-t border-border bg-secondary/5 px-5 py-5 space-y-5">

          {/* xG & Predicted Score */}
          {xg && (
            <div className="rounded-lg border border-border bg-card px-4 py-4">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Expected Goals (xG) & Predicted Score
              </p>
              <div className="flex items-center justify-between gap-3">
                <div className="text-center">
                  <p className="text-2xl font-black text-primary">{xg.home_xg}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{match.home_team}</p>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-muted-foreground mb-1">Predicted</span>
                  <span className="text-lg font-bold text-foreground font-mono px-3 py-1 rounded-lg border border-border">
                    {xg.predicted_score}
                  </span>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-sky-400">{xg.away_xg}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{match.away_team}</p>
                </div>
              </div>
            </div>
          )}

          {/* Key Factors */}
          {factors.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Target className="h-3 w-3" /> Key Deciding Factors
              </p>
              <ul className="space-y-1.5">
                {factors.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="text-primary mt-0.5 flex-shrink-0">▸</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Team Comparison */}
          {(tc.home || tc.away) && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Shield className="h-3 w-3" /> Performance Patterns
              </p>
              <div className="grid grid-cols-2 gap-3">
                {(["home", "away"] as const).map((side) => {
                  const stats = tc[side]
                  const name = side === "home" ? match.home_team : match.away_team
                  if (!stats) return null
                  return (
                    <div key={side} className="rounded-lg border border-border bg-card p-3">
                      <p className="text-xs font-semibold text-foreground mb-2 truncate">{name}</p>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Clean Sheets</span>
                          <span className="font-bold text-emerald-400">
                            {Math.round((stats.clean_sheet_rate || 0) * 100)}%
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Blank Rate</span>
                          <span className="font-bold text-rose-400">
                            {Math.round((stats.blank_rate || 0) * 100)}%
                          </span>
                        </div>
                        {stats.form_score !== undefined && (
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Form</span>
                            <span className="font-bold text-foreground">
                              {Math.round((stats.form_score || 0) * 100)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* H2H */}
          {h2h && h2hTotal > 0 && (
            <div className="rounded-lg border border-border bg-card px-4 py-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <BarChart3 className="h-3 w-3" /> Head to Head
              </p>
              <div className="flex items-center gap-4 mb-2.5">
                <div className="text-center flex-1">
                  <p className="text-xl font-black text-primary">{h2h.home_wins}</p>
                  <p className="text-[10px] text-muted-foreground">{match.home_team?.split(" ")[0]}</p>
                </div>
                <div className="text-center flex-1">
                  <p className="text-xl font-black text-muted-foreground">{h2h.draws}</p>
                  <p className="text-[10px] text-muted-foreground">Draws</p>
                </div>
                <div className="text-center flex-1">
                  <p className="text-xl font-black text-sky-400">{h2h.away_wins}</p>
                  <p className="text-[10px] text-muted-foreground">{match.away_team?.split(" ")[0]}</p>
                </div>
              </div>
              {h2h.last_5 && h2h.last_5.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {h2h.last_5.map((r, i) => (
                    <span
                      key={i}
                      className={`text-[10px] font-bold rounded px-1.5 py-0.5 ${
                        r === "H"
                          ? "bg-primary/10 text-primary"
                          : r === "A"
                          ? "bg-sky-500/10 text-sky-400"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {r === "H" ? "HW" : r === "A" ? "AW" : "D"}
                    </span>
                  ))}
                  <span className="text-[10px] text-muted-foreground self-center ml-1">
                    Last {h2h.last_5.length} meetings
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Bet Recommendations */}
          {bets.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Zap className="h-3 w-3 text-amber-400" /> Recommended Bets
              </p>
              <div className="space-y-2">
                {bets.map((b, i) => (
                  <BetBadge key={i} bet={b.bet} tier={b.tier} />
                ))}
              </div>
              <p className="text-[9px] text-muted-foreground/60 mt-2">
                ⚠️ For informational purposes only. Gambling involves risk.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}


// ─── Main page ────────────────────────────────────────────────────────────────

export default function PredictionsFeedPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [leagues, setLeagues] = useState<any[]>([])
  const [leagueFilter, setLeagueFilter] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const params: Record<string, any> = { limit: 30 }
      const [predsRes, leaguesRes] = await Promise.all([
        getPublicPredictions(params),
        getLeagues().catch(() => []),
      ])

      const preds = Array.isArray(predsRes?.predictions) ? predsRes.predictions : []
      setPredictions(preds)
      setGeneratedAt(predsRes?.generated_at || null)
      setLeagues(Array.isArray(leaguesRes) ? leaguesRes : [])
    } catch (err: any) {
      const msg = err?.message || ""
      if (msg.includes("422") || msg.includes("Model not trained")) {
        setError("The ML model hasn't been trained yet. Go to the Predictions page and click 'Train Engine' first.")
      } else if (msg.includes("503") || msg.includes("Failed to fetch")) {
        setError("Backend is starting up (cold start). Please wait ~30 seconds and refresh.")
      } else {
        setError("Could not load predictions. The API may be unavailable.")
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = leagueFilter
    ? predictions.filter((p) => String(p.match?.league_id) === leagueFilter || p.match?.league === leagueFilter)
    : predictions

  // Sort: High confidence first, then Medium, then Low
  const sorted = [...filtered].sort((a, b) => {
    const order = { High: 0, Medium: 1, Low: 2 }
    const ao = order[a.confidence as keyof typeof order] ?? 3
    const bo = order[b.confidence as keyof typeof order] ?? 3
    if (ao !== bo) return ao - bo
    return (b.confidence_score || 0) - (a.confidence_score || 0)
  })

  const highCount = sorted.filter((p) => p.confidence === "High").length
  const medCount = sorted.filter((p) => p.confidence === "Medium").length

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-[900px] px-4 lg:px-6 py-6">

        {/* Page header */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <h1 className="text-2xl font-black tracking-tight text-foreground">Free Picks</h1>
              </div>
              <p className="text-sm text-muted-foreground max-w-lg">
                AI-powered match predictions from our XGBoost + Random Forest ensemble.
                Updated automatically before each gameweek.
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => load(true)}
                disabled={refreshing}
                title="Refresh predictions"
                className="flex items-center gap-2 rounded-lg border border-border bg-secondary/30 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "Refreshing…" : "Refresh"}
              </button>
              <Link
                href="/predictions"
                className="flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold hover:bg-primary/90 transition-colors"
              >
                <Target className="h-3.5 w-3.5" />
                Custom Predict
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {generatedAt && (
            <p className="text-[10px] text-muted-foreground/60 mt-2 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Generated {new Date(generatedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
              {" · "}Cached for 15 min
            </p>
          )}
        </div>

        {/* Stat row */}
        {!loading && !error && sorted.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="rounded-lg border border-border bg-card px-4 py-3">
              <p className="text-2xl font-black text-foreground font-mono">{sorted.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <Trophy className="h-3 w-3" /> Predictions
              </p>
            </div>
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
              <p className="text-2xl font-black text-emerald-400 font-mono">{highCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-emerald-400" /> High Confidence
              </p>
            </div>
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
              <p className="text-2xl font-black text-amber-400 font-mono">{medCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <BarChart3 className="h-3 w-3 text-amber-400" /> Medium Confidence
              </p>
            </div>
          </div>
        )}

        {/* Filter bar */}
        {!loading && !error && leagues.length > 0 && (
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className="text-xs text-muted-foreground font-medium">Filter:</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setLeagueFilter("")}
                className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                  leagueFilter === ""
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-border/60 bg-secondary/20"
                }`}
              >
                All Leagues
              </button>
              {leagues.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setLeagueFilter(String(l.id))}
                  className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                    leagueFilter === String(l.id)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-border/60 bg-secondary/20"
                  }`}
                >
                  {l.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-28 rounded-xl border border-border bg-card animate-pulse"
                style={{ opacity: 1 - i * 0.15 }}
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-8 text-center">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-3" />
            <p className="text-sm font-semibold text-destructive mb-1">Predictions Unavailable</p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto mb-4">{error}</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => load()}
                className="rounded-lg bg-secondary/50 border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
              >
                Try Again
              </button>
              <Link
                href="/predictions"
                className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold hover:bg-primary/90 transition-colors"
              >
                Go to Predictions Page
              </Link>
            </div>
          </div>
        ) : sorted.length === 0 ? (
          <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
            <Trophy className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-sm font-semibold text-foreground mb-1">No upcoming fixtures found</p>
            <p className="text-xs text-muted-foreground">
              Try changing the league filter or sync new fixture data.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((pred, i) => (
              <MatchCard key={i} pred={pred} rank={i + 1} />
            ))}
          </div>
        )}

        {/* Disclaimer */}
        {!loading && !error && sorted.length > 0 && (
          <div className="mt-8 rounded-lg border border-border/50 bg-secondary/10 px-4 py-3 text-center">
            <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
              Predictions are generated by a machine learning model trained on historical match data.
              They are for informational and entertainment purposes only and do not constitute financial advice.
              Always gamble responsibly. 18+.
            </p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
