import { useState } from "react";
import { api } from "../lib/api";
import PosterLayout from "../components/PosterLayout";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const allowedDomains = ["gmail.com", "mail.ru"];

  const isValidEmailDomain = (em) => {
    const at = String(em).split("@");
    if (at.length !== 2) return false;
    const domain = at[1].toLowerCase();
    return allowedDomains.includes(domain);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!isValidEmailDomain(email)) {
      setError(`Please use one of: ${allowedDomains.join(", ")}`);
      return;
    }
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
          className="bg-white border border-sky/20 shadow-sm p-8 rounded-2xl w-full max-w-md ani-fade-up"
        >
          <h1 className="text-3xl font-bold text-sky text-center mb-2">Welcome back</h1>
          <p className="text-center text-dark/60 mb-6">Sign in to your account</p>
          <input
            type="email"
            placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 border border-sky/30 rounded-lg mb-3 focus:outline-sky"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 border border-sky/30 rounded-lg mb-4 focus:outline-sky"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-sky text-white py-3 rounded-lg hover:bg-sky/80 transition disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign In"}
          </button>
          {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
          <div className="flex justify-between items-center mt-4 text-sm">
            <span className="text-dark/60">Use gmail.com or mail.ru</span>
            <button
              type="button"
              onClick={() => (window.__setPage ? window.__setPage("forgot") : null)}
              className="text-sky hover:text-sky/80"
            >
              Forgot password?
            </button>
          </div>
        </form>
      </div>
    </PosterLayout>
  );
}
