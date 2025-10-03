import { useEffect, useState } from "react";

function App() {
  const [msg, setMsg] = useState("Loading...");

  useEffect(() => {
    fetch("http://localhost:5000/ping")
      .then(res => res.text())
      .then(data => setMsg(data))
      .catch(() => setMsg("Backend not running"));
  }, []);

  return (
    <h1>Backend says: {msg}</h1>
  );
}

export default App;
