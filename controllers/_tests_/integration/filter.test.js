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

describe("Integration Tests - Product Filters", () => {
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

  test("should return filtered products and build correct query", async () => {
    const findSpy = jest.spyOn(productModel, "find");
    const payload = {
      checked: [seeded.electronicsCategory._id.toString()],
      radio: [1000, 1600],
    };

    const res = await request(app)
      .post("/api/v1/product/product-filters")
      .send(payload);

    expect(res.status).toBe(200);
    expect(findSpy).toHaveBeenCalled();

    const queryArg = findSpy.mock.calls[0][0];
    expect(queryArg).toEqual(
      expect.objectContaining({
        price: {
          $gte: 1000,
          $lte: 1600,
        },
      })
    );
    expect(queryArg.category.length).toBe(1);

    expect(res.body).toEqual(
      expect.objectContaining({
        success: expect.any(Boolean),
        products: expect.any(Array),
      })
    );

    const slugs = res.body.products.map((p) => p.slug);
    expect(slugs).toContain("iphone-15");
    expect(slugs).toContain("samsung-s24");
    expect(slugs).not.toContain("plain-tshirt");
  });

  test("should handle empty or unrecognised filters safely", async () => {
    const payload = {
      checked: [],
      radio: [],
    };

    const res = await request(app)
      .post("/api/v1/product/product-filters")
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: expect.any(Boolean),
        products: expect.any(Array),
      })
    );
  });

  test("should handle DB failure in product filters", async () => {
    jest.spyOn(productModel, "find").mockRejectedValue(new Error("DB fail"));

    const res = await request(app)
      .post("/api/v1/product/product-filters")
      .send({
        checked: [seeded.electronicsCategory._id.toString()],
        radio: [1000, 1600],
      });

    expect([400, 500]).toContain(res.status);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: expect.any(Boolean),
      })
    );
  });
});