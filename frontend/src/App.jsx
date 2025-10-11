import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import Courses from "./pages/Courses";
import Feedback from "./pages/Feedback";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Admin from "./pages/Admin";
import { api } from "./lib/api";

export default function App() {
  const [page, setPage] = useState("courses");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [auth, setAuth] = useState({ token: null, user: null });

  useEffect(() => {
    const saved = localStorage.getItem("authToken");
    if (saved) {
      api
        .get("/api/me", saved)
        .then((data) => setAuth({ token: saved, user: data.user }))
        .catch(() => localStorage.removeItem("authToken"));
    }
  }, []);

  const handleLogin = (data) => {
    if (data?.token) {
      localStorage.setItem("authToken", data.token);
      setAuth({ token: data.token, user: data.user });
      setPage("courses");
    }
  };

  const handleRegister = (data) => {
    // After register, go to login for clarity
    if (data?.token) {
      // Alternatively, auto-login; keeping simple: go to login screen
      setPage("login");
    } else {
      setPage("login");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    setAuth({ token: null, user: null });
    setPage("courses");
  };

  // expose simple page switcher for link buttons without router
  window.__setPage = setPage;

  return (
    <div className="min-h-screen bg-white text-dark">
      <Navbar
        currentPage={page}
        setPage={setPage}
        authed={!!auth.token}
        userEmail={auth.user?.email}
        onLogout={handleLogout}
      />

      <main className="p-6">
        {page === "courses" && (
          <Courses
            onSelectCourse={(course) => {
              setSelectedCourse(course);
              setPage("feedback");
            }}
          />
        )}
        {page === "feedback" && (
          <Feedback
            course={selectedCourse || { name: "Selected Course" }}
            onBack={() => setPage("courses")}
            token={auth.token}
          />
        )}
        {page === "login" && <Login onLogin={handleLogin} />}
        {page === "register" && <Register onRegister={handleRegister} />}
        {page === "forgot" && (
          <ForgotPassword onDone={() => setPage("login")} />
        )}
        {page === "admin" && <Admin />}
      </main>
    </div>
  );
}
