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

describe("Integration Tests - Related Products endpoint", () => {
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

  test("should return related products excluding pid and filtered by cid", async () => {
    const pid = seeded.iphone._id.toString();
    const cid = seeded.electronicsCategory._id.toString();

    const res = await request(app).get(
      `/api/v1/product/related-product/${pid}/${cid}`
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: expect.any(Boolean),
        products: expect.any(Array),
      })
    );

    const ids = res.body.products.map((p) => p._id);
    expect(ids).not.toContain(pid);

    const slugs = res.body.products.map((p) => p.slug);
    expect(slugs).toContain("samsung-s24");
    expect(slugs).not.toContain("plain-tshirt");
  });

  test("should return empty array when no related products exist", async () => {
    await productModel.deleteMany({ _id: { $ne: seeded.iphone._id } });
    const pid = seeded.iphone._id.toString();
    const cid = seeded.electronicsCategory._id.toString();

    const res = await request(app).get(
      `/api/v1/product/related-product/${pid}/${cid}`
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: expect.any(Boolean),
        products: expect.any(Array),
      })
    );
    expect(res.body.products).toHaveLength(0);
  });
});