import { useState } from "react";
import { api } from "../lib/api";
import PosterLayout from "../components/PosterLayout";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    api
      .post("/api/auth/login", { email, password })
      .then((data) => {
        onLogin?.(data);
      })
      .catch(() => setError("Invalid email or password"))
      .finally(() => setLoading(false));
  };

  return (
    <PosterLayout titleLarge="LOGIN" rightLabel="COURSE FEEDBACK">
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-6">
        <form
          onSubmit={handleSubmit}
          className="card p-8 w-full max-w-md ani-fade-up"
        >
          <h1 className="text-3xl font-bold text-[#101010] text-center mb-2">Welcome back</h1>
          <p className="text-center text-[#101010]/70 mb-6">Sign in to your account</p>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border border-[#d1d5db] bg-white text-[#101010] rounded-none mb-3 focus:outline-black"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-[#d1d5db] bg-white text-[#101010] rounded-none mb-4 focus:outline-black"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#101010] text-white py-3 rounded-[2px] hover:opacity-90 transition disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
          {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
          <div className="flex justify-end items-center mt-4 text-sm">
            <button
              type="button"
              onClick={() => (window.__setPage ? window.__setPage("forgot") : null)}
              className="text-[#101010]/70 hover:text-[#101010]"
          >
            Forgot password?
          </button>
          </div>
        </form>
      </div>
    </PosterLayout>
  );
}
