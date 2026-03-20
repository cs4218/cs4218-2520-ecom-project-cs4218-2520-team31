// Amanda Quek Yan Ling, A0277779Y

import request from "supertest";
import {
  createTestApp,
  setupTestDB,
  teardownTestDB,
  clearDatabase,
  seedProducts,
  productModel,
} from "./utils.js";

describe("Integration Tests - Product Photo behavior", () => {
  let mongoServer;
  let app;
  let seeded;

  beforeAll(async () => {
    mongoServer = await setupTestDB();
    app = createTestApp();
  });

  beforeEach(async () => {
    await clearDatabase();
    seeded = await seedProducts();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await teardownTestDB(mongoServer);
  });

  test("should return 200 and non-empty photo buffer when photo exists", async () => {
    const pid = seeded.iphone._id.toString();

    const res = await request(app).get(`/api/v1/product/product-photo/${pid}`);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("image/png");
    expect(res.body).toBeTruthy();
    expect(Buffer.from(res.body).length).toBeGreaterThan(0);
  });

  test("should handle missing photo safely", async () => {
    const pid = seeded.samsung._id.toString();

    const res = await request(app).get(`/api/v1/product/product-photo/${pid}`);

    expect([404, 204, 200]).toContain(res.status);
  });

  test("should handle DB error when retrieving photo", async () => {
    jest.spyOn(productModel, "findById").mockReturnValue({
      select: jest.fn().mockRejectedValue(new Error("DB fail")),
    });

    const res = await request(app).get(
      `/api/v1/product/product-photo/${seeded.iphone._id.toString()}`
    );

    expect(res.status).toBe(500);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining("Error"),
      })
    );
  });
});