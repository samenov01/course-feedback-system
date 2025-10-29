import { useState } from "react";
import { api } from "../lib/api";
import PosterLayout from "../components/PosterLayout";

export default function Register({ onRegister }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    setLoading(true);
    api
      .post("/api/auth/register", { name: name.trim(), email, password })
      .then((data) => {
        onRegister?.(data);
      })
      .catch(() => {
        setError("Registration failed. User may already exist.");
      })
      .finally(() => setLoading(false));
  };

  return (
    <PosterLayout titleLarge="REGISTER" rightLabel="COURSE FEEDBACK">
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-6">
        <form
          onSubmit={handleSubmit}
          className="card p-8 w-full max-w-md ani-fade-up"
        >
          <h1 className="text-3xl font-bold text-[#101010] text-center mb-2">Create account</h1>
          <p className="text-center text-[#101010]/70 mb-6">Join with your email</p>
        <input
          type="text"
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 border border-[#d1d5db] bg-white text-[#101010] rounded-none mb-3 focus:outline-black"
          required
        />
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
          {loading ? "Creating account..." : "Sign Up"}
        </button>
        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
        </form>
      </div>
    </PosterLayout>
  );
}
