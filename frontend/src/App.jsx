import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import Courses from "./pages/Courses";
import Feedback from "./pages/Feedback";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import Home from "./pages/Home";
import { api } from "./lib/api";

export default function App() {
  const [page, setPage] = useState("home");
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

  // No separate admin login flow anymore

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    setAuth({ token: null, user: null });
    setPage("courses");
  };

  // expose simple page switcher for link buttons without router
  window.__setPage = setPage;

  return (
    <div className="min-h-screen bg-[#101010] text-white">
      <Navbar
        currentPage={page}
        setPage={setPage}
        authed={!!auth.token}
        userName={auth.user?.name || auth.user?.email?.split("@")[0]}
        onLogout={handleLogout}
        isAdmin={!!auth.user?.isAdmin}
        onGoProfile={() => setPage("profile")}
      />

      <main>
        <div key={page} className="ani-page-flow">
          {page === "home" && <Home onBrowse={() => setPage("courses")} onLogin={() => setPage("login")} onRegister={() => setPage("register")} />}
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
          {page === "profile" && auth.user && (
            <Profile user={auth.user} onBack={() => setPage("courses")} />
          )}
          {page === "admin" && (
            <Admin token={auth.token} isAdmin={!!auth.user?.isAdmin} goLogin={() => setPage("login")} />
          )}
        </div>
      </main>
    </div>
  );
}
