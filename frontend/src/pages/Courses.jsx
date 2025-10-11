import { useEffect, useState } from "react";

export default function Courses({ onSelectCourse }) {
  const [courses, setCourses] = useState([]);
  const [selected, setSelected] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/courses`)
      .then(res => res.json())
      .then(data => setCourses(data))
      .catch(err => console.error("Error:", err));
  }, []);

  const loadFeedbacks = async (id) => {
    setSelected(id);
    setFeedbacks([]);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/courses/${id}/feedback`);
      const data = await res.json();
      setFeedbacks(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-sky">Courses</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <ul className="space-y-3">
            {courses.map((c) => (
              <li key={c.id} className="flex items-center justify-between border-b border-sky/20 pb-3">
                <button
                  onClick={() => loadFeedbacks(c.id)}
                  className={`text-left hover:text-sky transition ${selected === c.id ? "text-sky font-semibold" : ""}`}
                >
                  {c.name}
                </button>
                {onSelectCourse && (
                  <button
                    onClick={() => onSelectCourse(c)}
                    className="text-sm text-white bg-sky px-3 py-1 rounded hover:bg-sky/80"
                  >
                    Give Feedback
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="border-l border-sky/20 pl-6">
          {selected ? (
            <>
              <h2 className="text-xl font-semibold mb-2">Feedbacks</h2>
              {feedbacks.length ? (
                <ul className="space-y-2">
                  {feedbacks.map(f => (
                    <li key={f.id} className="border-b border-sky/10 pb-2">
                      <p className="text-dark">{f.comment}</p>
                      <p className="text-sm text-sky">Rating: {f.rating}/10 {f.user ? `(by ${f.user})` : ""}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No feedback yet.</p>
              )}
            </>
          ) : (
            <p className="text-gray-500">Select a course to see feedback.</p>
          )}
        </div>
      </div>
    </div>
  );
}
