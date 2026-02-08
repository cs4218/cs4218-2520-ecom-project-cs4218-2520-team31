/**
 * Backend Unit Tests: 
 * 
 * Testing for FE Product Details page
 * - getSingleProductController
 * - productPhotoController
 * - realtedProductController
 * - productCategoryController
 * 
 * Testing for FE Category Product page
 * - productCategoryController
 */

import {
  getSingleProductController,
  productPhotoController,
  realtedProductController,
  productCategoryController,
} from "./productController.js"; 

import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";

jest.mock("../models/productModel.js");
jest.mock("../models/categoryModel.js");

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("Product Controller APIs", () => {
  beforeEach(() => {
    jest.clearAllMocks();		

    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });

  describe("getSingleProductController", () => {
    it("return 200 with product when slug exists", async () => {
      const req = { params: { slug: "iphone-15" } };
      const res = mockRes();

      const exec = jest.fn().mockResolvedValue({
        _id: "p1",
        slug: "iphone-15",
        name: "iPhone 15",
        category: { _id: "c1", name: "Phones" },
      });

      productModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnValue({
          populate: exec,
        }),
      });

      await getSingleProductController(req, res);

      expect(productModel.findOne).toHaveBeenCalledWith({ slug: "iphone-15" });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Single Product Fetched",
          product: expect.objectContaining({ slug: "iphone-15" }),
        })
      );
    });

    it("should return 500 on model error", async () => {
      const req = { params: { slug: "iphone-15" } };
      const res = mockRes();

      productModel.findOne.mockImplementation(() => {
        throw new Error("DB fail");
      });

      await getSingleProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Eror while getitng single product",
        })
      );
    });
  });

  describe("productPhotoController", () => {
    it("should return 200 with image buffer and set content-type if photo exists", async () => {
      const req = { params: { pid: "p1" } };
      const res = mockRes();

      const photoBuffer = Buffer.from("fakeimage");
      const exec = jest.fn().mockResolvedValue({
        photo: { data: photoBuffer, contentType: "image/png" },
      });

      productModel.findById.mockReturnValue({
        select: exec,
      });

      await productPhotoController(req, res);

      expect(productModel.findById).toHaveBeenCalledWith("p1");
      expect(res.set).toHaveBeenCalledWith("Content-type", "image/png");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(photoBuffer);
    });

    it("should NOT send photo if photo.data is missing (no crash)", async () => {
      const req = { params: { pid: "p1" } };
      const res = mockRes();

      const exec = jest.fn().mockResolvedValue({
        photo: { data: null, contentType: "image/png" },
      });

      productModel.findById.mockReturnValue({
        select: exec,
      });

      await productPhotoController(req, res);

      expect(res.status).not.toHaveBeenCalledWith(200);
      expect(res.send).not.toHaveBeenCalled();
    });

    it("return 500 on error", async () => {
      const req = { params: { pid: "p1" } };
      const res = mockRes();

      productModel.findById.mockImplementation(() => {
        throw new Error("DB fail");
      });

      await productPhotoController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Erorr while getting photo",
        })
      );
    });
  });

  describe("realtedProductController", () => {
    it("should return 200 with related products (excluding pid)", async () => {
      const req = { params: { pid: "p1", cid: "c1" } };
      const res = mockRes();

      const exec = jest.fn().mockResolvedValue([
        { _id: "p2", name: "Samsung S24" },
      ]);

      productModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            populate: exec,
          }),
        }),
      });

      await realtedProductController(req, res);

      expect(productModel.find).toHaveBeenCalledWith({
        category: "c1",
        _id: { $ne: "p1" },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          products: expect.any(Array),
        })
      );
    });

    it("should return 400 on error", async () => {
      const req = { params: { pid: "p1", cid: "c1" } };
      const res = mockRes();

      productModel.find.mockImplementation(() => {
        throw new Error("DB fail");
      });

      await realtedProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "error while geting related product",
        })
      );
    });
  });

  describe("productCategoryController", () => {
    it("should return 200 with category and products for slug", async () => {
      const req = { params: { slug: "phones" } };
      const res = mockRes();

      const categoryDoc = { _id: "c1", slug: "phones", name: "Phones" };
      categoryModel.findOne.mockResolvedValue(categoryDoc);
      const exec = jest.fn().mockResolvedValue([
        { _id: "p1", name: "iPhone 15" },
      ]);

      productModel.find.mockReturnValue({
        populate: exec,
      });

      await productCategoryController(req, res);

      expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: "phones" });
      expect(productModel.find).toHaveBeenCalledWith({ category: categoryDoc });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          category: expect.objectContaining({ slug: "phones" }),
          products: expect.any(Array),
        })
      );
    });

    it("should return 200 with empty products when category has no products", async () => {
      const req = { params: { slug: "phones" } };
      const res = mockRes();

      const categoryDoc = { _id: "c1", slug: "phones", name: "Phones" };
      categoryModel.findOne.mockResolvedValue(categoryDoc);

      const exec = jest.fn().mockResolvedValue([]);
      productModel.find.mockReturnValue({ populate: exec });

      await productCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          category: expect.objectContaining({ name: "Phones" }),
          products: [],
        })
      );
    });

    it("should call populate('category') when fetching category products", async () => {
      const req = { params: { slug: "phones" } };
      const res = mockRes();

      const categoryDoc = { _id: "c1", slug: "phones", name: "Phones" };
      categoryModel.findOne.mockResolvedValue(categoryDoc);

      const populateMock = jest.fn().mockResolvedValue([]);
      productModel.find.mockReturnValue({ populate: populateMock });

      await productCategoryController(req, res);

      expect(productModel.find).toHaveBeenCalledWith({ category: categoryDoc });
      expect(populateMock).toHaveBeenCalledWith("category");
    });

    it("should return 400 if product lookup fails after category found", async () => {
      const req = { params: { slug: "phones" } };
      const res = mockRes();

      const categoryDoc = { _id: "c1", slug: "phones", name: "Phones" };
      categoryModel.findOne.mockResolvedValue(categoryDoc);

      const populateMock = jest.fn().mockRejectedValue(new Error("DB fail"));
      productModel.find.mockReturnValue({ populate: populateMock });

      await productCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error While Getting products",
        })
      );
    });

    it("should return 200 even if category slug not found and will return products result", async () => {
      const req = { params: { slug: "nonexistent" } };
      const res = mockRes();

      categoryModel.findOne.mockResolvedValue(null);

      const populateMock = jest.fn().mockResolvedValue([]);
      productModel.find.mockReturnValue({ populate: populateMock });

      await productCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          category: null,
          products: expect.any(Array),
        })
      );
    });

    it("should return 400 on error", async () => {
      const req = { params: { slug: "phones" } };
      const res = mockRes();

      categoryModel.findOne.mockRejectedValue(new Error("DB fail"));

      await productCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error While Getting products",
        })
      );
    });
  });

  
});
