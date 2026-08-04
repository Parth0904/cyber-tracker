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
  Mail,
} from "lucide-react";
import { signOut } from "next-auth/react";

export default function SettingsPage() {
  const [exportLoading, setExportLoading] = useState<string | null>(null);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupResult, setBackupResult] = useState<any>(null);

  const [parentConfig, setParentConfig] = useState<any>({
    enabled: 0,
    parent_name: "",
    delivery_method: "Email",
    delivery_time: "20:00",
    time_zone: "UTC",
    email_address: "",
    telegram_chat_id: "",
  });
  const [parentConfigLoading, setParentConfigLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    async function fetchParentConfig() {
      try {
        const res = await fetch("/api/settings/parent-report");
        if (res.ok) {
          const data = await res.json();
          if (data.config) {
            setParentConfig(data.config);
          }
        }
      } catch (err) {
        console.error("Failed to load parent report settings:", err);
      } finally {
        setParentConfigLoading(false);
      }
    }
    fetchParentConfig();
  }, []);

  async function handleSaveParentConfig(e: React.FormEvent) {
    e.preventDefault();
    setSaveLoading(true);
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/settings/parent-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parentConfig),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save parent report settings:", err);
    } finally {
      setSaveLoading(false);
    }
  }

  async function handleTestParentReport() {
    setTestLoading(true);
    setTestResult(null);
    try {
      await fetch("/api/settings/parent-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parentConfig),
      });

      const res = await fetch("/api/settings/parent-report/test", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setTestResult("Test report sent successfully. Check system logs / console.");
      } else {
        setTestResult(`Error: ${data.error || "Failed to dispatch test report."}`);
      }
    } catch (err: any) {
      setTestResult(`Error: ${err.message || "Failed to initiate test report dispatch."}`);
    } finally {
      setTestLoading(false);
    }
  }

  async function handleSendTestEmail() {
    setTestEmailLoading(true);
    setTestResult(null);
    try {
      await fetch("/api/settings/parent-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parentConfig),
      });

      const res = await fetch("/api/settings/parent-report/test-email", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setTestResult("Test email sent successfully. Check your configured inbox.");
      } else {
        setTestResult(`Error: ${data.error || "Failed to send test email."}`);
      }
    } catch (err: any) {
      setTestResult(`Error: ${err.message || "Failed to initiate test email dispatch."}`);
    } finally {
      setTestEmailLoading(false);
    }
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
      a.download = `cyber-tracker-export-${new Date().toISOString().split("T")[0]}.${ext}`;
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
        a.download = `cyber-tracker-backup-${new Date().toISOString().split("T")[0]}.json`;
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
            Signed in as the system administrator. Session secured via Auth.js.
          </p>
          <button
            className="settings-btn danger"
            onClick={() => signOut({ callbackUrl: "/login" })}
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

      {/* Parent Reports */}
      <section className="settings-section">
        <div className="section-header">
          <FileText size={18} />
          <h2>Parent Weekly Report Automation</h2>
        </div>
        <div className="section-body">
          <p className="section-description">
            Automatically compile and deliver progress reports (Week number, Consistency signal, Hunting hours, Study hours, and Findings count) to a configured parent every Sunday.
          </p>
          {parentConfigLoading ? (
            <div className="loading-settings flex items-center gap-2 text-xs font-mono text-zinc-500 py-2">
              <Loader2 size={14} className="spin" /> LOADING_SETTINGS_MATRIX...
            </div>
          ) : (
            <form onSubmit={handleSaveParentConfig} className="settings-form">
              <div className="form-group toggle-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={parentConfig.enabled === 1}
                    onChange={(e) => setParentConfig({ ...parentConfig, enabled: e.target.checked ? 1 : 0 })}
                  />
                  <span>Enable Parent Report Automation</span>
                </label>
              </div>

              {parentConfig.enabled === 1 && (
                <div className="expanded-settings-fields space-y-4 mt-4">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Parent Name</label>
                      <input
                        type="text"
                        placeholder="e.g. John Doe"
                        value={parentConfig.parent_name}
                        onChange={(e) => setParentConfig({ ...parentConfig, parent_name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Delivery Method</label>
                      <select
                        value={parentConfig.delivery_method}
                        onChange={(e) => setParentConfig({ ...parentConfig, delivery_method: e.target.value })}
                      >
                        <option value="Email">Email Dispatcher</option>
                        <option value="Telegram">Telegram Bot API</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>Delivery Time (24h Format)</label>
                      <input
                        type="text"
                        placeholder="e.g. 20:00"
                        value={parentConfig.delivery_time}
                        onChange={(e) => setParentConfig({ ...parentConfig, delivery_time: e.target.value })}
                        pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Time Zone</label>
                      <input
                        type="text"
                        placeholder="e.g. UTC, Asia/Kolkata"
                        value={parentConfig.time_zone}
                        onChange={(e) => setParentConfig({ ...parentConfig, time_zone: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {parentConfig.delivery_method === "Email" ? (
                    <div className="form-group">
                      <label>Parent's Email Address</label>
                      <input
                        type="email"
                        placeholder="e.g. parent@example.com"
                        value={parentConfig.email_address}
                        onChange={(e) => setParentConfig({ ...parentConfig, email_address: e.target.value })}
                        required
                      />
                    </div>
                  ) : (
                    <div className="form-group">
                      <label>Telegram Chat ID</label>
                      <input
                        type="text"
                        placeholder="e.g. 123456789"
                        value={parentConfig.telegram_chat_id}
                        onChange={(e) => setParentConfig({ ...parentConfig, telegram_chat_id: e.target.value })}
                        required
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="form-actions mt-6 flex gap-3">
                <button
                  type="submit"
                  className="settings-btn primary"
                  disabled={saveLoading}
                >
                  {saveLoading ? <Loader2 size={16} className="spin" /> : <Check size={16} />}
                  {saveLoading ? "Saving..." : saveSuccess ? "Saved Successfully!" : "Save Settings"}
                </button>

                {parentConfig.enabled === 1 && (
                  <>
                    <button
                      type="button"
                      onClick={handleTestParentReport}
                      className="settings-btn secondary"
                      disabled={testLoading || testEmailLoading}
                    >
                      {testLoading ? <Loader2 size={16} className="spin" /> : <FileText size={16} />}
                      {testLoading ? "Dispatching..." : "Send Test Report"}
                    </button>

                    <button
                      type="button"
                      onClick={handleSendTestEmail}
                      className="settings-btn secondary"
                      disabled={testLoading || testEmailLoading}
                    >
                      {testEmailLoading ? <Loader2 size={16} className="spin" /> : <Mail size={16} />}
                      {testEmailLoading ? "Sending Email..." : "Send Test Email"}
                    </button>
                  </>
                )}
              </div>

              {testResult && (
                <div className={`test-result-box mt-3 text-xs p-3 rounded font-mono border
                  ${testResult.startsWith("Error") 
                    ? "bg-danger-rose/10 border-danger-rose/30 text-danger-rose" 
                    : "bg-success-emerald/10 border-success-emerald/30 text-success-emerald"}`}>
                  {testResult}
                </div>
              )}
            </form>
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
