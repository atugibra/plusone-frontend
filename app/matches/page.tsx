"use client"

import { useEffect, useState, useMemo } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { getMatches, getLeagues } from "@/lib/api"
import { Match, League } from "@/lib/types"
import { Calendar, Filter, Search, CheckCircle2, Clock, X } from "lucide-react"

type TabType = "all" | "results" | "fixtures"

export default function MatchesPage() {
  const [tab, setTab] = useState<TabType>("all")
  const [leagueFilter, setLeagueFilter] = useState("")
  const [search, setSearch] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [matchesData, setMatchesData] = useState<Match[]>([])
  const [leagues, setLeagues] = useState<League[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      // Fetch past results (matches with scores) sorted by date DESC
      getMatches({ limit: 500, has_score: "true" }),
      // Fetch upcoming fixtures (matches without scores) sorted by date ASC 
      getMatches({ limit: 500, has_score: "false" }),
      getLeagues()
    ]).then(([resultsRes, fixturesRes, leaguesRes]) => {
      // Combine both - results first then fixtures
      const combined = [...(resultsRes || []), ...(fixturesRes || [])]
      setMatchesData(combined)
      setLeagues(leaguesRes || [])
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let data = [...matchesData]
    if (tab === "results") data = data.filter((m) => m.home_score !== null && m.home_score !== undefined)
    if (tab === "fixtures") data = data.filter((m) => m.home_score === null || m.home_score === undefined)
    if (leagueFilter) data = data.filter((m) => m.league === leagueFilter)
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(
        (m) =>
          (m.home_team || "").toLowerCase().includes(q) ||
          (m.away_team || "").toLowerCase().includes(q) ||
          (m.venue || "").toLowerCase().includes(q)
      )
    }
    // Date range filter
    if (dateFrom) data = data.filter((m) => (m.match_date || "") >= dateFrom)
    if (dateTo) data = data.filter((m) => (m.match_date || "") <= dateTo)
    // Results sorted newest first, fixtures sorted soonest first
    return data.sort((a, b) => {
      const hasScoreA = a.home_score !== null && a.home_score !== undefined
      const hasScoreB = b.home_score !== null && b.home_score !== undefined
      if (hasScoreA && hasScoreB) return (b.match_date || "").localeCompare(a.match_date || "")
      if (!hasScoreA && !hasScoreB) return (a.match_date || "").localeCompare(b.match_date || "")
      return hasScoreA ? -1 : 1
    })
  }, [tab, leagueFilter, search, matchesData])

  const results = matchesData.filter((m) => m.home_score !== null && m.home_score !== undefined).length
  const fixtures = matchesData.filter((m) => m.home_score === null || m.home_score === undefined).length

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-[1280px] px-4 lg:px-6 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-foreground text-balance">Matches</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? "Loading..." : `${results} results, ${fixtures} upcoming fixtures`}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-0.5 rounded-lg border border-border bg-card p-0.5">
            {(["all", "results", "fixtures"] as TabType[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${tab === t ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                {t === "all" ? "All" : t === "results" ? "Results" : "Fixtures"}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search teams or venues..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-card pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={leagueFilter}
              onChange={(e) => setLeagueFilter(e.target.value)}
              className="appearance-none rounded-lg border border-border bg-card pl-9 pr-8 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All Leagues</option>
              {leagues.map((l) => (
                <option key={l.id} value={l.name}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          {/* Date Range Calendar */}
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              title="From date"
              className="bg-transparent text-xs text-foreground focus:outline-none w-[110px]"
            />
            <span className="text-muted-foreground text-xs">→</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              title="To date"
              className="bg-transparent text-xs text-foreground focus:outline-none w-[110px]"
            />
            {(dateFrom || dateTo) && (
              <button
                onClick={() => { setDateFrom(""); setDateTo("") }}
                className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
                title="Clear date filter"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Match List */}
        <div className="flex flex-col gap-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card p-12 text-center">
              <p className="text-sm text-muted-foreground">Loading matches...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card p-12 text-center">
              <Calendar className="h-8 w-8 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No matches found</p>
            </div>
          ) : filtered.map((match) => (
            <div
              key={match.id}
              className="rounded-lg border border-border bg-card p-4 hover:border-border/80 transition-colors"
            >
              <div className="flex items-center justify-between gap-4">
                {/* Left: Date & League */}
                <div className="flex flex-col gap-1 shrink-0 w-24 sm:w-32">
                  <span className="text-[10px] font-medium text-primary">{match.league}</span>
                  <span className="text-[11px] text-muted-foreground">{formatDate(match.match_date)}</span>
                  {match.gameweek && (
                    <span className="text-[10px] text-muted-foreground/60">GW {match.gameweek}</span>
                  )}
                </div>

                {/* Center: Teams & Score */}
                <div className="flex-1 flex items-center justify-center gap-3 sm:gap-6 min-w-0">
                  <div className="flex-1 text-right">
                    <span className={`text-sm font-semibold truncate block ${match.home_score !== null && (match.home_score ?? 0) > (match.away_score ?? 0)
                      ? "text-foreground"
                      : "text-foreground/70"
                      }`}>
                      {match.home_team}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {match.home_score !== null ? (
                      <div className="flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5">
                        <span className="text-sm font-bold font-mono text-foreground">{match.home_score}</span>
                        <span className="text-xs text-muted-foreground">-</span>
                        <span className="text-sm font-bold font-mono text-foreground">{match.away_score}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 rounded-md border border-border bg-secondary/30 px-3 py-1.5">
                        <span className="text-xs font-medium text-muted-foreground">vs</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 text-left">
                    <span className={`text-sm font-semibold truncate block ${match.home_score !== null && (match.away_score ?? 0) > (match.home_score ?? 0)
                      ? "text-foreground"
                      : "text-foreground/70"
                      }`}>
                      {match.away_team}
                    </span>
                  </div>
                </div>

                {/* Right: Status */}
                <div className="flex items-center gap-2 shrink-0">
                  {match.home_score !== null ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5">
                      <CheckCircle2 className="h-3 w-3 text-primary" />
                      <span className="text-[10px] font-medium text-primary">FT</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-info/10 px-2 py-0.5">
                      <Clock className="h-3 w-3 text-info" />
                      <span className="text-[10px] font-medium text-info">TBD</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Venue */}
              <div className="mt-2 text-[10px] text-muted-foreground/60 text-center">
                {match.venue}
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}

function formatDate(d: string) {
  if (!d) return "";
  const date = new Date(d + "T12:00:00")
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}
