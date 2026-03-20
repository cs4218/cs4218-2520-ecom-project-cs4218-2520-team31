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

describe("Integration Tests - Product list to retrieving product details", () => {
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

  test("should return 200 and expected payload shape for list endpoint", async () => {
    const res = await request(app).get("/api/v1/product/get-product");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: expect.any(Boolean),
        products: expect.any(Array),
      })
    );
    expect(res.body.products.length).toBeGreaterThan(0);

    const first = res.body.products[0];
    expect(first).toEqual(
      expect.objectContaining({
        _id: expect.any(String),
        name: expect.any(String),
        slug: expect.any(String),
        description: expect.any(String),
        price: expect.any(Number),
        quantity: expect.any(Number),
      })
    );
  });

  test("should return 200 and expected payload shape for single product endpoint", async () => {
    const slug = seeded.iphone.slug;

    const res = await request(app).get(`/api/v1/product/get-product/${slug}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: expect.any(Boolean),
        product: expect.any(Object),
      })
    );

    expect(res.body.product).toEqual(
      expect.objectContaining({
        _id: expect.any(String),
        name: "iPhone 15",
        slug: "iphone-15",
        description: "Apple smartphone",
        price: 1499,
      })
    );
  });

  test("should handle empty product list correctly", async () => {
    await productModel.deleteMany({});

    const res = await request(app).get("/api/v1/product/get-product");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: expect.any(Boolean),
        products: expect.any(Array),
      })
    );
    expect(res.body.products).toHaveLength(0);
  });

  test("should handle invalid slug correctly", async () => {
    const invalidSlug = "does-not-exist";

    const res = await request(app).get(
      `/api/v1/product/get-product/${invalidSlug}`
    );

    expect([200, 400, 404]).toContain(res.status);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: expect.any(Boolean),
      })
    );
  });
});