import { useState } from "react";
import { api } from "../lib/api";
import PosterLayout from "../components/PosterLayout";

export default function ForgotPassword({ onDone }) {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const requestToken = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      const res = await api.post("/api/auth/forgot-password", { email });
      setMessage(res.message || "If the email exists, a token was generated");
      if (res.token) setToken(res.token);
    } catch {
      setMessage("Error requesting token");
    } finally {
      setLoading(false);
    }
  };

  const doReset = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      const res = await api.post("/api/auth/reset-password", { token, newPassword });
      setMessage(res.message || "Password updated");
      if (onDone) onDone();
    } catch {
      setMessage("Error resetting password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PosterLayout titleLarge="RESET" rightLabel="PASSWORD">
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-6">
        <div className="card p-8 w-full max-w-lg ani-fade-up">
          <h1 className="text-3xl font-bold text-[#101010] text-center mb-6">Forgot password</h1>

        <form onSubmit={requestToken} className="space-y-3 mb-6">
          <label className="block text-sm text-dark/70">Your email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@gmail.com"
            className="w-full p-3 border border-[#d1d5db] bg-white text-[#101010] rounded-none focus:outline-black"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#101010] text-white py-3 rounded-[2px] hover:opacity-90 transition disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send reset token"}
          </button>
        </form>

        <form onSubmit={doReset} className="space-y-3">
          <label className="block text-sm text-dark/70">Token</label>
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste token"
            className="w-full p-3 border border-[#d1d5db] bg-white text-[#101010] rounded-none focus:outline-black"
            required
          />
          <label className="block text-sm text-dark/70">New password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
            className="w-full p-3 border border-[#d1d5db] bg-white text-[#101010] rounded-none focus:outline-black"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#101010] text-white py-3 rounded-[2px] hover:opacity-90 transition disabled:opacity-60"
          >
            {loading ? "Updating..." : "Update password"}
          </button>
        </form>

          {message && <p className="mt-4 text-center text-dark">{message}</p>}
          <div className="text-center mt-4">
            <button
              className="text-[#101010]/70 hover:text-[#101010] text-sm"
              onClick={() => (window.__setPage ? window.__setPage("login") : null)}
            >
              Back to login
            </button>
          </div>
        </div>
      </div>
    </PosterLayout>
  );
}
