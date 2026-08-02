"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid credentials. Please try again.");
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">
            <Shield size={32} />
          </div>
          <h1>Cyber Tracker</h1>
          <p className="login-subtitle">Authenticate to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
              autoFocus
              autoComplete="username"
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              autoComplete="current-password"
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="spin" />
                Authenticating...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>

      <style jsx>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0a0a0f 0%, #111127 50%, #0a0a0f 100%);
          padding: 1rem;
        }

        .login-card {
          width: 100%;
          max-width: 400px;
          background: rgba(17, 17, 39, 0.85);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 16px;
          padding: 2.5rem;
          backdrop-filter: blur(12px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 80px rgba(99, 102, 241, 0.05);
        }

        .login-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .login-icon {
          width: 56px;
          height: 56px;
          margin: 0 auto 1rem;
          background: linear-gradient(135deg, #6366f1, #818cf8);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .login-header h1 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #e2e8f0;
          margin: 0 0 0.25rem;
        }

        .login-subtitle {
          font-size: 0.875rem;
          color: #64748b;
          margin: 0;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .login-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .login-field label {
          font-size: 0.8rem;
          font-weight: 500;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .login-field input {
          padding: 0.75rem 1rem;
          background: rgba(15, 15, 30, 0.8);
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: 10px;
          color: #e2e8f0;
          font-size: 0.95rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .login-field input::placeholder {
          color: #475569;
        }

        .login-field input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
        }

        .login-error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          font-size: 0.85rem;
          text-align: center;
        }

        .login-button {
          padding: 0.85rem 1.5rem;
          background: linear-gradient(135deg, #6366f1, #818cf8);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.1s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 0.25rem;
        }

        .login-button:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .login-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .login-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
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
