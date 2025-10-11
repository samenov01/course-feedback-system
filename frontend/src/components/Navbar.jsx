export default function Navbar({ currentPage, setPage, authed, userEmail, onLogout }) {
  const Link = ({ name, page }) => (
    <button
      onClick={() => setPage(page)}
      className={`relative font-medium pb-2 ${
        currentPage === page ? "text-sky" : "text-dark"
      } hover:text-sky transition`}
    >
      {name}
      {currentPage === page && (
        <span className="absolute left-0 bottom-0 w-full h-[2px] bg-sky rounded-full"></span>
      )}
    </button>
  );

  return (
    <nav className="flex justify-between items-center px-8 py-4 border-b border-sky/20 bg-white/80 backdrop-blur shadow-sm rounded-b-xl">
      <div className="flex space-x-6">
        <Link name="Courses" page="courses" />
        <Link name="Feedback" page="feedback" />
        <Link name="Admin" page="admin" />
      </div>

      <div className="flex items-center space-x-6">
        {!authed ? (
          <>
            <Link name="Login" page="login" />
            <Link name="Register" page="register" />
          </>
        ) : (
          <>
            <span className="text-sm text-dark/70">{userEmail}</span>
            <button
              onClick={onLogout}
              className="text-sm text-white bg-sky px-3 py-1 rounded hover:bg-sky/80"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
