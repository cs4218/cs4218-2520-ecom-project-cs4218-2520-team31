// Amanda Quek Yan Ling, A0277779Y
import mongoose from "mongoose";
import Product from "./productModel.js";

describe("Product model (schema)", () => {

  const buildValidProduct = (overrides = {}) => {
    return new Product({
      name: "Test Product",
      slug: "Test-Product",
      description: "A product description",
      price: 12.49,
      category: new mongoose.Types.ObjectId(),
      quantity: 10,
      shipping: true,
      ...overrides,
    });
  };

  test("should validate correct product", async () => {
    const product = buildValidProduct();
    const err = await product.validate().then(() => null).catch((e) => e);
    expect(err).toBeNull();
  });

  test("should require name", async () => {
    const product = buildValidProduct({ name: undefined });
    const err = await product.validate().then(() => null).catch((e) => e);
    expect(err).not.toBeNull();
    expect(err.errors.name).toBeDefined();
    expect(err.errors.name.kind).toBe("required");
  });

  test("should require slug", async () => {
    const product = buildValidProduct({ slug: undefined });
    const err = await product.validate().then(() => null).catch((e) => e);
    expect(err).not.toBeNull();
    expect(err.errors.slug).toBeDefined();
    expect(err.errors.slug.kind).toBe("required");
  });

  test("should require description", async () => {
    const product = buildValidProduct({ description: undefined });
    const err = await product.validate().then(() => null).catch((e) => e);
    expect(err).not.toBeNull();
    expect(err.errors.description).toBeDefined();
    expect(err.errors.description.kind).toBe("required");
  });

  test("should require price", async () => {
    const product = buildValidProduct({ price: undefined });
    const err = await product.validate().then(() => null).catch((e) => e);
    expect(err).not.toBeNull();
    expect(err.errors.price).toBeDefined();
    expect(err.errors.price.kind).toBe("required");
  });

  test("should require category", async () => {
    const product = buildValidProduct({ category: undefined });
    const err = await product.validate().then(() => null).catch((e) => e);
    expect(err).not.toBeNull();
    expect(err.errors.category).toBeDefined();
    expect(err.errors.category.kind).toBe("required");
  });

  test("should require quantity", async () => {
    const product = buildValidProduct({ quantity: undefined });
    const err = await product.validate().then(() => null).catch((e) => e);
    expect(err).not.toBeNull();
    expect(err.errors.quantity).toBeDefined();
    expect(err.errors.quantity.kind).toBe("required");
  });

  test("should reject non-numeric price", async () => {
    const product = buildValidProduct({ price: "abc" });
    const err = await product.validate().then(() => null).catch((e) => e);
    expect(err).not.toBeNull();
    expect(err.errors.price).toBeDefined();
    expect(err.errors.price.name).toBe("CastError");
  });

  test("should reject invalid category ObjectId", async () => {
    const product = buildValidProduct({ category: "not-an-objectid" });
    const err = await product.validate().then(() => null).catch((e) => e);
    expect(err).not.toBeNull();
    expect(err.errors.category).toBeDefined();
    expect(err.errors.category.name).toBe("CastError");
  });

  test("shipping and photo are optional", async () => {
    const product = buildValidProduct({ shipping: undefined, photo: undefined });
    const err = await product.validate().then(() => null).catch((e) => e);
    expect(err).toBeNull();
  });
});