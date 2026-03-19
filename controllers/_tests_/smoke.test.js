import request from "supertest";
import app from "../../app.js";

describe("Smoke test", () => {
  it("GET / returns 200", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(200);
  });
});