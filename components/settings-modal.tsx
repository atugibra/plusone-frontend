"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import {
  Settings, X, Moon, Sun, Monitor, LayoutGrid, LayoutList,
  RefreshCw, Eye, Minimize2
} from "lucide-react";

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        enabled ? "bg-primary" : "bg-muted"
      }`}
      role="switch"
      aria-checked={enabled}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
          enabled ? "translate-x-5" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-border/40 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 pt-4 pb-1 first:pt-0">
      {children}
    </p>
  );
}

export function SettingsModal() {
  const [open, setOpen] = useState(false);
  const {
    theme, setTheme,
    oddsFormat, setOddsFormat,
    animationsEnabled, setAnimationsEnabled,
    compactMode, setCompactMode,
    showConfidenceBadge, setShowConfidenceBadge,
    defaultView, setDefaultView,
    autoRefreshInterval, setAutoRefreshInterval,
  } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <>
      <button
        id="settings-btn"
        onClick={() => setOpen(true)}
        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        aria-label="Settings"
      >
        <Settings className="h-4 w-4" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-7 py-5">
              <div>
                <h2 className="text-lg font-bold text-foreground">Preferences</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Customise your PlusOne experience</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Body */}
            <div className="px-7 py-5 overflow-y-auto max-h-[70vh] space-y-1">

              {/* ── APPEARANCE ─────────────────────────────────────────── */}
              <SectionTitle>Appearance</SectionTitle>

              {/* Theme */}
              <div className="py-4 border-b border-border/40">
                <p className="text-sm font-medium text-foreground mb-3">Theme</p>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { id: "light" as const, label: "Light", Icon: Sun },
                    { id: "dark" as const, label: "Dark", Icon: Moon },
                    { id: "system" as const, label: "System", Icon: Monitor },
                  ]).map(({ id, label, Icon }) => (
                    <button
                      key={id}
                      onClick={() => setTheme(id)}
                      className={`flex flex-col items-center justify-center gap-2 rounded-lg border py-4 transition-all ${
                        theme === id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-secondary/30 hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-sm font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <SettingRow label="Compact Mode" description="Reduce spacing and card sizes">
                <Toggle enabled={compactMode} onToggle={() => setCompactMode(!compactMode)} />
              </SettingRow>

              <SettingRow label="UI Animations" description="Smooth transitions and physics">
                <Toggle enabled={animationsEnabled} onToggle={() => setAnimationsEnabled(!animationsEnabled)} />
              </SettingRow>

              {/* ── PREDICTIONS ─────────────────────────────────────────── */}
              <SectionTitle>Predictions</SectionTitle>

              {/* Odds Format */}
              <div className="py-4 border-b border-border/40">
                <p className="text-sm font-medium text-foreground mb-3">Odds Format</p>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { id: "decimal" as const, label: "Decimal", ex: "2.50" },
                    { id: "fractional" as const, label: "Fractional", ex: "3/2" },
                    { id: "american" as const, label: "American", ex: "+150" },
                  ]).map((format) => (
                    <button
                      key={format.id}
                      onClick={() => setOddsFormat(format.id)}
                      className={`flex flex-col items-center justify-center gap-1.5 rounded-lg border py-3 transition-all ${
                        oddsFormat === format.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-secondary/30 hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span className="text-sm font-semibold">{format.label}</span>
                      <span className="text-xs opacity-70 font-mono">{format.ex}</span>
                    </button>
                  ))}
                </div>
              </div>

              <SettingRow label="Show Confidence Badge" description="Display High / Medium / Low on picks">
                <Toggle enabled={showConfidenceBadge} onToggle={() => setShowConfidenceBadge(!showConfidenceBadge)} />
              </SettingRow>

              {/* ── DISPLAY ─────────────────────────────────────────────── */}
              <SectionTitle>Display</SectionTitle>

              {/* Default View */}
              <div className="py-3 border-b border-border/40">
                <p className="text-sm font-medium text-foreground mb-2">Default Predictions View</p>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { id: "cards" as const, label: "Cards", Icon: LayoutGrid },
                    { id: "table" as const, label: "Table", Icon: LayoutList },
                  ]).map(({ id, label, Icon }) => (
                    <button
                      key={id}
                      onClick={() => setDefaultView(id)}
                      className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 transition-all ${
                        defaultView === id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-secondary/30 hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-xs font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto-refresh */}
              <div className="py-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">Auto-Refresh Picks</p>
                  </div>
                  <span className="text-xs font-mono text-primary">
                    {autoRefreshInterval === 0 ? "Off" : `${autoRefreshInterval}m`}
                  </span>
                </div>
                <div className="flex gap-2">
                  {[0, 5, 15, 30].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => setAutoRefreshInterval(mins)}
                      className={`flex-1 rounded-lg border py-1.5 text-xs font-medium transition-all ${
                        autoRefreshInterval === mins
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-secondary/30 hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {mins === 0 ? "Off" : `${mins}m`}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Automatically reload Free Picks at the selected interval
                </p>
              </div>

            </div>

            {/* Footer */}
            <div className="border-t border-border bg-secondary/10 px-7 py-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Settings saved automatically</p>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg bg-primary text-primary-foreground px-6 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
