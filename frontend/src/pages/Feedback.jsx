import { useState } from "react";
import { api } from "../lib/api";
import StarRating from "../components/StarRating";

export default function Feedback({ course, onBack, token }) {
  const courseName = course?.name ?? "";
  const courseId = course?.id ?? null;
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(5);
  const [status, setStatus] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Sending...");

    try {
      const data = await api.post(
        "/api/feedback",
        { courseId, comment, rating },
        token
      );
      setStatus(data.message || "Feedback received");
      setComment("");
      setRating(5);
      if (onBack) onBack();
    } catch (err) {
      console.error(err);
      setStatus("Error sending feedback");
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-6 bg-white">
      <div className="w-full max-w-xl bg-white border border-sky/20 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h1 className="text-2xl font-bold text-sky">Submit Feedback</h1>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="text-sm text-sky hover:text-sky/80"
            >
              ← Back
            </button>
          )}
        </div>
        {courseName && (
          <p className="mb-4 text-dark/80">
            For course: <span className="font-semibold">{courseName}</span>
          </p>
        )}
        {!courseName && <p className="mb-4 text-red-600">No course selected.</p>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-dark/70 mb-2">Your rating</label>
            <StarRating value={rating} onChange={setRating} max={10} />
          </div>
          <div>
            <label className="block text-sm text-dark/70 mb-2">Your feedback</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write your thoughts..."
              required
              className="w-full border border-sky/30 p-3 rounded-lg h-28 focus:border-sky outline-none"
            />
          </div>
          <button
            type="submit"
            className="bg-sky text-white px-4 py-2 rounded-lg hover:bg-sky/80 transition"
          >
            Send Feedback
          </button>
        </form>
        {status && <p className="mt-4 text-dark">{status}</p>}
      </div>
    </div>
  );
}
