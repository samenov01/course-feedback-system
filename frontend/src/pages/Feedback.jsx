import { useState } from "react";

export default function Feedback() {
  const [course, setCourse] = useState("");
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(5);
  const [status, setStatus] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Sending...");

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course, comment, rating }),
      });

      const data = await res.json();
      setStatus(data.message);
      setCourse("");
      setComment("");
      setRating(5);
    } catch (err) {
      console.error(err);
      setStatus("Error sending feedback");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-sky">Submit Feedback</h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <input
          type="text"
          value={course}
          onChange={(e) => setCourse(e.target.value)}
          placeholder="Course name"
          required
          className="w-full border border-sky/40 p-2 rounded focus:border-sky outline-none"
        />
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Your feedback..."
          required
          className="w-full border border-sky/40 p-2 rounded h-24 focus:border-sky outline-none"
        />
        <input
          type="number"
          min="1"
          max="10"
          value={rating}
          onChange={(e) => setRating(e.target.value)}
          className="w-full border border-sky/40 p-2 rounded focus:border-sky outline-none"
        />
        <button
          type="submit"
          className="bg-sky text-white px-4 py-2 rounded hover:bg-sky/80 transition"
        >
          Send
        </button>
      </form>
      {status && <p className="mt-4 text-dark">{status}</p>}
    </div>
  );
}
