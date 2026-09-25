"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Download,
  Database,
  Shield,
  FileJson,
  FileText,
  Loader2,
  Check,
  LogOut,
  Share2,
  Copy,
  Trash2,
  Plus,
  ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { APP_TIMEZONE, getTodayDateString } from "@/lib/services/metrics/dates";
import type { ParentPortalTokenRecord } from "@/lib/repositories/parentPortalTokens";

export default function SettingsPage() {
  const router = useRouter();
  const [exportLoading, setExportLoading] = useState<string | null>(null);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupResult, setBackupResult] = useState<any>(null);

  // Parent Portal Share Tokens
  const [parentTokens, setParentTokens] = useState<ParentPortalTokenRecord[]>([]);
  const [tokensLoading, setTokensLoading] = useState(true);
  const [createTokenLoading, setCreateTokenLoading] = useState(false);
  const [revokeLoadingId, setRevokeLoadingId] = useState<string | null>(null);
  const [tokenLabel, setTokenLabel] = useState("");
  const [newTokenUrl, setNewTokenUrl] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchParentTokens = async () => {
    try {
      const res = await fetch("/api/settings/parent-token");
      if (res.ok) {
        const json = await res.json();
        if (json.tokens) {
          setParentTokens(json.tokens);
        }
      }
    } catch (err) {
      console.error("Failed loading parent portal tokens:", err);
    } finally {
      setTokensLoading(false);
    }
  };

  useEffect(() => {
    fetchParentTokens();
  }, []);

  async function handleCreateParentToken(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setCreateTokenLoading(true);
    try {
      const res = await fetch("/api/settings/parent-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: tokenLabel.trim() || null }),
      });
      if (res.ok) {
        const json = await res.json();
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const shareUrl = `${origin}/parent/${json.token}`;
        setNewTokenUrl(shareUrl);
        setTokenLabel("");
        await fetchParentTokens();
      }
    } catch (err) {
      console.error("Failed generating parent portal share link:", err);
    } finally {
      setCreateTokenLoading(false);
    }
  }

  async function handleRevokeParentToken(id: string) {
    setRevokeLoadingId(id);
    try {
      const res = await fetch("/api/settings/parent-token/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setNewTokenUrl(null);
        await fetchParentTokens();
      }
    } catch (err) {
      console.error("Failed revoking parent portal share link:", err);
    } finally {
      setRevokeLoadingId(null);
    }
  }

  function handleCopyUrl(url: string, key: string) {
    navigator.clipboard.writeText(url);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  }


  async function handleExport(format: "json" | "csv") {
    setExportLoading(format);
    try {
      const res = await fetch(`/api/settings/export?format=${format}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ext = format === "json" ? "json" : "csv";
      a.download = `cyber-tracker-export-${getTodayDateString(APP_TIMEZONE)}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    }
    setExportLoading(null);
  }

  async function handleBackup() {
    setBackupLoading(true);
    setBackupResult(null);
    try {
      const res = await fetch("/api/settings/backup");
      const data = await res.json();
      if (data.success) {
        setBackupResult(data.summary);

        // Also download the backup JSON file
        const blob = new Blob([JSON.stringify(data.backup, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `cyber-tracker-backup-${getTodayDateString(APP_TIMEZONE)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Backup failed:", err);
    }
    setBackupLoading(false);
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <Settings size={24} />
        <h1>Settings</h1>
      </div>

      {/* Profile & Session */}
      <section className="settings-section">
        <div className="section-header">
          <Shield size={18} />
          <h2>Profile & Session</h2>
        </div>
        <div className="section-body">
          <p className="section-description">
            Signed in as the system administrator. Session secured.
          </p>
          <button
            className="settings-btn danger"
            onClick={async () => {
              try {
                await fetch("/api/auth/logout", { method: "POST" });
                router.push("/login");
                router.refresh();
              } catch (err) {
                console.error("Sign out failed", err);
              }
            }}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </section>

      {/* Data Export */}
      <section className="settings-section">
        <div className="section-header">
          <Download size={18} />
          <h2>Data Export</h2>
        </div>
        <div className="section-body">
          <p className="section-description">
            Download a complete snapshot of all tracked data. JSON exports are restorable backups;
            CSV exports are for spreadsheet analysis.
          </p>
          <div className="export-buttons">
            <button
              className="settings-btn primary"
              onClick={() => handleExport("json")}
              disabled={exportLoading !== null}
            >
              {exportLoading === "json" ? (
                <Loader2 size={16} className="spin" />
              ) : (
                <FileJson size={16} />
              )}
              Export JSON (Recommended)
            </button>
            <button
              className="settings-btn secondary"
              onClick={() => handleExport("csv")}
              disabled={exportLoading !== null}
            >
              {exportLoading === "csv" ? (
                <Loader2 size={16} className="spin" />
              ) : (
                <FileText size={16} />
              )}
              Export CSV
            </button>
          </div>
        </div>
      </section>

      {/* Backup */}
      <section className="settings-section">
        <div className="section-header">
          <Database size={18} />
          <h2>Database Backup</h2>
        </div>
        <div className="section-body">
          <p className="section-description">
            Create a full database snapshot. This captures all tables in a single restorable JSON
            file. Automated nightly backups will be available once deployed to Vercel with cron
            configuration.
          </p>
          <button
            className="settings-btn primary"
            onClick={handleBackup}
            disabled={backupLoading}
          >
            {backupLoading ? (
              <Loader2 size={16} className="spin" />
            ) : (
              <Database size={16} />
            )}
            {backupLoading ? "Creating Backup..." : "Create Backup Now"}
          </button>

          {backupResult && (
            <div className="backup-result">
              <div className="backup-result-header">
                <Check size={16} />
                Backup Created Successfully
              </div>
              <div className="backup-stats">
                <span>Daily Entries: {backupResult.dailyEntries}</span>
                <span>Targets: {backupResult.targets}</span>
                <span>Sessions: {backupResult.sessions}</span>
                <span>Findings: {backupResult.findings}</span>
                <span>Topics: {backupResult.topics}</span>
                <span>Learning Sessions: {backupResult.learningSessions}</span>
                <span>Activities: {backupResult.activities}</span>
                <span className="total">Total Records: {backupResult.totalRecords}</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Parent Portal */}
      <section className="settings-section">
        <div className="section-header">
          <Share2 size={18} />
          <h2>Parent Portal</h2>
        </div>
        <div className="section-body space-y-4">
          <p className="section-description">
            Share a secure, read-only link with parents. They can immediately observe monthly schedules, planned workdays, and live verified work hours without creating an account or logging in. Parents cannot edit or modify any data.
          </p>

          {/* Newly Generated Link Callout */}
          {newTokenUrl && (
            <div className="p-4 rounded-xl border border-cyan-500/50 bg-cyan-950/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <Check size={14} /> New Parent Link Ready
                </span>
                <button
                  type="button"
                  onClick={() => setNewTokenUrl(null)}
                  className="text-zinc-500 hover:text-white text-xs"
                >
                  Dismiss
                </button>
              </div>
              <p className="text-xs text-zinc-300">
                Copy and send this link to the parent. The complete share URL is only displayed once:
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={newTokenUrl}
                  className="w-full bg-black/60 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 select-all"
                />
                <button
                  type="button"
                  onClick={() => handleCopyUrl(newTokenUrl, "new")}
                  className="px-3.5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors"
                >
                  {copiedKey === "new" ? <Check size={14} /> : <Copy size={14} />}
                  {copiedKey === "new" ? "Copied!" : "Copy Link"}
                </button>
              </div>
            </div>
          )}

          {tokensLoading ? (
            <div className="loading-settings flex items-center gap-2 text-xs font-mono text-zinc-500 py-2">
              <Loader2 size={14} className="spin" /> LOADING_PORTAL_TOKENS...
            </div>
          ) : parentTokens.filter((t) => !t.revoked_at).length === 0 ? (
            <div className="rounded-xl border border-zinc-900 bg-black/40 p-6 text-center space-y-3">
              <p className="text-xs text-zinc-500">No active parent link.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 max-w-md mx-auto">
                <input
                  type="text"
                  placeholder="Optional label (e.g. Mom & Dad)"
                  value={tokenLabel}
                  onChange={(e) => setTokenLabel(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() => handleCreateParentToken()}
                  disabled={createTokenLoading}
                  className="settings-btn primary shrink-0 text-xs w-full sm:w-auto"
                >
                  {createTokenLoading ? <Loader2 size={14} className="spin" /> : <Plus size={14} />}
                  Create Parent Link
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {parentTokens
                .filter((t) => !t.revoked_at)
                .map((token) => (
                  <div
                    key={token.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-zinc-800 bg-zinc-950/60"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">
                          {token.label || "Parent Access Link"}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/40 uppercase font-bold">
                          Active
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 font-mono">
                        Created: {new Date(token.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRevokeParentToken(token.id)}
                        disabled={revokeLoadingId === token.id}
                        className="px-3 py-1.5 rounded-lg border border-red-900/40 bg-red-950/20 hover:bg-red-950/40 text-red-400 text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        {revokeLoadingId === token.id ? (
                          <Loader2 size={13} className="spin" />
                        ) : (
                          <Trash2 size={13} />
                        )}
                        Revoke Link
                      </button>
                    </div>
                  </div>
                ))}

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="text"
                  placeholder="Label for another link (e.g. Family)"
                  value={tokenLabel}
                  onChange={(e) => setTokenLabel(e.target.value)}
                  className="w-full sm:w-64 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() => handleCreateParentToken()}
                  disabled={createTokenLoading}
                  className="settings-btn secondary text-xs w-full sm:w-auto"
                >
                  {createTokenLoading ? <Loader2 size={14} className="spin" /> : <Plus size={14} />}
                  Create Another Link
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <style jsx>{`
        .settings-page {
          max-width: 720px;
          margin: 0 auto;
          padding: 2rem 1rem;
        }

        .settings-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 2rem;
          color: #e2e8f0;
        }

        .settings-header h1 {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
        }

        .settings-section {
          background: rgba(17, 17, 39, 0.6);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 14px;
          margin-bottom: 1.25rem;
          overflow: hidden;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid rgba(99, 102, 241, 0.08);
          color: #a5b4fc;
        }

        .section-header h2 {
          font-size: 0.95rem;
          font-weight: 600;
          margin: 0;
          color: #c7d2fe;
        }

        .section-body {
          padding: 1.25rem;
        }

        .section-description {
          font-size: 0.85rem;
          color: #64748b;
          margin: 0 0 1rem;
          line-height: 1.5;
        }

        .export-buttons {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .settings-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.65rem 1.25rem;
          border: none;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.15s, transform 0.1s;
        }

        .settings-btn:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .settings-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .settings-btn.primary {
          background: linear-gradient(135deg, #6366f1, #818cf8);
          color: white;
        }

        .settings-btn.secondary {
          background: rgba(99, 102, 241, 0.12);
          color: #a5b4fc;
          border: 1px solid rgba(99, 102, 241, 0.2);
        }

        .settings-btn.danger {
          background: rgba(239, 68, 68, 0.12);
          color: #fca5a5;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .backup-result {
          margin-top: 1rem;
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 10px;
          padding: 1rem;
        }

        .backup-result-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          font-weight: 600;
          color: #6ee7b7;
          margin-bottom: 0.75rem;
        }

        .backup-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem 1rem;
          font-size: 0.8rem;
          color: #94a3b8;
        }

        .backup-stats .total {
          font-weight: 600;
          color: #6ee7b7;
          width: 100%;
          margin-top: 0.25rem;
          padding-top: 0.5rem;
          border-top: 1px solid rgba(16, 185, 129, 0.15);
        }

        .settings-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        @media (min-width: 640px) {
          .form-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .form-group.toggle-group {
          padding-top: 0.25rem;
        }

        .form-group label {
          font-size: 0.8rem;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          font-family: monospace;
          letter-spacing: 0.05em;
        }

        .form-group input,
        .form-group select {
          padding: 0.6rem 0.8rem;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 8px;
          color: #f1f5f9;
          font-size: 0.85rem;
          font-family: inherit;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #6366f1;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          cursor: pointer;
          font-size: 0.85rem;
          color: #c7d2fe;
          font-weight: 600;
        }

        .checkbox-label input[type="checkbox"] {
          width: 0.95rem;
          height: 0.95rem;
          accent-color: #6366f1;
        }

        .form-actions {
          display: flex;
          gap: 0.75rem;
        }

        .test-result-box {
          white-space: pre-wrap;
          line-height: 1.4;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        :global(.spin) {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
