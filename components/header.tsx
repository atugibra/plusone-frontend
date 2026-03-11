"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Activity, BarChart3, TrendingUp, Users, Trophy, Calendar, Menu, X, ListOrdered, Shield, Zap, RefreshCw, LineChart, Percent, Sparkles } from "lucide-react"
import { SettingsModal } from "@/components/settings-modal"
import { useState } from "react"

const navLinks = [
  { href: "/", label: "Overview", icon: BarChart3 },
  { href: "/leagues", label: "Leagues", icon: Trophy },
  { href: "/matches", label: "Fixtures", icon: Calendar },
  { href: "/standings", label: "Standings", icon: ListOrdered },
  { href: "/squad-stats", label: "Squad Stats", icon: Shield },
  { href: "/players", label: "Players", icon: Users },
  { href: "/predictions", label: "Predictions", icon: TrendingUp },
  { href: "/predictions-feed", label: "Free Picks", icon: Sparkles },
  { href: "/head-to-head", label: "Head to Head", icon: Zap },
  { href: "/sync", label: "Sync / Data", icon: RefreshCw },
  { href: "/home-away-split", label: "Home-Away Split", icon: Activity },
  { href: "/markets", label: "Markets", icon: Percent },
  { href: "/performance", label: "Performance", icon: LineChart },
]


export function Header() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto max-w-[1440px] px-4 lg:px-6">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Activity className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold tracking-tight text-foreground">PlusOne</span>
              <span className="hidden sm:inline-flex items-center rounded-full border border-primary/30 bg-primary/5 px-1.5 py-0.5 text-[9px] font-semibold text-primary">
                BETA
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center gap-0.5" role="navigation" aria-label="Main navigation">
            {navLinks.map((link) => {
              const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    }`}
                >
                  <link.icon className="h-3.5 w-3.5" />
                  <span className="hidden 2xl:inline">{link.label}</span>
                  <span className="2xl:hidden">{link.label.split(' ')[0]}</span>
                </Link>
              )
            })}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-2.5 py-1">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              <span className="text-[10px] font-medium text-primary">9 Leagues</span>
            </div>
            
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-medium text-foreground">2025-26</span>
              <span className="text-[10px] text-muted-foreground">Season Active</span>
            </div>
            
            <SettingsModal />

            {/* Mobile menu button */}
            <button
              className="xl:hidden flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle mobile menu"
              aria-expanded={mobileOpen}
              title="Menu"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileOpen && (
          <nav className="xl:hidden border-t border-border py-2 -mx-4 px-4 overflow-y-auto max-h-[80vh]" role="navigation" aria-label="Mobile navigation">
            <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-4">
              {navLinks.map((link) => {
                const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                      }`}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                )
              })}
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
