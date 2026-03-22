"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Activity, BarChart3, TrendingUp, Users, Trophy, Calendar, Menu, X, ListOrdered, Shield, Zap, RefreshCw, LineChart, Percent, Sparkles, MessageSquare, Settings, LogIn, LogOut, User, ShieldCheck } from "lucide-react"
import { useState } from "react"
import { SettingsModal } from "@/components/settings-modal"
import { LoginModal } from "@/components/login-modal"
import { useAuth } from "@/lib/auth"


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
  { href: "/feedback", label: "Feedback", icon: MessageSquare },
]



export function Header() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { user, logout, isAdmin } = useAuth()

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "?"

  return (
    <>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
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
            <nav 
              className="hidden xl:flex flex-1 items-center gap-1 mx-4" 
              role="navigation" 
              aria-label="Main navigation"
            >
              <div className="flex gap-1">
                {/* Show first 6 links always */}
                {navLinks.slice(0, 6).map((link) => {
                  const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href)
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center shrink-0 gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                        }`}
                    >
                      <link.icon className="h-4 w-4" />
                      <span>{link.label}</span>
                    </Link>
                  )
                })}

                {/* "More" Dropdown for the rest */}
                <div className="relative group">
                  <button
                    className="flex items-center shrink-0 gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    aria-haspopup="true"
                  >
                    <ListOrdered className="h-4 w-4" />
                    <span>More ▾</span>
                  </button>
                  
                  {/* Dropdown Menu (Hover Triggered) */}
                  <div className="absolute left-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="w-56 rounded-md border border-border bg-popover shadow-md py-1">
                      {navLinks.slice(6).map((link) => {
                        const isActive = pathname.startsWith(link.href)
                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition-colors ${isActive
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
                  </div>
                </div>
              </div>
            </nav>

            <div className="flex items-center gap-2">
              <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-2.5 py-1">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                <span className="text-[10px] font-medium text-primary">22 Leagues</span>
              </div>
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-medium text-foreground">2025-26</span>
                <span className="text-[10px] text-muted-foreground">Season Active</span>
              </div>

              {/* Settings */}
              <SettingsModal />

              {/* Auth: Login or User Menu */}
              {!user ? (
                <button
                  id="login-btn"
                  onClick={() => setShowLogin(true)}
                  className="hidden sm:flex items-center gap-1.5 rounded-md border border-border bg-secondary/50 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Log In
                </button>
              ) : (
                <div className="relative">
                  <button
                    id="user-menu-btn"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 rounded-full border border-border bg-secondary/50 pl-1 pr-2.5 py-1 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                    aria-expanded={userMenuOpen}
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-[10px] font-bold">
                      {initials}
                    </span>
                    <span className="hidden sm:block max-w-[100px] truncate">{user.email.split("@")[0]}</span>
                  </button>

                  {userMenuOpen && (
                    <>
                      {/* Backdrop to close */}
                      <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-popover shadow-xl py-2 z-50">
                        {/* User info */}
                        <div className="px-3 py-2 border-b border-border mb-1">
                          <p className="text-xs font-semibold text-foreground truncate">{user.email}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            {isAdmin ? (
                              <ShieldCheck className="h-3 w-3 text-primary" />
                            ) : (
                              <User className="h-3 w-3 text-muted-foreground" />
                            )}
                            <span className="text-[11px] text-muted-foreground capitalize">{user.role}</span>
                          </div>
                        </div>

                        {/* Admin Panel link for admins */}
                        {isAdmin && (
                          <Link
                            href="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary/60 transition-colors"
                          >
                            <Settings className="h-4 w-4 text-primary" />
                            Admin Panel
                          </Link>
                        )}

                        {/* Logout */}
                        <button
                          id="logout-btn"
                          onClick={() => { logout(); setUserMenuOpen(false); }}
                          className="flex w-full items-center gap-2.5 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          Log Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

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
              {/* Mobile login / user section */}
              <div className="mt-2 pt-2 border-t border-border">
                {!user ? (
                  <button
                    onClick={() => { setMobileOpen(false); setShowLogin(true); }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary/50 transition-colors"
                  >
                    <LogIn className="h-4 w-4" />
                    Log In
                  </button>
                ) : (
                  <>
                    {isAdmin && (
                      <Link href="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary/50 transition-colors">
                        <Settings className="h-4 w-4 text-primary" />
                        Admin Panel
                      </Link>
                    )}
                    <button onClick={() => { logout(); setMobileOpen(false); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors">
                      <LogOut className="h-4 w-4" />
                      Log Out
                    </button>
                  </>
                )}
              </div>
            </nav>
          )}
        </div>
      </header>
    </>
  )
}

