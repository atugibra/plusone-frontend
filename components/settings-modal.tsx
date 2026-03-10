"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useStore } from "@/lib/store";
import { Settings, X, Moon, Sun, Monitor, Check } from "lucide-react";

export function SettingsModal() {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  const oddsFormat = useStore((state) => state.oddsFormat);
  const setOddsFormat = useStore((state) => state.setOddsFormat);
  const animationsEnabled = useStore((state) => state.animationsEnabled);
  const setAnimationsEnabled = useStore((state) => state.setAnimationsEnabled);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <>
      <button 
        onClick={() => setOpen(true)}
        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        aria-label="Settings"
      >
        <Settings className="h-4 w-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-lg font-bold">Preferences</h2>
              <button 
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              
              {/* Theme Selection */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground">Theme</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setTheme("light")}
                    className={`flex flex-col items-center justify-center gap-2 rounded-lg border p-3 transition-colors ${theme === "light" ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary/30 hover:bg-secondary/60 text-muted-foreground hover:text-foreground"}`}
                  >
                    <Sun className="h-5 w-5" />
                    <span className="text-xs font-medium">Light</span>
                  </button>
                  <button
                    onClick={() => setTheme("dark")}
                    className={`flex flex-col items-center justify-center gap-2 rounded-lg border p-3 transition-colors ${theme === "dark" ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary/30 hover:bg-secondary/60 text-muted-foreground hover:text-foreground"}`}
                  >
                    <Moon className="h-5 w-5" />
                    <span className="text-xs font-medium">Dark</span>
                  </button>
                  <button
                    onClick={() => setTheme("system")}
                    className={`flex flex-col items-center justify-center gap-2 rounded-lg border p-3 transition-colors ${theme === "system" ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary/30 hover:bg-secondary/60 text-muted-foreground hover:text-foreground"}`}
                  >
                    <Monitor className="h-5 w-5" />
                    <span className="text-xs font-medium">System</span>
                  </button>
                </div>
              </div>

              {/* Odds Format */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground">Odds Format</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "decimal", label: "Decimal", ex: "2.50" },
                    { id: "fractional", label: "Fractional", ex: "3/2" },
                    { id: "american", label: "American", ex: "+150" }
                  ].map((format) => (
                    <button
                      key={format.id}
                      onClick={() => setOddsFormat(format.id as any)}
                      className={`flex flex-col items-center justify-center gap-1 rounded-lg border py-2 px-1 transition-colors ${oddsFormat === format.id ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary/30 hover:bg-secondary/60 text-muted-foreground hover:text-foreground"}`}
                    >
                      <span className="text-xs font-semibold">{format.label}</span>
                      <span className="text-[10px] opacity-70">{format.ex}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Animations */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  <label className="text-sm font-semibold text-foreground block">UI Animations</label>
                  <span className="text-xs text-muted-foreground">Enable smooth transitions and physics.</span>
                </div>
                <button
                  onClick={() => setAnimationsEnabled(!animationsEnabled)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${animationsEnabled ? 'bg-primary' : 'bg-muted'}`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out ${animationsEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

            </div>

            <div className="border-t border-border bg-secondary/30 px-6 py-4 flex justify-end">
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
