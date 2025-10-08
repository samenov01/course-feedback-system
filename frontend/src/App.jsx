import { useState } from "react";
import Navbar from "./components/Navbar";
import Courses from "./pages/Courses";
import Feedback from "./pages/Feedback";
import Login from "./pages/Login";
import Register from "./pages/Register";

export default function App() {
  const [page, setPage] = useState("courses");
  const [selectedCourse, setSelectedCourse] = useState(null);

  return (
    <div className="min-h-screen bg-white text-dark">
      <Navbar currentPage={page} setPage={setPage} />

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
          />
        )}
        {page === "login" && <Login onLogin={() => setPage("courses")} />}
        {page === "register" && (
          <Register onRegister={() => setPage("login")} />
        )}
      </main>
    </div>
  );
}
