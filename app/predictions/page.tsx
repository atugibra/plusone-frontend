"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { predictionsData, wpaTimelineData, weeklyTrends } from "@/lib/football-data"
import type { Prediction } from "@/lib/football-data"
import { getTeams, getLeagues, API } from "@/lib/api"
import { Player } from "@/lib/types"
import { TrendingUp, CheckCircle2, XCircle, ChevronRight, Target, BarChart3, Zap, Info } from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  BarChart,
  Bar,
  Cell,
} from "recharts"

export default function PredictionsPage() {
  const [selected, setSelected] = useState<Prediction>(predictionsData[0])

  // Custom Prediction State
  const [leagues, setLeagues] = useState<Record<string, any>[]>([])
  const [teams, setTeams] = useState<Record<string, any>[]>([])
  const [selectedLeague, setSelectedLeague] = useState("")
  const [home, setHome] = useState("")
  const [away, setAway] = useState("")
  const [loadingPred, setLoadingPred] = useState(false)
  const [customResult, setCustomResult] = useState<Record<string, any> | null>(null)

  useEffect(() => {
    getLeagues().then((data) => setLeagues(Array.isArray(data) ? data : []))
    getTeams({ limit: 1000 }).then((data) => setTeams(Array.isArray(data) ? data : []))
  }, [])

  // Filter teams to selected league
  const filteredTeams = selectedLeague
    ? teams.filter((t) => String(t.league_id) === String(selectedLeague))
    : teams

  const handlePredict = async () => {
    if (!home || !away) return
    setLoadingPred(true)
    try {
      const res = await fetch(`${API}/api/predictions/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ home_team: home, away_team: away })
      })
      const data = await res.json()
      setCustomResult(data)
    } catch {
      setCustomResult({ error: "Backend predictions unavailable." })
    }
    setLoadingPred(false)
  }

  const upcoming = predictionsData.filter((p) => !p.actualResult)
  const completed = predictionsData.filter((p) => p.actualResult)
  const correctCount = completed.filter((p) => p.actualResult?.predictionCorrect).length
  const accuracy = completed.length > 0 ? Math.round((correctCount / completed.length) * 100) : 0

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-[1280px] px-4 lg:px-6 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-foreground text-balance">Match Predictions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            WPA-powered predictions with statistical team analysis
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard icon={Target} label="Model Accuracy" value={`${accuracy}%`} sub={`${correctCount}/${completed.length} correct`} />
          <StatCard icon={TrendingUp} label="Upcoming" value={String(upcoming.length)} sub="Predictions" />
          <StatCard icon={BarChart3} label="Completed" value={String(completed.length)} sub="Verified" />
          <StatCard icon={Zap} label="Avg Confidence" value="high" sub="Across predictions" />
        </div>

        {/* Generate Prediction Feature */}
        <div className="rounded-lg border border-border bg-card p-6 mb-6">
          <h2 className="text-xl font-bold text-foreground mb-4">🔮 Generate Custom Prediction</h2>
          {/* League Selector */}
          <div className="mb-4">
            <label className="text-xs text-muted-foreground mb-1.5 block">Filter by League (optional)</label>
            <select
              value={selectedLeague}
              onChange={e => { setSelectedLeague(e.target.value); setHome(""); setAway("") }}
              className="w-full sm:w-72 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All Leagues</option>
              {leagues.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="text-xs text-muted-foreground mb-1.5 block">Home Team</label>
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                value={home}
                onChange={e => setHome(e.target.value)}
              >
                <option value="">Select home team...</option>
                {filteredTeams.map((t) => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="pb-2 text-sm font-bold text-muted-foreground">VS</div>
            <div className="flex-1 w-full">
              <label className="text-xs text-muted-foreground mb-1.5 block">Away Team</label>
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                value={away}
                onChange={e => setAway(e.target.value)}
              >
                <option value="">Select away team...</option>
                {filteredTeams.filter((t) => t.name !== home).map((t) => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handlePredict}
              disabled={loadingPred || !home || !away}
              className="w-full sm:w-auto px-6 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              <Zap className="h-4 w-4" />
              {loadingPred ? "Predicting..." : "Predict"}
            </button>
          </div>

          {/* Custom Prediction Result */}
          {customResult && (
            <div className={`mt-6 p-4 rounded-lg border ${customResult.error ? 'border-destructive bg-destructive/5' : 'border-primary/30 bg-primary/5'}`}>
              {customResult.error ? (
                <div className="flex items-center gap-2 text-destructive">
                  <Info className="h-5 w-5" />
                  <p className="text-sm font-medium">{customResult.error}</p>
                </div>
              ) : (
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2 mb-3">
                    Result: {customResult.home_team} vs {customResult.away_team}
                    {customResult.confidence === "high" && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary uppercase animate-pulse">
                        🔥 High Confidence Tip!
                      </span>
                    )}
                  </h3>
                  <div className="grid grid-cols-3 gap-2 text-center text-sm font-medium">
                    <div className="bg-background rounded-md p-2 border border-border">
                      <p className="text-muted-foreground text-xs mb-1">{customResult.home_team}</p>
                      <p className="font-mono text-lg">{Math.round(customResult.home_win_prob * 100)}%</p>
                    </div>
                    <div className="bg-background rounded-md p-2 border border-border">
                      <p className="text-muted-foreground text-xs mb-1">Draw</p>
                      <p className="font-mono text-lg">{Math.round(customResult.draw_prob * 100)}%</p>
                    </div>
                    <div className="bg-background rounded-md p-2 border border-border">
                      <p className="text-muted-foreground text-xs mb-1">{customResult.away_team}</p>
                      <p className="font-mono text-lg">{Math.round(customResult.away_win_prob * 100)}%</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Predicted Score: {customResult.predicted_score.home} - {customResult.predicted_score.away}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Prediction List */}
          <div className="w-full lg:w-[400px] shrink-0">
            <h2 className="text-sm font-semibold text-foreground mb-3">Predictions</h2>
            <div className="flex flex-col gap-2 lg:max-h-[calc(100vh-320px)] lg:overflow-y-auto lg:pr-1 scrollbar-thin">
              {predictionsData.map((pred, idx) => (
                <PredictionCard
                  key={idx}
                  prediction={pred}
                  isSelected={pred === selected}
                  onSelect={() => setSelected(pred)}
                />
              ))}
            </div>
          </div>

          {/* Right: Detail Analysis */}
          <div className="flex-1 min-w-0">
            {/* Selected Match Header */}
            <div className="rounded-lg border border-border bg-card p-4 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    {selected.homeTeam} vs {selected.awayTeam}
                    {selected.confidence === "high" && (
                      <span className="inline-block px-1.5 py-0.5 bg-primary/20 text-primary font-bold text-[10px] uppercase rounded-sm animate-pulse">
                        🔥 Bet Note!
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Confidence: {selected.confidence}
                    {selected.actualResult ? " -- Completed" : " -- Upcoming"}
                  </p>
                </div>
                {selected.actualResult && (
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${selected.actualResult.predictionCorrect
                    ? "bg-primary/10 text-primary"
                    : "bg-destructive/10 text-destructive"
                    }`}>
                    {selected.actualResult.predictionCorrect ? (
                      <><CheckCircle2 className="h-3.5 w-3.5" /> Correct</>
                    ) : (
                      <><XCircle className="h-3.5 w-3.5" /> Incorrect</>
                    )}
                  </span>
                )}
              </div>

              {/* Probability Bars */}
              <div className="flex flex-col gap-3">
                <ProbBar label={selected.homeTeam} prob={selected.homeWinProb} type="home" />
                <ProbBar label="Draw" prob={selected.drawProb} type="draw" />
                <ProbBar label={selected.awayTeam} prob={selected.awayWinProb} type="away" />
              </div>

              {/* Predicted Score */}
              <div className="flex items-center justify-center gap-6 mt-4 py-3 rounded-lg bg-secondary/30">
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground mb-1">Predicted</p>
                  <p className="text-lg font-bold font-mono text-foreground">
                    {selected.predictedHome} - {selected.predictedAway}
                  </p>
                </div>
                {selected.actualResult && (
                  <>
                    <div className="h-8 w-px bg-border" />
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground mb-1">Actual</p>
                      <p className="text-lg font-bold font-mono text-foreground">
                        {selected.actualResult.homeScore} - {selected.actualResult.awayScore}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Team Stats Comparison */}
            {selected.homeStats && selected.awayStats && (
              <div className="rounded-lg border border-border bg-card p-4 mb-4">
                <h3 className="text-sm font-semibold text-foreground mb-4">Team Statistics</h3>
                <div className="grid grid-cols-2 gap-6">
                  <TeamStatsBlock label={selected.homeTeam} stats={selected.homeStats} />
                  <TeamStatsBlock label={selected.awayTeam} stats={selected.awayStats} />
                </div>
              </div>
            )}

            {/* WPA Timeline Chart */}
            <div className="rounded-lg border border-border bg-card p-4 mb-4">
              <h3 className="text-sm font-semibold text-foreground mb-1">Win Probability Timeline</h3>
              <p className="text-xs text-muted-foreground mb-4">Simulated in-match WPA swing</p>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={wpaTimelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="wpGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="oklch(0.65 0.19 145)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="oklch(0.65 0.19 145)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.01 260)" vertical={false} />
                    <XAxis
                      dataKey="minute"
                      tick={{ fontSize: 10, fill: "oklch(0.55 0.01 260)" }}
                      tickLine={false}
                      axisLine={false}
                      label={{ value: "Minute", position: "insideBottom", offset: -5, fontSize: 10, fill: "oklch(0.55 0.01 260)" }}
                    />
                    <YAxis
                      domain={[0.2, 0.9]}
                      tick={{ fontSize: 10, fill: "oklch(0.55 0.01 260)" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const d = payload[0].payload
                        return (
                          <div className="rounded-lg border border-border bg-card p-3 shadow-xl">
                            <p className="text-[10px] text-muted-foreground mb-1">{d.minute}{"'"}</p>
                            <p className="text-xs text-foreground mb-1">{d.event}</p>
                            <p className="text-xs font-bold font-mono text-primary">{Math.round(d.homeWp * 100)}% Home WP</p>
                          </div>
                        )
                      }}
                    />
                    <ReferenceLine y={0.5} stroke="oklch(0.55 0.01 260)" strokeDasharray="6 4" strokeOpacity={0.5} />
                    <Area
                      type="monotone"
                      dataKey="homeWp"
                      stroke="oklch(0.65 0.19 145)"
                      strokeWidth={2}
                      fill="url(#wpGrad)"
                      dot={false}
                      activeDot={{ r: 5, stroke: "oklch(0.65 0.19 145)", strokeWidth: 2, fill: "oklch(0.14 0.006 260)" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Accuracy Trend */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="text-sm font-semibold text-foreground mb-1">Weekly Accuracy Trend</h3>
              <p className="text-xs text-muted-foreground mb-4">Model performance by gameweek</p>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyTrends} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.01 260)" vertical={false} />
                    <XAxis
                      dataKey="week"
                      tick={{ fontSize: 10, fill: "oklch(0.55 0.01 260)" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      domain={[50, 100]}
                      tick={{ fontSize: 10, fill: "oklch(0.55 0.01 260)" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) => `${v}%`}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const d = payload[0].payload
                        return (
                          <div className="rounded-lg border border-border bg-card p-3 shadow-xl">
                            <p className="text-xs font-semibold text-foreground">{d.week}</p>
                            <p className="text-xs text-muted-foreground">{d.correct}/{d.predictions} correct ({d.accuracy}%)</p>
                          </div>
                        )
                      }}
                    />
                    <Bar dataKey="accuracy" radius={[4, 4, 0, 0]}>
                      {weeklyTrends.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={entry.accuracy >= 80 ? "oklch(0.65 0.19 145)" : entry.accuracy >= 70 ? "oklch(0.7 0.18 55)" : "oklch(0.55 0.2 27)"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

function StatCard({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-muted-foreground mb-3">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-2xl font-bold font-mono text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      <p className="text-[10px] text-muted-foreground/60 mt-1">{sub}</p>
    </div>
  )
}

function PredictionCard({
  prediction,
  isSelected,
  onSelect,
}: {
  prediction: Prediction
  isSelected: boolean
  onSelect: () => void
}) {
  const winner =
    prediction.homeWinProb > prediction.awayWinProb && prediction.homeWinProb > prediction.drawProb
      ? "home"
      : prediction.awayWinProb > prediction.homeWinProb && prediction.awayWinProb > prediction.drawProb
        ? "away"
        : "draw"

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-lg border p-4 transition-all ${isSelected
        ? "border-primary/50 bg-primary/5"
        : "border-border bg-card hover:border-border/80"
        }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {prediction.actualResult ? (
            prediction.actualResult.predictionCorrect ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                <CheckCircle2 className="h-3 w-3" /> Correct
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                <XCircle className="h-3 w-3" /> Missed
              </span>
            )
          ) : (
            <span className="rounded-full bg-info/10 px-2 py-0.5 text-[10px] font-semibold text-info">
              Upcoming
            </span>
          )}
          <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${prediction.confidence === "high"
            ? "bg-primary/10 text-primary"
            : prediction.confidence === "medium"
              ? "bg-warning/10 text-warning"
              : "bg-muted text-muted-foreground"
            }`}>
            {prediction.confidence.toUpperCase()}
          </span>
        </div>
        <ChevronRight className={`h-3.5 w-3.5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className={`text-sm font-semibold ${winner === "home" ? "text-foreground" : "text-foreground/70"}`}>
            {prediction.homeTeam}
          </p>
          <p className={`text-sm font-semibold ${winner === "away" ? "text-foreground" : "text-foreground/70"}`}>
            {prediction.awayTeam}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-mono font-bold text-foreground">{Math.round(prediction.homeWinProb * 100)}%</p>
          <p className="text-xs font-mono font-bold text-foreground">{Math.round(prediction.awayWinProb * 100)}%</p>
        </div>
      </div>

      {prediction.actualResult && (
        <div className="mt-2 pt-2 border-t border-border flex items-center justify-center gap-2">
          <span className="text-xs text-muted-foreground">Predicted {prediction.predictedHome}-{prediction.predictedAway}</span>
          <span className="text-xs text-muted-foreground/50">|</span>
          <span className="text-xs text-foreground font-semibold">
            Actual {prediction.actualResult.homeScore}-{prediction.actualResult.awayScore}
          </span>
        </div>
      )}
    </button>
  )
}

function ProbBar({ label, prob, type }: { label: string; prob: number; type: "home" | "draw" | "away" }) {
  const pct = Math.round(prob * 100)
  const color =
    type === "home" ? "bg-primary" : type === "away" ? "bg-info" : "bg-muted-foreground"

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-foreground font-medium">{label}</span>
        <span className="text-xs font-bold font-mono text-foreground">{pct}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function TeamStatsBlock({ label, stats }: { label: string; stats: NonNullable<Prediction["homeStats"]> }) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-foreground mb-3">{label}</h4>
      <div className="flex flex-col gap-2">
        <StatLine label="Goals/Game" value={stats.goalsPerGame.toFixed(2)} />
        <StatLine label="Win Rate" value={`${Math.round(stats.winRate * 100)}%`} />
        {stats.possession && <StatLine label="Possession" value={`${stats.possession}%`} />}
        {stats.rank && <StatLine label="League Rank" value={`#${stats.rank}`} />}
        {stats.points !== null && <StatLine label="Points" value={String(stats.points)} />}
        {stats.goalsFor !== null && <StatLine label="Goals For" value={String(stats.goalsFor)} />}
        {stats.goalsAgainst !== null && <StatLine label="Goals Against" value={String(stats.goalsAgainst)} />}
      </div>
    </div>
  )
}

function StatLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className="text-xs font-bold font-mono text-foreground">{value}</span>
    </div>
  )
}
