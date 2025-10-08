import express from "express";
import cors from "cors";
import mysql from "mysql2";
import dotenv from "dotenv";
dotenv.config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect(err => {
  if (err) console.error("DB error:", err);
  else console.log("MySQL connected");
});



const app = express();
app.use(cors());
app.use(express.json());

// Пример маршрутов
app.get("/api/courses", (req, res) => {
  res.json([
    { id: 1, name: "Mathematics" },
    { id: 2, name: "Physics" },
  ]);
});

// Мок-отзывы по id курса
const feedbacks = {
  1: [
    { id: 1, comment: "Great course!", rating: 9 },
    { id: 2, comment: "Challenging but useful.", rating: 8 },
  ],
  2: [
    { id: 3, comment: "Too theoretical.", rating: 6 },
    { id: 4, comment: "Loved the experiments!", rating: 10 },
  ],
};

// Получить отзывы по ID курса
app.get("/api/courses/:id/feedback", (req, res) => {
  const { id } = req.params;
  res.json(feedbacks[id] || []);
});

app.post("/api/feedback", (req, res) => {
  console.log("Feedback:", req.body);
  res.json({ message: "Feedback received" });
});


const PORT = 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
