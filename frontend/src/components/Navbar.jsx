export default function Navbar({ currentPage, setPage }) {
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
    <nav className="flex justify-between items-center px-8 py-4 border-b border-sky/30 bg-white shadow-sm">
      {/* Левая часть */}
      <div className="flex space-x-6">
        <Link name="Courses" page="courses" />
        <Link name="Feedback" page="feedback" />
      </div>

      {/* Правая часть */}
      <div className="flex space-x-6">
        <Link name="Login" page="login" />
        <Link name="Register" page="register" />
      </div>
    </nav>
  );
}
