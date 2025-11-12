import { useEffect, useMemo, useState } from "react";
import PosterLayout from "../components/PosterLayout";
import StarRating from "../components/StarRating";
import { api } from "../lib/api";

export default function Admin({ token, isAdmin, goLogin }) {
  
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState("");
  const [feedbacks, setFeedbacks] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get(`/api/courses`).then(setCourses).catch(()=>{});
  }, []);

  const loadFeedbacks = async (id) => {
    setCourseId(id);
    setLoading(true);
    try {
      const list = await api.get(`/api/admin/feedbacks?courseId=${id}`, token);
      setFeedbacks(list);
    } catch {
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return feedbacks;
    return feedbacks.filter((f) =>
      (f.comment || "").toLowerCase().includes(q) ||
      (f.user || "").toLowerCase().includes(q) ||
      (f.teacher || "").toLowerCase().includes(q)
    );
  }, [search, feedbacks]);

  if (!token || !isAdmin) {
    return (
      <PosterLayout titleLarge="ADMIN" rightLabel="ACCESS">
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-6">
          <div className="card ani-fade-up w-full max-w-md p-8 text-center">
            <h1 className="text-2xl font-bold text-white mb-2">Admin panel</h1>
            <p className="text-white/70 mb-4">Войдите как администратор через страницу Login</p>
            <button className="bg-white/10 text-white px-4 py-2 rounded hover:bg-white/20" onClick={() => goLogin?.()}>Перейти к Login</button>
          </div>
        </div>
      </PosterLayout>
    );
  }

  return (
    <PosterLayout titleLarge="ADMIN" rightLabel="FEEDBACKS">
      <div className="p-6">
        <div className="flex items-center gap-3 ani-fade-up">
          <select className="border border-[#101010] px-3 py-2 bg-white text-[#101010]" value={courseId} onChange={(e)=>loadFeedbacks(e.target.value)}>
            <option value="">Select course</option>
            {courses.map((c)=> <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input className="border border-[#101010] px-3 py-2 bg-white text-[#101010] placeholder-black/40" placeholder="Search feedback..." value={search} onChange={(e)=>setSearch(e.target.value)} />
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-6">
          {loading ? (
            Array.from({length:4}).map((_,i)=> (
              <div key={i} className="card p-4 shimmer h-24" />
            ))
          ) : filtered.length ? (
            filtered.map((f, idx) => <EditableCard key={f.id} f={f} idx={idx} courseId={courseId} token={token} onChanged={()=>loadFeedbacks(courseId)} />)
          ) : (
            <p className="text-dark/60">No feedbacks</p>
          )}
        </div>
      </div>
    </PosterLayout>
  );
}

function EditableCard({ f, idx, courseId, token, onChanged }) {
  const [editing, setEditing] = useState(false);
  const [comment, setComment] = useState(f.comment || "");
  const [rating, setRating] = useState(Number(f.rating) || 0);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api.patch(`/api/admin/courses/${courseId}/feedback/${f.id}`, { comment, rating }, token);
      setEditing(false);
      onChanged?.();
    } finally { setSaving(false); }
  };

  const remove = async () => {
    if (!confirm("Delete this feedback?")) return;
    await api.del(`/api/admin/courses/${courseId}/feedback/${f.id}`, token);
    onChanged?.();
  };

  return (
    <div style={{"--d": `${idx * 0.04}s`}} className="card ani-fade-up p-4">
      {!editing ? (
        <>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-dark mb-1">{f.comment}</p>
              <p className="text-sm text-white/70">Rating: {f.rating}/10 {f.user ? `(by ${f.user})` : ''}</p>
            </div>
            <div className="flex gap-2">
              <button className="text-sm text-white/80" onClick={()=>setEditing(true)}>Edit</button>
              <button className="text-sm text-red-600" onClick={remove}>Delete</button>
            </div>
          </div>
          {(f.teacher || f.group || f.lang) && (
            <p className="text-xs text-dark/60 mt-1">
              {f.teacher ? `Teacher: ${f.teacher}` : ''}
              {f.group ? `, Group: ${f.group}` : ''}
              {f.lang ? `, Lang: ${f.lang}` : ''}
            </p>
          )}
        </>
      ) : (
        <div className="space-y-3">
          <label className="block text-sm text-dark/70">Comment</label>
          <textarea className="w-full border border-white/20 bg-[#0f1014] text-white rounded p-2 h-24" value={comment} onChange={(e)=>setComment(e.target.value)} />
          <label className="block text-sm text-dark/70">Rating</label>
          <StarRating value={rating} onChange={setRating} max={10} />
          <div className="flex gap-2 pt-2">
            <button disabled={saving} className="text-sm text-white bg-[#101010] px-3 py-2 rounded-[2px] hover:opacity-90" onClick={save}>{saving? 'Saving...' : 'Save'}</button>
            <button className="text-sm text-dark/70" onClick={()=>{ setEditing(false); setComment(f.comment); setRating(f.rating); }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

