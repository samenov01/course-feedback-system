export default function Navbar({
  currentPage,
  setPage,
  authed,
  userName,
  onLogout,
  isAdmin,
  onGoProfile,
}) {
  const go = (p) => setPage && setPage(p);
  return (
    <header className="sticky top-0 z-40 bg-[#101010]">
      <nav className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6 text-white text-sm font-semibold">
          <button onClick={() => go("home")} className={`hover:opacity-70 ${currentPage==='home'?'opacity-100':'opacity-80'}`}>HOME</button>
          <button onClick={() => go("courses")} className={`hover:opacity-70 ${currentPage==='courses'?'opacity-100':'opacity-80'}`}>COURSES</button>
          <button onClick={() => go("feedback")} className={`hover:opacity-70 ${currentPage==='feedback'?'opacity-100':'opacity-80'}`}>REVIEWS</button>
          {isAdmin && <button onClick={() => go("admin")} className={`hover:opacity-70 ${currentPage==='admin'?'opacity-100':'opacity-80'}`}>ADMIN</button>}
        </div>
        <div className="tracking-[0.25em] text-white text-sm font-black select-none">npm/</div>
        <div className="flex items-center gap-4">
          {!authed ? (
            <>
              <button onClick={() => go("login")} className="text-white text-sm">Login</button>
              <button onClick={() => go("register")} className="text-white/70 text-sm">Register</button>
            </>
          ) : (
            <>
              <button onClick={() => (onGoProfile ? onGoProfile() : go('profile'))} className="text-white text-sm">{userName || 'Profile'}</button>
              <button onClick={onLogout} className="text-white text-xs border border-white px-3 py-1 rounded-[2px]">Logout</button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
