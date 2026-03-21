import request from "supertest";
import app from "../../app.js";
import {
  connectMemoryDb,
  clearMemoryDb,
  closeMemoryDb,
} from "../../tests/setupMemoryDb.js";

beforeAll(async () => {
  await connectMemoryDb();
});

afterEach(async () => {
  await clearMemoryDb();
});

afterAll(async () => {
  await closeMemoryDb();
});

describe("Smoke test", () => {
  it("GET / returns 200", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(200);
  });
});