import request from "supertest";
import app from "../server.js";

describe("API routes", () => {
  it("returns the list of courses", async () => {
    const res = await request(app).get("/api/courses").expect(200);
    expect(res.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 1, name: "Mathematics" }),
        expect.objectContaining({ id: 2, name: "Physics" }),
      ])
    );
  });

  it("returns feedback for a known course id", async () => {
    const res = await request(app)
      .get("/api/courses/1/feedback")
      .expect(200);

    expect(res.body.length).toBeGreaterThan(0);
    res.body.forEach((feedback) => {
      expect(feedback).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          comment: expect.any(String),
          rating: expect.any(Number),
        })
      );
    });
  });

  it("returns an empty array for an unknown course id", async () => {
    const res = await request(app)
      .get("/api/courses/999/feedback")
      .expect(200);

    expect(res.body).toEqual([]);
  });

  it("accepts feedback submissions", async () => {
    const payload = {
      courseId: 1,
      courseName: "Mathematics",
      comment: "Great!",
      rating: 9,
    };

    const res = await request(app)
      .post("/api/feedback")
      .send(payload)
      .expect(200);

    expect(res.body).toEqual({ message: "Feedback received" });
  });
});
