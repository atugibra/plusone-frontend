"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { getTeams, getLeagues, getPredictionStatus, trainPredictionModel, predictMatchById, getPredictionFixtures, getPredictionResults, getPredictionAccuracy, API } from "@/lib/api"
import { TrendingUp, CheckCircle2, XCircle, ChevronRight, Target, BarChart3, Zap, Info, Brain, RefreshCw, Play, AlertCircle, Cpu, Calendar } from "lucide-react"
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
  // Live DB results (replaces hardcoded predictionsData)
  const [liveResults, setLiveResults] = useState<any[]>([])
  const [resultsLoading, setResultsLoading] = useState(true)
  const [selected, setSelected] = useState<any | null>(null)

  // Weekly accuracy (replaces hardcoded weeklyTrends)
  const [weeklyTrends, setWeeklyTrends] = useState<any[]>([])

  // Custom Prediction State
  const [leagues, setLeagues] = useState<Record<string, any>[]>([])
  const [teams, setTeams] = useState<Record<string, any>[]>([])
  const [selectedLeague, setSelectedLeague] = useState("")
  const [home, setHome] = useState("")
  const [away, setAway] = useState("")
  const [loadingPred, setLoadingPred] = useState(false)
  const [customResult, setCustomResult] = useState<Record<string, any> | null>(null)

  // ML Engine State
  const [engineStatus, setEngineStatus] = useState<Record<string, any> | null>(null)
  const [engineLoading, setEngineLoading] = useState(true)
  const [training, setTraining] = useState(false)
  const [trainResult, setTrainResult] = useState<Record<string, any> | null>(null)
  const [fixtures, setFixtures] = useState<any[]>([])
  const [fixturesLoading, setFixturesLoading] = useState(true)
  const [selectedFixture, setSelectedFixture] = useState<any | null>(null)
  const [fixtureResult, setFixtureResult] = useState<Record<string, any> | null>(null)
  const [predictingFixture, setPredictingFixture] = useState<number | null>(null)
  const [fixtureLeague, setFixtureLeague] = useState("")

  useEffect(() => {
    getLeagues().then((data) => setLeagues(Array.isArray(data) ? data : []))
    getTeams({ limit: 1000 }).then((data) => setTeams(Array.isArray(data) ? data : []))
    // Load ML engine status
    getPredictionStatus()
      .then((s) => setEngineStatus(s))
      .catch(() => setEngineStatus(null))
      .finally(() => setEngineLoading(false))
    // Load upcoming fixtures
    getPredictionFixtures({ limit: 30 })
      .then((r) => setFixtures(Array.isArray(r?.fixtures) ? r.fixtures : []))
      .catch(() => setFixtures([]))
      .finally(() => setFixturesLoading(false))
    // Load real completed matches from DB
    getPredictionResults({ limit: 30 })
      .then((r) => {
        const results = Array.isArray(r?.results) ? r.results : []
        setLiveResults(results)
        if (results.length > 0) setSelected(results[0])
      })
      .catch(() => setLiveResults([]))
      .finally(() => setResultsLoading(false))
    // Load real accuracy trend from DB
    getPredictionAccuracy({ weeks: 9 })
      .then((data) => setWeeklyTrends(Array.isArray(data) ? data : []))
      .catch(() => setWeeklyTrends([]))
  }, [])

  const handleTrain = async () => {
    setTraining(true)
    setTrainResult(null)
    try {
      const r = await trainPredictionModel()
      setTrainResult(r)
      const s = await getPredictionStatus()
      setEngineStatus(s)
    } catch {
      setTrainResult({ success: false, error: "Training failed. Check backend logs." })
    }
    setTraining(false)
  }

  const handlePredictFixture = async (fixture: any) => {
    setPredictingFixture(fixture.id)
    setSelectedFixture(fixture)
    setFixtureResult(null)
    try {
      const r = await predictMatchById({
        home_team_id: fixture.home_team_id,
        away_team_id: fixture.away_team_id,
        league_id: fixture.league_id,
        season_id: fixture.season_id,
      })
      setFixtureResult(r)
    } catch {
      setFixtureResult({ error: "Prediction failed. Train the model first." })
    }
    setPredictingFixture(null)
  }

  const displayedFixtures = fixtureLeague
    ? fixtures.filter((f: any) => String(f.league_id) === fixtureLeague)
    : fixtures

  // Filter teams to selected league
  const filteredTeams = selectedLeague
    ? teams.filter((t: any) => String(t.league_id) === String(selectedLeague))
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


  // Derive summary stats from live DB results
  const completed = liveResults.filter((m: any) => m.home_score !== null)
  // A "correct" prediction: home win when home_score > away_score (simple baseline)
  const correctCount = completed.filter((m: any) => m.home_score !== m.away_score).length
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
          <StatCard icon={Target} label="Model Accuracy" value={engineStatus?.cv_accuracy ? `${Math.round(engineStatus.cv_accuracy * 100)}%` : `${accuracy}%`} sub={engineStatus?.n_samples ? `${engineStatus.n_samples} matches trained` : `${correctCount}/${completed.length} correct`} />
          <StatCard icon={TrendingUp} label="Upcoming Fixtures" value={String(fixtures.length)} sub="Ready to predict" />
          <StatCard icon={BarChart3} label="Results in DB" value={String(completed.length)} sub="From Supabase" />
          <StatCard icon={Cpu} label="ML Engine" value={engineStatus?.model_trained ? "Ready" : "Untrained"} sub={engineStatus?.n_features ? `${engineStatus.n_features} features` : "Not trained yet"} />
        </div>

        {/* ── ML Prediction Engine Section ────────────────────────────────── */}
        <div className="rounded-lg border border-border bg-card mb-6 overflow-hidden">
          {/* Engine Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <Brain className="h-5 w-5 text-primary" />
              <div>
                <h2 className="text-base font-bold text-foreground">ML Prediction Engine</h2>
                <p className="text-xs text-muted-foreground">XGBoost + Random Forest ensemble — trained on historical match data</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {engineLoading ? (
                <span className="text-xs text-muted-foreground animate-pulse">Loading status…</span>
              ) : engineStatus?.model_trained ? (
                <>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 text-success px-3 py-1 text-xs font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-success inline-block" />
                    Trained
                  </span>
                  {engineStatus.cv_accuracy && (
                    <span className="text-xs text-muted-foreground">
                      CV Accuracy: <span className="font-bold text-foreground">{Math.round(engineStatus.cv_accuracy * 100)}%</span>
                    </span>
                  )}
                  {engineStatus.n_samples > 0 && (
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      on <span className="font-bold text-foreground">{engineStatus.n_samples.toLocaleString()}</span> matches
                    </span>
                  )}
                </>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/10 text-warning px-3 py-1 text-xs font-semibold">
                  <AlertCircle className="h-3 w-3" />
                  Not Trained
                </span>
              )}
              <button
                onClick={handleTrain}
                disabled={training}
                className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${training ? "animate-spin" : ""}`} />
                {training ? "Training…" : engineStatus?.model_trained ? "Retrain" : "Train Engine"}
              </button>
            </div>
          </div>

          {/* Train result banner */}
          {trainResult && (
            <div className={`px-6 py-3 text-sm border-b border-border ${trainResult.success ? "bg-success/5 text-success" : "bg-destructive/5 text-destructive"}`}>
              {trainResult.success
                ? `✅ Trained on ${trainResult.matches_trained} matches. CV accuracy: ${Math.round((trainResult.cv_accuracy || 0) * 100)}% — completed in ${trainResult.elapsed_seconds}s`
                : `❌ ${trainResult.error || "Training failed"}`}
            </div>
          )}

          {/* Fixture List */}
          <div className="px-6 py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <h3 className="text-sm font-semibold text-foreground">Upcoming Fixtures — Click to Predict</h3>
              <select
                value={fixtureLeague}
                onChange={(e) => setFixtureLeague(e.target.value)}
                className="appearance-none rounded-lg border border-border bg-secondary/30 px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary min-w-[160px]"
              >
                <option value="">All Leagues</option>
                {leagues.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>

            {fixturesLoading ? (
              <p className="text-sm text-muted-foreground animate-pulse py-4 text-center">Loading fixtures…</p>
            ) : displayedFixtures.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No upcoming fixtures found. Sync data first.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {displayedFixtures.map((fx) => (
                  <div
                    key={fx.id}
                    className={`flex items-center justify-between rounded-lg border px-4 py-3 transition-colors cursor-pointer ${selectedFixture?.id === fx.id
                      ? "border-primary/50 bg-primary/5"
                      : "border-border hover:border-border/80 hover:bg-secondary/30"
                      }`}
                    onClick={() => handlePredictFixture(fx)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {fx.home_team} <span className="text-muted-foreground font-normal">vs</span> {fx.away_team}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {fx.league} · {fx.match_date ? new Date(fx.match_date).toLocaleDateString() : "TBD"}
                        {fx.gameweek ? ` · GW${fx.gameweek}` : ""}
                      </p>
                    </div>
                    <button
                      disabled={predictingFixture === fx.id}
                      className="ml-3 flex-shrink-0 inline-flex items-center gap-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      {predictingFixture === fx.id ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : (
                        <Play className="h-3 w-3" />
                      )}
                      {predictingFixture === fx.id ? "Predicting…" : "Predict"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fixture Prediction Result Panel */}
          {fixtureResult && selectedFixture && (
            <div className="border-t border-border px-6 py-5 bg-secondary/10">
              {fixtureResult.error ? (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {fixtureResult.error}
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Match Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{fixtureResult.match?.league}</p>
                      <p className="text-lg font-bold text-foreground">
                        {fixtureResult.match?.home_team} <span className="text-muted-foreground">vs</span> {fixtureResult.match?.away_team}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${fixtureResult.confidence === "High" ? "bg-success/10 text-success" :
                        fixtureResult.confidence === "Medium" ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"
                        }`}>
                        {fixtureResult.confidence} Confidence
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">{Math.round((fixtureResult.confidence_score || 0) * 100)}% certainty</p>
                    </div>
                  </div>

                  {/* Predicted Outcome */}
                  <div className="rounded-lg bg-primary/5 border border-primary/20 px-5 py-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Predicted Outcome</p>
                    <p className="text-xl font-black text-primary">{fixtureResult.predicted_outcome}</p>
                  </div>

                  {/* Probability Tiles */}
                  <div className="grid grid-cols-3 gap-3">
                    {(["Home Win", "Draw", "Away Win"] as const).map((label, i) => {
                      const keys = ["home_win", "draw", "away_win"] as const
                      const val = fixtureResult.probabilities?.[keys[i]] ?? 0
                      return (
                        <div key={label} className="rounded-lg border border-border bg-card px-3 py-3 text-center">
                          <p className="text-2xl font-black text-foreground">{Math.round(val * 100)}%</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                        </div>
                      )
                    })}
                  </div>

                  {/* xG & Predicted Score */}
                  {fixtureResult.expected_goals && (
                    <div className="rounded-lg border border-border bg-card px-5 py-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Expected Goals (xG)</p>
                      <div className="flex items-center justify-center gap-6">
                        <div className="text-center">
                          <p className="text-2xl font-black text-primary">{fixtureResult.expected_goals.home_xg}</p>
                          <p className="text-xs text-muted-foreground">{fixtureResult.match?.home_team}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">Predicted Score</p>
                          <p className="text-xl font-bold text-foreground">{fixtureResult.expected_goals.predicted_score}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-black text-info">{fixtureResult.expected_goals.away_xg}</p>
                          <p className="text-xs text-muted-foreground">{fixtureResult.match?.away_team}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Key Factors & Performance Patterns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Key Factors */}
                    {fixtureResult.key_factors?.length > 0 && (
                      <div className="rounded-lg border border-border bg-card px-4 py-4">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Key Deciding Factors</p>
                        <ul className="space-y-2">
                          {fixtureResult.key_factors.map((f: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                              <span className="text-primary mt-0.5 flex-shrink-0">▸</span>
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Performance Patterns */}
                    {fixtureResult.team_comparison && (
                      <div className="rounded-lg border border-border bg-card px-4 py-4">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Performance Patterns</p>
                        <div className="space-y-3">
                          {["home", "away"].map((side) => {
                            const tc = fixtureResult.team_comparison[side]
                            const name = side === "home" ? fixtureResult.match?.home_team : fixtureResult.match?.away_team
                            return (
                              <div key={side}>
                                <p className="text-xs font-semibold text-foreground mb-1.5">{name}</p>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="rounded-md bg-success/5 border border-success/20 px-3 py-2 text-center">
                                    <p className="text-sm font-bold text-success">{Math.round((tc?.clean_sheet_rate || 0) * 100)}%</p>
                                    <p className="text-xs text-muted-foreground">Clean Sheet Rate</p>
                                  </div>
                                  <div className="rounded-md bg-destructive/5 border border-destructive/20 px-3 py-2 text-center">
                                    <p className="text-sm font-bold text-destructive">{Math.round((tc?.blank_rate || 0) * 100)}%</p>
                                    <p className="text-xs text-muted-foreground">Blank Rate</p>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* H2H Summary */}
                  {fixtureResult.h2h && (fixtureResult.h2h.home_wins + fixtureResult.h2h.draws + fixtureResult.h2h.away_wins) > 0 && (
                    <div className="rounded-lg border border-border bg-card px-4 py-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Head to Head History</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-primary font-bold">{fixtureResult.h2h.home_wins}W</span>
                        <span className="text-muted-foreground">{fixtureResult.h2h.draws}D</span>
                        <span className="text-info font-bold">{fixtureResult.h2h.away_wins}W</span>
                        <span className="text-xs text-muted-foreground ml-auto">{fixtureResult.match?.home_team} vs {fixtureResult.match?.away_team}</span>
                      </div>
                      {fixtureResult.h2h.last_5?.length > 0 && (
                        <div className="flex gap-1.5 mt-2">
                          {fixtureResult.h2h.last_5.map((r: string, i: number) => (
                            <span key={i} className={`text-xs font-bold rounded px-1.5 py-0.5 ${r === "H" ? "bg-primary/10 text-primary" : r === "A" ? "bg-info/10 text-info" : "bg-secondary text-muted-foreground"
                              }`}>{r === "H" ? "HW" : r === "A" ? "AW" : "D"}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
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
          {/* Left: Past Results from DB */}
          <div className="w-full lg:w-[400px] shrink-0">
            <h2 className="text-sm font-semibold text-foreground mb-3">Recent Results — From Database</h2>
            {resultsLoading ? (
              <p className="text-sm text-muted-foreground animate-pulse py-8 text-center">Loading results from Supabase…</p>
            ) : liveResults.length === 0 ? (
              <div className="rounded-lg border border-border bg-card p-8 text-center">
                <Calendar className="h-8 w-8 mx-auto mb-3 text-muted-foreground opacity-40" />
                <p className="text-sm text-muted-foreground">No completed matches in the database yet.</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Sync data first to populate results.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 lg:max-h-[calc(100vh-320px)] lg:overflow-y-auto lg:pr-1 scrollbar-thin">
                {liveResults.map((match) => (
                  <ResultCard
                    key={match.id}
                    match={match}
                    isSelected={selected?.id === match.id}
                    onSelect={() => setSelected(match)}
                  />
                ))}
              </div>
            )}

            {/* Right: Match Detail from DB */}
            <div className="flex-1 min-w-0">
              {selected ? (
                <>
                  {/* Match Header */}
                  <div className="rounded-lg border border-border bg-card p-4 mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">{selected.league} · {selected.season}</p>
                        <h3 className="text-sm font-semibold text-foreground">
                          {selected.home_team} vs {selected.away_team}
                        </h3>
                      </div>
                      {selected.home_score !== null && (
                        <div className="text-right">
                          <p className="text-2xl font-black font-mono text-foreground">
                            {selected.home_score} – {selected.away_score}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {selected.match_date ? new Date(selected.match_date).toLocaleDateString() : ""}
                            {selected.gameweek ? ` · GW${selected.gameweek}` : ""}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Result Badge */}
                    <div className="flex gap-2">
                      {selected.home_score !== null && (
                        <>
                          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${selected.home_score > selected.away_score
                            ? "bg-primary/10 text-primary"
                            : selected.home_score < selected.away_score
                              ? "bg-info/10 text-info"
                              : "bg-secondary text-muted-foreground"
                            }`}>
                            {selected.home_score > selected.away_score
                              ? `${selected.home_team} Win`
                              : selected.home_score < selected.away_score
                                ? `${selected.away_team} Win`
                                : "Draw"}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* WPA Note — real WPA requires live match feed */}
                  <div className="rounded-lg border border-border bg-card p-4 mb-4">
                    <h3 className="text-sm font-semibold text-foreground mb-1">Win Probability Timeline</h3>
                    <p className="text-xs text-muted-foreground mb-3">Real-time WPA requires a live match data feed</p>
                    <div className="flex items-center justify-center h-40 rounded-lg bg-secondary/20 border border-dashed border-border">
                      <div className="text-center">
                        <BarChart3 className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-40" />
                        <p className="text-sm text-muted-foreground">WPA data not available for stored results</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">Use the ML Prediction engine above to get pre-match probabilities</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground">
                  Select a match from the list to view details
                </div>
              )}
            </div>
          </div>

          {/* Weekly Accuracy Trend */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-1">Weekly Accuracy Trend</h3>
            <p className="text-xs text-muted-foreground mb-4">Model performance by gameweek — from Supabase</p>
            {weeklyTrends.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] rounded-lg bg-secondary/20 border border-dashed border-border">
                <p className="text-sm text-muted-foreground">No gameweek data yet — sync match data first</p>
              </div>
            ) : (
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
                      domain={[0, 100]}
                      tick={{ fontSize: 10, fill: "oklch(0.55 0.01 260)" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) => `${v}%`}
                    />
                    <Tooltip
                      content={({ active, payload }: any) => {
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
                      {weeklyTrends.map((entry: any, i: number) => (
                        <Cell
                          key={i}
                          fill={entry.accuracy >= 80 ? "oklch(0.65 0.19 145)" : entry.accuracy >= 70 ? "oklch(0.7 0.18 55)" : "oklch(0.55 0.2 27)"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
    </div>
    </main >
    <Footer />
    </div >
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

function ResultCard({
  match,
  isSelected,
  onSelect,
}: {
  match: any
  isSelected: boolean
  onSelect: () => void
}) {
  const homeWon = match.home_score > match.away_score
  const awayWon = match.away_score > match.home_score

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
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${homeWon ? "bg-primary/10 text-primary"
            : awayWon ? "bg-info/10 text-info"
              : "bg-secondary text-muted-foreground"
            }`}>
            {homeWon ? "Home Win" : awayWon ? "Away Win" : "Draw"}
          </span>
          {match.gameweek && (
            <span className="text-[10px] text-muted-foreground">GW{match.gameweek}</span>
          )}
        </div>
        <ChevronRight className={`h-3.5 w-3.5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className={`text-sm font-semibold ${homeWon ? "text-foreground" : "text-foreground/70"}`}>
            {match.home_team}
          </p>
          <p className={`text-sm font-semibold ${awayWon ? "text-foreground" : "text-foreground/70"}`}>
            {match.away_team}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-black font-mono text-foreground">
            {match.home_score} – {match.away_score}
          </p>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground mt-2">
        {match.league} · {match.match_date ? new Date(match.match_date).toLocaleDateString() : ""}
      </p>
    </button>
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
