"use client"

import { useEffect, useState, useMemo } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { getStandings, getLeagues, getSeasons } from "@/lib/api"
import { League, Season, Standing } from "@/lib/types"
import { LayoutSplit, ChevronRight, Home, Plane, Filter } from "lucide-react"

export default function HomeAwaySplitPage() {
    const [leagues, setLeagues] = useState<League[]>([])
    const [seasons, setSeasons] = useState<Season[]>([])
    const [standings, setStandings] = useState<Standing[]>([])
    const [loading, setLoading] = useState(true)

    const [leagueId, setLeagueId] = useState("")
    const [seasonId, setSeasonId] = useState("")
    const [splitView, setSplitView] = useState<"home" | "away">("home")

    useEffect(() => {
        getLeagues().then((res) => setLeagues(res || [])).catch(() => setLeagues([]))
    }, [])

    useEffect(() => {
        if (leagueId) {
            getSeasons({ league_id: leagueId })
                .then((res) => setSeasons(res || []))
                .catch(() => setSeasons([]))
        } else {
            getSeasons()
                .then((res) => setSeasons(res || []))
                .catch(() => setSeasons([]))
        }
    }, [leagueId])

    useEffect(() => {
        setLoading(true)
        const p: any = {}
        if (leagueId) p.league_id = leagueId
        if (seasonId) p.season_id = seasonId

        getStandings(p)
            .then((rows) => {
                setStandings(rows || [])
                setLoading(false)
            })
            .catch(() => {
                setStandings([])
                setLoading(false)
            })
    }, [leagueId, seasonId])

    const parsedData = useMemo(() => {
        // We only want the current seasons if season isn't explicitly selected, 
        // or whatever is returned up to a reasonable limit.
        const currentList = seasonId ? standings : standings.filter((r) => r.is_current);

        return currentList.map(row => {
            let home = { wins: 0, draws: 0, losses: 0, goals_for: 0, goals_against: 0 }
            let away = { wins: 0, draws: 0, losses: 0, goals_for: 0, goals_against: 0 }

            try {
                if (row.home_away_split) {
                    const split = typeof row.home_away_split === "string"
                        ? JSON.parse(row.home_away_split.replace(/'/g, '"'))
                        : row.home_away_split

                    if (split.home) home = split.home
                    if (split.away) away = split.away
                }
            } catch (e) {
                console.error("Failed to parse split data", e)
            }

            return { ...row, home, away }
        })
    }, [standings, seasonId])

    // Sorting logic for current split view
    const sortedData = useMemo(() => {
        return [...parsedData].sort((a, b) => {
            // Calculate points manually
            const ptsA = (a[splitView].wins * 3) + a[splitView].draws
            const ptsB = (b[splitView].wins * 3) + b[splitView].draws

            if (ptsA !== ptsB) return ptsB - ptsA // Sort by points desc

            const gdA = a[splitView].goals_for - a[splitView].goals_against
            const gdB = b[splitView].goals_for - b[splitView].goals_against
            if (gdA !== gdB) return gdB - gdA // Sort by goal diff

            return b[splitView].goals_for - a[splitView].goals_for // Sort by goals for
        })
    }, [parsedData, splitView])

    const isEmpty = !loading && sortedData.length === 0

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="mx-auto max-w-[1280px] px-4 lg:px-6 py-6">
                {/* Page Header */}
                <div className="mb-6">
                    <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                        {splitView === "home" ? <Home className="h-6 w-6 text-primary" /> : <Plane className="h-6 w-6 text-info" />}
                        Home-Away Split
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Analyze team performance isolated by home and away fixtures
                    </p>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <select
                                value={leagueId}
                                onChange={(e) => {
                                    setLeagueId(e.target.value)
                                    setSeasonId("")
                                }}
                                className="appearance-none rounded-lg border border-border bg-card pl-9 pr-8 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full sm:w-auto min-w-[200px]"
                            >
                                <option value="">All Leagues</option>
                                {leagues.map((l) => (
                                    <option key={l.id} value={l.id}>
                                        {l.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="relative">
                            <select
                                value={seasonId}
                                onChange={(e) => setSeasonId(e.target.value)}
                                disabled={seasons.length === 0}
                                className="appearance-none rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 w-full sm:w-auto min-w-[160px]"
                            >
                                <option value="">All Seasons</option>
                                {seasons.map((s) => (
                                    <option key={s.season_id} value={s.season_id}>
                                        {s.season} {s.is_current ? " ★ Current" : ""}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center rounded-lg border border-border bg-card p-1 w-full md:w-auto">
                        <button
                            onClick={() => setSplitView("home")}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 rounded-md px-6 py-2 text-sm font-semibold transition-colors ${splitView === "home"
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                                }`}
                        >
                            <Home className="h-4 w-4" />
                            Home Form
                        </button>
                        <button
                            onClick={() => setSplitView("away")}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 rounded-md px-6 py-2 text-sm font-semibold transition-colors ${splitView === "away"
                                ? "bg-info text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                                }`}
                        >
                            <Plane className="h-4 w-4" />
                            Away Form
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className={`rounded-lg border overflow-hidden bg-card ${splitView === "home" ? "border-primary/20" : "border-info/20"
                    }`}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-secondary/30">
                                    <th className="px-3 py-3 text-center text-xs font-medium text-muted-foreground w-12">#</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Team</th>
                                    <th className="px-3 py-3 text-center text-xs font-medium text-muted-foreground hidden sm:table-cell">League</th>
                                    <th className="px-2 py-3 text-center text-xs font-medium text-muted-foreground">P</th>
                                    <th className="px-2 py-3 text-center text-xs font-medium text-muted-foreground">W</th>
                                    <th className="px-2 py-3 text-center text-xs font-medium text-muted-foreground">D</th>
                                    <th className="px-2 py-3 text-center text-xs font-medium text-muted-foreground">L</th>
                                    <th className="px-2 py-3 text-center text-xs font-medium text-muted-foreground hidden lg:table-cell">GF</th>
                                    <th className="px-2 py-3 text-center text-xs font-medium text-muted-foreground hidden lg:table-cell">GA</th>
                                    <th className="px-2 py-3 text-center text-xs font-medium text-muted-foreground">GD</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Pts</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={11} className="px-4 py-8 text-center text-sm text-muted-foreground">
                                            Loading {splitView} split data...
                                        </td>
                                    </tr>
                                ) : isEmpty ? (
                                    <tr>
                                        <td colSpan={11} className="px-4 py-8 text-center text-sm text-muted-foreground">
                                            No data found. Ensure the syncing process extracted home/away split properties.
                                        </td>
                                    </tr>
                                ) : (
                                    sortedData.map((s, i) => {
                                        const stats = s[splitView]
                                        const played = stats.wins + stats.draws + stats.losses
                                        const gd = stats.goals_for - stats.goals_against
                                        const pts = (stats.wins * 3) + stats.draws

                                        return (
                                            <tr
                                                key={`${s.team}-${i}`}
                                                className={`border-b border-border/50 hover:bg-secondary/20 transition-colors ${i < 4 ? (splitView === "home" ? "bg-primary/5" : "bg-info/5") : ""
                                                    }`}
                                            >
                                                <td className="px-3 py-3 text-center font-mono text-muted-foreground">{i + 1}</td>
                                                <td className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">{s.team}</td>
                                                <td className="px-3 py-3 text-center text-xs text-muted-foreground hidden sm:table-cell">
                                                    <span className="inline-block bg-secondary rounded-md px-2 py-1">{s.league}</span>
                                                </td>
                                                <td className="px-2 py-3 text-center text-muted-foreground">{played}</td>
                                                <td className={`px-2 py-3 text-center font-bold ${splitView === "home" ? "text-primary" : "text-info"}`}>{stats.wins}</td>
                                                <td className="px-2 py-3 text-center font-semibold text-warning">{stats.draws}</td>
                                                <td className="px-2 py-3 text-center font-semibold text-destructive">{stats.losses}</td>
                                                <td className="px-2 py-3 text-center text-muted-foreground hidden lg:table-cell">{stats.goals_for}</td>
                                                <td className="px-2 py-3 text-center text-muted-foreground hidden lg:table-cell">{stats.goals_against}</td>
                                                <td className={`px-2 py-3 text-center font-bold ${gd > 0 ? (splitView === "home" ? "text-primary" : "text-info") : gd < 0 ? "text-destructive" : "text-muted-foreground"
                                                    }`}>
                                                    {gd > 0 ? "+" : ""}{gd}
                                                </td>
                                                <td className="px-4 py-3 text-center font-mono font-black text-lg text-foreground">{pts}</td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </main>
            <Footer />
        </div>
    )
}
