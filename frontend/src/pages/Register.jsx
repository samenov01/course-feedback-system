import { useState } from "react";

export default function Register({ onRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onRegister();
  };

  return (
    <div className="flex items-center justify-center h-screen bg-white">
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-sky/30 shadow-md p-8 rounded-xl w-80"
      >
        <h1 className="text-2xl font-bold text-sky text-center mb-6">Register</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border border-sky/30 rounded-md mb-3 focus:outline-sky"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border border-sky/30 rounded-md mb-4 focus:outline-sky"
          required
        />
        <button
          type="submit"
          className="w-full bg-sky text-white py-2 rounded-md hover:bg-sky/80 transition"
        >
          Sign Up
        </button>
      </form>
    </div>
  );
}
