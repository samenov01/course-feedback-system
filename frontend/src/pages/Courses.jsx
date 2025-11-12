import { useEffect, useState } from "react";
import PosterLayout from "../components/PosterLayout";
import StarRating from "../components/StarRating";
import { api } from "../lib/api";

export default function Courses({ onSelectCourse }) {
  const [courses, setCourses] = useState([]);
  const [selected, setSelected] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [choice, setChoice] = useState({}); // courseId -> { teacher, group, lang }

  // no sorting needed for this layout

  useEffect(() => {
    api
      .get("/api/courses")
      .then(setCourses)
      .catch((err) => console.error("Error:", err));
  }, []);

  const loadFeedbacks = async (id) => {
    setSelected(id);
    setLoading(true);
    try {
      const list = await api.get(`/api/courses/${id}/feedback`);
      setFeedbacks(list);
    } catch {
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  };

  const setCourseChoice = (id, patch) => {
    setChoice((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), ...patch } }));
  };

  const VariantSelector = ({ c }) => {
    const ch = choice[c.id] || {};
    if (c.variants?.length) {
      return (
        <div className="flex items-center gap-2 text-sm text-white">
          {c.variants.map((v) => (
            <label
              key={`${v.lang}-${v.teacher}`}
              className={`px-2 py-1 border ${ch.lang === v.lang ? "border-white text-white" : "border-white/40 text-white/80"}`}
            >
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
        <div className="flex items-center gap-2 text-sm text-white">
          <select
            className="border border-white/40 bg-transparent text-white px-2 py-1"
            value={ch.group || ""}
            onChange={(e) => {
              const g = c.groups.find((g) => g.name === e.target.value);
              setCourseChoice(c.id, { group: g?.name || null, teacher: g?.teacher || null, lang: null });
            }}
          >
            <option value="">Выберите группу</option>
            {c.groups.map((g) => (
              <option key={g.name} value={g.name}>
                {g.name} — {g.teacher}
              </option>
            ))}
          </select>
        </div>
      );
    }
    if (c.teachers?.length) {
      const t = c.teachers[0];
      return <div className="text-sm text-white/70">Преподаватель – {t.name}.</div>;
    }
    return null;
  };

  const sortedCourses = courses;

  return (
    <PosterLayout titleLarge="COURSES" rightLabel="">
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-12 gap-8">
        {/* Left list (text on dark bg) */}
        <div className="col-span-7">
          <ul className="space-y-8">
            {sortedCourses.map((c) => (
              <li key={c.id}>
                <div className="flex items-center gap-6">
                  <button onClick={() => loadFeedbacks(c.id)} className="text-left flex-1 min-w-0">
                    <div className="text-3xl font-black text-white">{c.name}</div>
                    <div className="mt-1"><VariantSelector c={c} /></div>
                  </button>
                  <div className="hidden md:block h-10 w-px bg-white/10 flex-none" />
                  {onSelectCourse && (
                    <button
                      onClick={() => {
                        const sel = choice[c.id] || {};
                        const teacher = sel.teacher || c.teachers?.[0]?.name || null;
                        onSelectCourse({ ...c, selection: { teacher, group: sel.group || null, lang: sel.lang || null } });
                      }}
                      className="w-[180px] text-sm text-white bg-white/10 px-5 py-3 rounded-[14px] hover:bg-white/20 text-center flex-none"
                    >
                      Оставить отзыв
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Right reviews panel */}
        <div className="col-span-5">
          <div className="panel-dark p-6 min-h-[520px]">
            <h3 className="text-white text-xl font-semibold mb-4">Отзывы</h3>
            {selected ? (
              loading ? (
                <div className="text-white/60">Загрузка...</div>
              ) : feedbacks.length ? (
                <ul className="space-y-4">
                  {feedbacks.map((f) => (
                    <li key={f.id}>
                      <p className="text-white mb-2">{f.comment}</p>
                      <div className="inline-flex items-center">
                        <div style={{ pointerEvents: 'none' }}>
                          <StarRating value={Number(f.rating) || 0} onChange={() => {}} max={10} size={16} mode="whiteSelected" />
                        </div>
                      </div>
                      <MetaLines f={f} />
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-white/60">Пока нет отзывов.</div>
              )
            ) : (
              <div className="text-white/60">Выберите курс слева, чтобы увидеть отзывы.</div>
            )}
          </div>
        </div>
      </div>
    </PosterLayout>
  );
}

function IconUser() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="8" r="3.5"/>
      <path d="M4 20c0-3.5 3.6-6 8-6s8 2.5 8 6"/>
    </svg>
  );
}
function IconTeacher() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 7l9-4 9 4-9 4-9-4z"/>
      <path d="M21 10v4l-9 4-9-4v-4"/>
    </svg>
  );
}
function IconGroup() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="7" cy="8" r="3"/>
      <circle cx="17" cy="8" r="3"/>
      <path d="M2 20c0-3 3-5 5-5"/>
      <path d="M22 20c0-3-3-5-5-5"/>
    </svg>
  );
}
function IconLang() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10"/>
      <path d="M2 12h20M12 2c3 4 3 16 0 20M6 6c4 2 8 2 12 0M6 18c4-2 8-2 12 0"/>
    </svg>
  );
}

function MetaLines({ f }) {
  const lines = [
    { icon: <IconUser />, label: f.user },
    f.teacher ? { icon: <IconTeacher />, label: `Преподаватель: ${f.teacher}` } : null,
    f.group ? { icon: <IconGroup />, label: `Группа: ${f.group}` } : null,
    f.lang ? { icon: <IconLang />, label: `Язык: ${f.lang}` } : null,
  ].filter(Boolean);
  if (!lines.length) return null;
  return (
    <div className="mt-3 space-y-1 text-white/80 text-sm">
      {lines.map((line, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-white/70">{line.icon}</span>
          <span>{line.label}</span>
        </div>
      ))}
    </div>
  );
}
