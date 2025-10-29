import { useState } from "react";
import { api } from "../lib/api";
import StarRating from "../components/StarRating";
import PosterLayout from "../components/PosterLayout";

export default function Feedback({ course, onBack, token }) {
  const courseName = course?.name ?? "";
  const courseId = course?.id ?? null;
  const selection = course?.selection || {};
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(5);
  const [anonymous, setAnonymous] = useState(false);
  const [status, setStatus] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Sending...");

    try {
      const payload = { courseId, comment, rating, anonymous, ...selection };
      const data = await api.post("/api/feedback", payload, token);
      setStatus(data.message || "Feedback received");
      setComment("");
      setRating(5);
      setAnonymous(false);
      if (onBack) onBack();
    } catch (err) {
      console.error(err);
      setStatus("Error sending feedback");
    }
  };

  return (
    <PosterLayout titleLarge="FEED BACK" rightLabel="COURSE">
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-6">
        <div className="w-full max-w-2xl card p-8 rounded-[12px] ani-fade-up">
          {!token ? (
            <div className="text-center">
              <h2 className="text-xl font-semibold text-white mb-2">Оставлять отзывы могут только зарегистрированные пользователи</h2>
              <p className="text-white/70 mb-4">Пожалуйста, войдите или зарегистрируйтесь</p>
              <div className="flex justify-center gap-3">
                <button className="bg-white/10 text-white px-4 py-2 rounded hover:bg-white/20" onClick={() => window.__setPage?.("login")}>Login</button>
                <button className="border border-white/20 text-white/80 hover:text-white hover:border-white/40 px-4 py-2 rounded" onClick={() => window.__setPage?.("register")}>Register</button>
              </div>
            </div>
          ) : (
          <>
          <div className="flex items-center justify-between gap-4 mb-4">
            <h1 className="text-2xl font-bold text-[#101010]">Submit Feedback</h1>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="text-sm text-[#101010]/70 hover:text-[#101010]"
              >
                ← Back
              </button>
            )}
          </div>
        {courseName && (
          <div className="mb-4 text-dark/80">
            <p>
              Курс: <span className="font-semibold">{courseName}</span>
            </p>
            {(selection.teacher || selection.group || selection.lang) && (
              <p className="text-sm text-dark/70 mt-1">
                {selection.teacher ? `Преподаватель: ${selection.teacher}` : ""}
                {selection.group ? `, Группа: ${selection.group}` : ""}
                {selection.lang ? `, Язык: ${selection.lang}` : ""}
              </p>
            )}
          </div>
        )}
        {!courseName && <p className="mb-4 text-white/60">No course selected.</p>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-[#101010]/70 mb-2">Your rating</label>
            <StarRating value={rating} onChange={setRating} max={10} />
          </div>
          <div>
            <label className="block text-sm text-[#101010]/70 mb-2">Your feedback</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write your thoughts..."
              required
              className="w-full border border-[#d1d5db] bg-white text-[#101010] p-4 rounded-[12px] h-32 focus:outline-black"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-[#101010]/70">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
            />
            <span className="">Отправить анонимно</span>
          </label>
          <button
            type="submit"
            className="bg-[#101010] text-white px-5 py-2.5 rounded-[12px] text-sm hover:opacity-90 transition"
          >
            Send Feedback
          </button>
        </form>
          {status && <p className="mt-4 text-[#101010]">{status}</p>}
          </>
          )}
        </div>
      </div>
    </PosterLayout>
  );
}
