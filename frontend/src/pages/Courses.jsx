import { useEffect, useState } from "react";
import PosterLayout from "../components/PosterLayout";

export default function Courses({ onSelectCourse }) {
  const [courses, setCourses] = useState([]);
  const [selected, setSelected] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [choice, setChoice] = useState({}); // courseId -> { teacher, group, lang }

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

  const setCourseChoice = (id, patch) => {
    setChoice((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), ...patch } }));
  };

  const VariantSelector = ({ c }) => {
    const ch = choice[c.id] || {};
    if (c.variants?.length) {
      return (
        <div className="flex items-center gap-2 text-sm">
          {c.variants.map((v) => (
            <label key={`${v.lang}-${v.teacher}`} className={`px-2 py-1 rounded border ${ch.lang === v.lang ? "border-sky text-sky" : "border-sky/30"}`}>
              <input
                type="radio"
                name={`variant-${c.id}`}
                className="mr-1"
                checked={ch.lang === v.lang}
                onChange={() => setCourseChoice(c.id, { lang: v.lang, teacher: v.teacher, group: null })}
              />
              {v.lang}
            </label>
          ))}
        </div>
      );
    }
    if (c.groups?.length) {
      return (
        <div className="flex items-center gap-2 text-sm">
          <select
            className="border border-sky/30 rounded px-2 py-1"
            value={ch.group || ""}
            onChange={(e) => {
              const g = c.groups.find((g) => g.name === e.target.value);
              setCourseChoice(c.id, { group: g?.name || null, teacher: g?.teacher || null, lang: null });
            }}
          >
            <option value="">Выберите группу</option>
            {c.groups.map((g) => (
              <option key={g.name} value={g.name}>{g.name} — {g.teacher}</option>
            ))}
          </select>
        </div>
      );
    }
    if (c.teachers?.length) {
      const t = c.teachers[0];
      return <div className="text-sm text-dark/70">Преподаватель: {t.name}</div>;
    }
    return null;
  };

  return (
    <PosterLayout titleLarge="COURSES" rightLabel="FEEDBACK">
      <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-sky">Courses</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <ul className="space-y-3">
            {courses.map((c) => (
              <li key={c.id} className="border border-sky/20 rounded-lg p-4 bg-white">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <button
                      onClick={() => loadFeedbacks(c.id)}
                      className={`text-left text-lg hover:text-sky transition ${selected === c.id ? "text-sky font-semibold" : ""}`}
                    >
                      {c.name}
                    </button>
                    <div className="mt-2"><VariantSelector c={c} /></div>
                  </div>
                  {onSelectCourse && (
                    <button
                      onClick={() => {
                        const sel = choice[c.id] || {};
                        const teacher = sel.teacher || c.teachers?.[0]?.name || null;
                        onSelectCourse({ ...c, selection: { teacher, group: sel.group || null, lang: sel.lang || null } });
                      }}
                      className="text-sm text-white bg-sky px-3 py-2 rounded hover:bg-sky/80"
                    >
                      Оставить отзыв
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-l border-sky/20 pl-6">
          {selected ? (
            <>
              <h2 className="text-xl font-semibold mb-2">Отзывы</h2>
              {feedbacks.length ? (
                <ul className="space-y-2">
                  {feedbacks.map(f => (
                    <li key={f.id} className="border-b border-sky/10 pb-2">
                      <p className="text-dark">{f.comment}</p>
                      <p className="text-sm text-sky">Оценка: {f.rating}/10 {f.user ? `(от ${f.user})` : ""}</p>
                      {(f.teacher || f.group || f.lang) && (
                        <p className="text-xs text-dark/60">
                          {f.teacher ? `Преподаватель: ${f.teacher}` : ""}
                          {f.group ? `, Группа: ${f.group}` : ""}
                          {f.lang ? `, Язык: ${f.lang}` : ""}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">Пока нет отзывов.</p>
              )}
            </>
          ) : (
            <p className="text-gray-500">Select a course to see feedback.</p>
          )}
        </div>
      </div>
      </div>
    </PosterLayout>
  );
}
