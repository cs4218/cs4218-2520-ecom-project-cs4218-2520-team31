// Amanda Quek Yan Ling, A0277779Y

import request from "supertest";
import {
  createTestApp,
  setupTestDB,
  teardownTestDB,
  clearDatabase,
  seedProducts,
  categoryModel,
  productModel,
} from "./utils.js";

describe("Integration Tests - Category Product mappings", () => {
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

  test("should return category products and call lookups correctly", async () => {
    const categorySlug = "electronics";
    const findOneSpy = jest.spyOn(categoryModel, "findOne");
    const findSpy = jest.spyOn(productModel, "find");

    const res = await request(app).get(
      `/api/v1/product/product-category/${categorySlug}`
    );

    expect(res.status).toBe(200);
    expect(findOneSpy).toHaveBeenCalled();
    expect(findOneSpy.mock.calls[0][0]).toEqual({ slug: categorySlug });
    expect(findSpy).toHaveBeenCalled();

    expect(res.body).toEqual(
      expect.objectContaining({
        success: expect.any(Boolean),
      })
    );

    if (res.body.category) {
      expect(res.body.category).toEqual(
        expect.objectContaining({
          slug: "electronics",
        })
      );
    }
    if (res.body.products) {
      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.products.length).toBeGreaterThan(0);

      const product = res.body.products[0];
      if (product.category && typeof product.category === "object") {
        expect(product.category).toEqual(
          expect.objectContaining({
            _id: expect.any(String),
          })
        );
      }
    }
  });

  test("should return empty products array when category exists but has no products", async () => {
    await categoryModel.create({
      name: "Books",
      slug: "books",
    });
    const res = await request(app).get("/api/v1/product/product-category/books");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: expect.any(Boolean),
      })
    );

    if (res.body.products) {
      expect(res.body.products).toEqual([]);
    }
  });

  test("should handle DB failure during category lookup", async () => {
    jest.spyOn(categoryModel, "findOne").mockRejectedValue(new Error("DB fail"));
    const res = await request(app).get(
      "/api/v1/product/product-category/electronics"
    );

    expect([400, 500]).toContain(res.status);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: expect.any(Boolean),
      })
    );
  });
});