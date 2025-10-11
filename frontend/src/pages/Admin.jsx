import { useEffect, useMemo, useState } from "react";
import PosterLayout from "../components/PosterLayout";
import StarRating from "../components/StarRating";

const BASE = import.meta.env.VITE_API_URL;

async function adminGet(path, token) {
  const res = await fetch(`${BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function adminPost(path, body) {
  const res = await fetch(`${BASE}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function adminPatch(path, body, token) {
  const res = await fetch(`${BASE}${path}`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function adminDelete(path, token) {
  const res = await fetch(`${BASE}${path}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default function Admin() {
  const [token, setToken] = useState(localStorage.getItem("adminToken") || "");
  const [authErr, setAuthErr] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState("");
  const [feedbacks, setFeedbacks] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${BASE}/api/courses`).then(r=>r.json()).then(setCourses).catch(()=>{});
  }, []);

  const login = async (e) => {
    e.preventDefault();
    setAuthErr("");
    try {
      const data = await adminPost(`/api/admin/login`, { username, password });
      setToken(data.token);
      localStorage.setItem("adminToken", data.token);
    } catch (err) {
      setAuthErr("Invalid admin credentials");
    }
  };

  const loadFeedbacks = async (id) => {
    setCourseId(id);
    setLoading(true);
    try {
      const list = await adminGet(`/api/admin/feedbacks?courseId=${id}`, token);
      setFeedbacks(list);
    } catch (err) {
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

  if (!token) {
    return (
      <PosterLayout titleLarge="ADMIN" rightLabel="PANEL">
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-6">
          <form onSubmit={login} className="card ani-fade-up w-full max-w-md p-8">
            <h1 className="text-2xl font-bold text-sky text-center mb-2">Admin Login</h1>
            <p className="text-center text-dark/60 mb-6">Edit or delete feedbacks</p>
            <input className="w-full p-3 border border-sky/30 rounded-lg mb-3 focus:outline-sky" placeholder="Username" value={username} onChange={(e)=>setUsername(e.target.value)} />
            <input type="password" className="w-full p-3 border border-sky/30 rounded-lg mb-4 focus:outline-sky" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} />
            <button className="w-full bg-sky text-white py-3 rounded-lg hover:bg-sky/80 transition">Sign in</button>
            {authErr && <p className="text-red-600 text-sm mt-3">{authErr}</p>}
          </form>
        </div>
      </PosterLayout>
    );
  }

  return (
    <PosterLayout titleLarge="ADMIN" rightLabel="FEEDBACKS">
      <div className="p-6">
        <div className="flex items-center gap-3 ani-fade-up">
          <select className="border border-sky/30 rounded px-3 py-2 bg-white" value={courseId} onChange={(e)=>loadFeedbacks(e.target.value)}>
            <option value="">Select course</option>
            {courses.map((c)=> <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input className="border border-sky/30 rounded px-3 py-2 bg-white" placeholder="Search feedback..." value={search} onChange={(e)=>setSearch(e.target.value)} />
          <button className="ml-auto text-sm text-white bg-sky px-3 py-2 rounded hover:bg-sky/80" onClick={()=>{ localStorage.removeItem("adminToken"); setToken(""); }}>Logout</button>
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
      await adminPatch(`/api/admin/courses/${courseId}/feedback/${f.id}`, { comment, rating }, token);
      setEditing(false);
      onChanged?.();
    } finally { setSaving(false); }
  };

  const remove = async () => {
    if (!confirm("Delete this feedback?")) return;
    await adminDelete(`/api/admin/courses/${courseId}/feedback/${f.id}`, token);
    onChanged?.();
  };

  return (
    <div style={{"--d": `${idx * 0.04}s`}} className="card ani-fade-up p-4">
      {!editing ? (
        <>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-dark mb-1">{f.comment}</p>
              <p className="text-sm text-sky">Rating: {f.rating}/10 {f.user ? `(by ${f.user})` : ''}</p>
            </div>
            <div className="flex gap-2">
              <button className="text-sm text-sky" onClick={()=>setEditing(true)}>Edit</button>
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
          <textarea className="w-full border border-sky/30 rounded p-2 h-24" value={comment} onChange={(e)=>setComment(e.target.value)} />
          <label className="block text-sm text-dark/70">Rating</label>
          <StarRating value={rating} onChange={setRating} max={10} />
          <div className="flex gap-2 pt-2">
            <button disabled={saving} className="text-sm text-white bg-sky px-3 py-2 rounded hover:bg-sky/80" onClick={save}>{saving? 'Saving...' : 'Save'}</button>
            <button className="text-sm text-dark/70" onClick={()=>{ setEditing(false); setComment(f.comment); setRating(f.rating); }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

