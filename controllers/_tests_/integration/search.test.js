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

describe("Integration Tests - Product Search", () => {
  let mongoServer;
  let app;

  beforeAll(async () => {
    mongoServer = await setupTestDB();
    app = createTestApp();
  });

  beforeEach(async () => {
    await clearDatabase();
    await seedProducts();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await teardownTestDB(mongoServer);
  });

  test("should return matched products and call search criteria correctly", async () => {
    const keyword = "iphone";
    const findSpy = jest.spyOn(productModel, "find");

    const res = await request(app).get(`/api/v1/product/search/${keyword}`);

    expect(res.status).toBe(200);
    expect(findSpy).toHaveBeenCalled();

    const firstArg = findSpy.mock.calls[0][0];
    expect(firstArg).toEqual(
      expect.objectContaining({
        $or: expect.any(Array),
      })
    );

    expect(Array.isArray(res.body)).toBe(true);

    const slugs = res.body.map((p) => p.slug);
    expect(slugs).toContain("iphone-15");
  });

  test("should handle no search matches correctly", async () => {
    const keyword = "nonexistentkeyword";

    const res = await request(app).get(`/api/v1/product/search/${keyword}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(0);
  });

  test("should handle DB search errors", async () => {
    jest.spyOn(productModel, "find").mockReturnValue({
      select: jest.fn().mockRejectedValue(new Error("DB fail")),
    });

    const res = await request(app).get("/api/v1/product/search/iphone");

    expect(res.status).toBe(400);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining("Error"),
      })
    );
  });
});