'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getSettings,
  putSetting,
  getAutoConsensusStatus,
  triggerAutoConsensus,
} from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AppSetting {
  key: string;
  value: string;
  description: string | null;
  updated_at: string | null;
}

interface ConsensusStatus {
  interval_hours: number;
  last_run: string | null;
  last_count: number;
  last_error: string | null;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [settings, setSettings]     = useState<AppSetting[]>([]);
  const [status, setStatus]         = useState<ConsensusStatus | null>(null);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState<string | null>(null);
  const [triggering, setTriggering] = useState(false);
  const [toast, setToast]           = useState<{ msg: string; ok: boolean } | null>(null);

  // interval picker state — initialised from the DB value
  const [intervalInput, setIntervalInput] = useState<string>('6');

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const refresh = useCallback(async () => {
    try {
      const [s, st] = await Promise.all([getSettings(), getAutoConsensusStatus()]);
      const all: AppSetting[] = s.settings ?? [];
      setSettings(all);
      setStatus(st);
      const intervalRow = all.find((r) => r.key === 'consensus_interval_hours');
      if (intervalRow) setIntervalInput(intervalRow.value);
    } catch (e: any) {
      showToast(`Failed to load settings: ${e.message}`, false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // ── Save interval ───────────────────────────────────────────────────────────
  const saveInterval = async () => {
    const hours = parseInt(intervalInput, 10);
    if (isNaN(hours) || hours < 1 || hours > 168) {
      showToast('Enter a value between 1 and 168 hours.', false);
      return;
    }
    setSaving('interval');
    try {
      await putSetting(
        'consensus_interval_hours',
        String(hours),
        'How often the auto-consensus prediction job runs (hours). Min: 1, Max: 168.'
      );
      showToast(`Interval updated to ${hours}h. Takes effect on next scheduled run.`);
      await refresh();
    } catch (e: any) {
      showToast(`Save failed: ${e.message}`, false);
    } finally {
      setSaving(null);
    }
  };

  // ── Trigger job ─────────────────────────────────────────────────────────────
  const handleTrigger = async () => {
    setTriggering(true);
    try {
      await triggerAutoConsensus();
      showToast('Auto-consensus job started. Predictions will be logged in the background.');
      setTimeout(refresh, 4000); // refresh status after a few seconds
    } catch (e: any) {
      showToast(`Trigger failed: ${e.message}`, false);
    } finally {
      setTriggering(false);
    }
  };

  // ── UI helpers ──────────────────────────────────────────────────────────────
  const fmtDate = (iso: string | null) => {
    if (!iso) return 'Never';
    try { return new Date(iso).toLocaleString(); } catch { return iso; }
  };

  const PRESETS = [
    { label: '1h',  value: 1 },
    { label: '3h',  value: 3 },
    { label: '6h',  value: 6 },
    { label: '12h', value: 12 },
    { label: '24h', value: 24 },
    { label: '48h', value: 48 },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="settings-page">
      {/* Toast */}
      {toast && (
        <div className={`settings-toast ${toast.ok ? 'toast-ok' : 'toast-err'}`}>
          {toast.ok ? '✅' : '❌'} {toast.msg}
        </div>
      )}

      <header className="settings-header">
        <h1>⚙️ Admin Settings</h1>
        <p>Configure system behaviour. Changes take effect without server restarts.</p>
      </header>

      {loading ? (
        <div className="settings-loading">Loading settings…</div>
      ) : (
        <div className="settings-grid">

          {/* ── Auto-consensus Interval ─────────────────────────────────── */}
          <section className="settings-card">
            <div className="card-title">
              <span className="card-icon">🤖</span>
              <div>
                <h2>Auto-Consensus Prediction Interval</h2>
                <p>How often the system automatically runs DC + ML + Legacy predictions for all upcoming fixtures and logs them to the database.</p>
              </div>
            </div>

            <div className="interval-current">
              Current interval: <strong>{status?.interval_hours ?? '—'}h</strong>
            </div>

            {/* Preset buttons */}
            <div className="preset-row">
              {PRESETS.map((p) => (
                <button
                  key={p.value}
                  className={`preset-btn ${intervalInput === String(p.value) ? 'preset-active' : ''}`}
                  onClick={() => setIntervalInput(String(p.value))}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom input */}
            <div className="custom-row">
              <label htmlFor="interval-input">Custom (hours)</label>
              <div className="input-group">
                <input
                  id="interval-input"
                  type="number"
                  min={1}
                  max={168}
                  value={intervalInput}
                  onChange={(e) => setIntervalInput(e.target.value)}
                  className="interval-input"
                />
                <button
                  className="save-btn"
                  onClick={saveInterval}
                  disabled={saving === 'interval'}
                >
                  {saving === 'interval' ? 'Saving…' : 'Save'}
                </button>
              </div>
              <span className="input-hint">Between 1 (hourly) and 168 (weekly)</span>
            </div>
          </section>

          {/* ── Job Status ───────────────────────────────────────────────── */}
          <section className="settings-card">
            <div className="card-title">
              <span className="card-icon">📊</span>
              <div>
                <h2>Auto-Consensus Job Status</h2>
                <p>Monitor the background prediction job that runs automatically.</p>
              </div>
            </div>

            <div className="status-grid">
              <div className="status-item">
                <span className="status-label">Last Run</span>
                <span className="status-value">{fmtDate(status?.last_run ?? null)}</span>
              </div>
              <div className="status-item">
                <span className="status-label">Predictions Logged</span>
                <span className="status-value">{status?.last_count ?? 0}</span>
              </div>
              <div className="status-item">
                <span className="status-label">Last Error</span>
                <span className={`status-value ${status?.last_error ? 'error-text' : 'ok-text'}`}>
                  {status?.last_error ?? 'None'}
                </span>
              </div>
            </div>

            <button
              className="trigger-btn"
              onClick={handleTrigger}
              disabled={triggering}
            >
              {triggering ? (
                <><span className="spinner" /> Running…</>
              ) : (
                '▶ Run Now'
              )}
            </button>
            <p className="trigger-note">
              Triggers an immediate run. Results appear in the Prediction Log table.
            </p>
          </section>

          {/* ── All Settings (raw table) ──────────────────────────────────── */}
          {settings.length > 0 && (
            <section className="settings-card full-width">
              <div className="card-title">
                <span className="card-icon">🗃️</span>
                <div>
                  <h2>All Settings</h2>
                  <p>Full list of admin-configurable keys in the database.</p>
                </div>
              </div>
              <table className="settings-table">
                <thead>
                  <tr>
                    <th>Key</th>
                    <th>Value</th>
                    <th>Description</th>
                    <th>Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {settings.map((s) => (
                    <tr key={s.key}>
                      <td><code>{s.key}</code></td>
                      <td><strong>{s.value}</strong></td>
                      <td>{s.description ?? '—'}</td>
                      <td>{fmtDate(s.updated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </div>
      )}

      <style>{`
        .settings-page {
          max-width: 900px;
          margin: 0 auto;
          padding: 2rem 1.5rem;
          font-family: var(--font-inter, system-ui, sans-serif);
          color: #e2e8f0;
          min-height: 100vh;
        }

        /* Toast */
        .settings-toast {
          position: fixed;
          top: 1.25rem;
          right: 1.25rem;
          z-index: 9999;
          padding: 0.75rem 1.25rem;
          border-radius: 10px;
          font-size: 0.875rem;
          font-weight: 500;
          box-shadow: 0 4px 20px rgba(0,0,0,0.4);
          animation: slide-in 0.25s ease;
        }
        .toast-ok  { background: #1a3a28; border: 1px solid #22c55e; color: #bbf7d0; }
        .toast-err { background: #3a1a1a; border: 1px solid #ef4444; color: #fecaca; }
        @keyframes slide-in { from { transform: translateX(120%); opacity:0; } to { transform: translateX(0); opacity:1; } }

        /* Header */
        .settings-header { margin-bottom: 2rem; }
        .settings-header h1 { font-size: 1.75rem; font-weight: 700; margin: 0 0 0.4rem; }
        .settings-header p  { color: #94a3b8; margin: 0; font-size: 0.9rem; }

        .settings-loading { color: #64748b; padding: 3rem; text-align: center; }

        /* Grid */
        .settings-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        @media (max-width: 680px) { .settings-grid { grid-template-columns: 1fr; } }
        .full-width { grid-column: 1 / -1; }

        /* Cards */
        .settings-card {
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 14px;
          padding: 1.5rem;
        }
        .card-title {
          display: flex;
          gap: 0.75rem;
          align-items: flex-start;
          margin-bottom: 1.25rem;
        }
        .card-icon { font-size: 1.5rem; flex-shrink: 0; }
        .card-title h2 { font-size: 1.05rem; font-weight: 600; margin: 0 0 0.3rem; }
        .card-title p  { font-size: 0.8rem; color: #64748b; margin: 0; line-height: 1.4; }

        /* Interval */
        .interval-current {
          font-size: 0.85rem;
          color: #94a3b8;
          margin-bottom: 1rem;
        }
        .interval-current strong { color: #38bdf8; font-size: 1rem; }

        .preset-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        .preset-btn {
          padding: 0.35rem 0.85rem;
          border-radius: 8px;
          border: 1px solid #334155;
          background: #1e293b;
          color: #94a3b8;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.15s;
        }
        .preset-btn:hover    { border-color: #38bdf8; color: #38bdf8; }
        .preset-active       { border-color: #38bdf8 !important; background: #0c2033 !important; color: #38bdf8 !important; }

        .custom-row { display: flex; flex-direction: column; gap: 0.5rem; }
        .custom-row label { font-size: 0.8rem; color: #64748b; }

        .input-group {
          display: flex;
          gap: 0.5rem;
        }
        .interval-input {
          flex: 1;
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 8px;
          color: #e2e8f0;
          padding: 0.5rem 0.75rem;
          font-size: 0.9rem;
          outline: none;
          transition: border-color 0.15s;
        }
        .interval-input:focus { border-color: #38bdf8; }
        .input-hint { font-size: 0.75rem; color: #475569; }

        .save-btn {
          padding: 0.5rem 1.1rem;
          border-radius: 8px;
          background: linear-gradient(135deg, #0ea5e9, #6366f1);
          color: #fff;
          font-size: 0.85rem;
          font-weight: 600;
          border: none;
          cursor: pointer;
          white-space: nowrap;
          transition: opacity 0.15s;
        }
        .save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .save-btn:hover:not(:disabled) { opacity: 0.85; }

        /* Status */
        .status-grid {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
          margin-bottom: 1.25rem;
        }
        .status-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0.75rem;
          background: #1e293b;
          border-radius: 8px;
          font-size: 0.83rem;
        }
        .status-label { color: #64748b; }
        .status-value { color: #e2e8f0; font-weight: 500; }
        .error-text   { color: #f87171 !important; }
        .ok-text      { color: #4ade80 !important; }

        .trigger-btn {
          width: 100%;
          padding: 0.65rem;
          border-radius: 10px;
          background: linear-gradient(135deg, #10b981, #0ea5e9);
          color: #fff;
          font-size: 0.9rem;
          font-weight: 600;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: opacity 0.15s;
          margin-bottom: 0.5rem;
        }
        .trigger-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .trigger-btn:hover:not(:disabled) { opacity: 0.85; }

        .trigger-note { font-size: 0.75rem; color: #475569; text-align: center; margin: 0; }

        .spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Table */
        .settings-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.82rem;
          margin-top: 0.25rem;
        }
        .settings-table th {
          text-align: left;
          padding: 0.55rem 0.75rem;
          background: #1e293b;
          color: #64748b;
          font-weight: 600;
          border-bottom: 1px solid #334155;
        }
        .settings-table td {
          padding: 0.55rem 0.75rem;
          color: #cbd5e1;
          border-bottom: 1px solid #1e293b;
        }
        .settings-table tr:last-child td { border-bottom: none; }
        .settings-table code {
          background: #1e293b;
          padding: 0.15rem 0.4rem;
          border-radius: 5px;
          color: #38bdf8;
          font-size: 0.78rem;
        }
      `}</style>
    </div>
  );
}
