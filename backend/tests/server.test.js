import request from "supertest";
import app, { _testCloseMongo } from "../server.js";

describe("API routes", () => {
  it("returns the list of courses", async () => {
    const res = await request(app).get("/api/courses").expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    // verify at least one known course exists
    expect(res.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 1, name: expect.any(String) }),
      ])
    );
  });

  it("returns feedback array for a known course id (may be empty)", async () => {
    const res = await request(app)
      .get("/api/courses/1/feedback")
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("returns an empty array for an unknown course id", async () => {
    const res = await request(app)
      .get("/api/courses/999/feedback")
      .expect(200);
    expect(res.body).toEqual([]);
  });

  it("accepts feedback submissions when authorized", async () => {
    // Register a random user to get a token (memory fallback used during tests)
    const email = `user_${Date.now()}@test.local`;
    const reg = await request(app)
      .post("/api/auth/register")
      .send({ name: "Tester", email, password: "pass1234" })
      .expect(200);
    expect(reg.body.token).toEqual(expect.any(String));
    const token = reg.body.token;

    const payload = {
      courseId: 1,
      comment: "Great!",
      rating: 9,
    };
    const res = await request(app)
      .post("/api/feedback")
      .set("Authorization", `Bearer ${token}`)
      .send(payload)
      .expect(200);
    expect(res.body).toEqual(
      expect.objectContaining({ message: expect.any(String), feedback: expect.any(Object) })
    );
    expect(res.body.feedback).toEqual(
      expect.objectContaining({ comment: payload.comment, rating: payload.rating })
    );
  });

  afterAll(async () => {
    await _testCloseMongo();
  });
});
