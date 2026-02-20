import { buildReq, buildRes, expectStatusBeforeSend } from "./testUtils.js";
import productModel from "../../models/productModel.js";
import categoryModel from "../../models/categoryModel.js";
import { productCategoryController } from "../productController.js";

jest.mock("../../models/productModel.js");
jest.mock("../../models/categoryModel.js");

describe("productCategoryController", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = buildReq();
    res = buildRes();
  });

  // ==========================================================
  // Main Flow
  // ==========================================================
  describe("Main Flow", () => {
    it("should return category and products when input exists", async () => {
      req = buildReq({ params: { slug: "snacks" } });
      const mockCategory = { _id: "cid1", name: "Snacks", slug: "snacks" };
      const mockProducts = [
        { _id: "pid1", name: "Chips", category: mockCategory },
        { _id: "pid2", name: "Cookies", category: mockCategory },
      ];
      categoryModel.findOne = jest.fn().mockResolvedValue(mockCategory);
      const populateMock = jest.fn().mockResolvedValue(mockProducts);
      productModel.find = jest.fn().mockReturnValue({ populate: populateMock });

      await productCategoryController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        category: mockCategory,
        products: mockProducts,
      });
      const payload = res.send.mock.calls[0][0];
      expect(Object.keys(payload).sort()).toEqual(
        ["category", "products", "success"].sort()
      );

      expectStatusBeforeSend(res);

      // Communication based check
      expect(categoryModel.findOne).toHaveBeenCalledTimes(1);
      expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: "snacks" });
      expect(productModel.find).toHaveBeenCalledTimes(1);
      expect(productModel.find).toHaveBeenCalledWith({ category: mockCategory });
      expect(populateMock).toHaveBeenCalledTimes(1);
      expect(populateMock).toHaveBeenCalledWith("category");
    });

    it("should return category as null and empty products when category is not found", async () => {
      req = buildReq({ params: { slug: "missing" } });
      categoryModel.findOne = jest.fn().mockResolvedValue(null);
      const populateMock = jest.fn().mockResolvedValue([]);
      productModel.find = jest.fn().mockReturnValue({ populate: populateMock });

      await productCategoryController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        category: null,
        products: [],
      });

      expectStatusBeforeSend(res);

      // Communication based check
      expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: "missing" });
      expect(productModel.find).toHaveBeenCalledWith({ category: null });
      expect(populateMock).toHaveBeenCalledWith("category");
    });
  });

  // ==========================================================
  // Input Validation - Invalid
  // ==========================================================
  describe("Input Validation - Invalid", () => {
    it("should return 400 when input is missing", async () => {
      req = buildReq({ params: {} });

      await productCategoryController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error in getting products",
        })
      );

      expectStatusBeforeSend(res);

      // Communication based check
      expect(categoryModel.findOne).not.toHaveBeenCalled();
      expect(productModel.find).not.toHaveBeenCalled();
    });

    it("should return 400 when input is blank", async () => {
      req = buildReq({ params: { slug: "   " } });

      await productCategoryController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error in getting products",
        })
      );

      expectStatusBeforeSend(res);

      // Communication based check
      expect(categoryModel.findOne).not.toHaveBeenCalled();
      expect(productModel.find).not.toHaveBeenCalled();
    });
  });

  // ==========================================================
  // Edge Cases
  // ==========================================================
  describe("Edge Cases", () => {
    it("should populate category field for products", async () => {
      req = buildReq({ params: { slug: "snacks" } });
      const mockCategory = { _id: "cid1", slug: "snacks" };
      categoryModel.findOne = jest.fn().mockResolvedValue(mockCategory);
      const populateMock = jest.fn().mockResolvedValue([]);
      productModel.find = jest.fn().mockReturnValue({ populate: populateMock });

      await productCategoryController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(200);

      expectStatusBeforeSend(res);

      // Communication based check
      expect(populateMock).toHaveBeenCalledWith("category");
    });
  });

  // ==========================================================
  // Error Handling
  // ==========================================================
  describe("Error Handling", () => {
    it("should return 400 when categoryModel throws findOne", async () => {
      req = buildReq({ params: { slug: "snacks" } });
      categoryModel.findOne = jest
        .fn()
        .mockRejectedValue(new Error("Category db error"));

      await productCategoryController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error in getting products",
        })
      );

      expectStatusBeforeSend(res);

      // Communication based check
      expect(categoryModel.findOne).toHaveBeenCalledTimes(1);
      expect(productModel.find).not.toHaveBeenCalled();
    });

    it("should return 400 when productModel throws find at populate stage", async () => {
      req = buildReq({ params: { slug: "snacks" } });
      const mockCategory = { _id: "cid1", slug: "snacks" };
      categoryModel.findOne = jest.fn().mockResolvedValue(mockCategory);
      const populateMock = jest.fn().mockRejectedValue(new Error("Product db error"));
      productModel.find = jest.fn().mockReturnValue({ populate: populateMock });

      await productCategoryController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error in getting products",
        })
      );

      expectStatusBeforeSend(res);

      // Communication based check
      expect(categoryModel.findOne).toHaveBeenCalledTimes(1);
      expect(productModel.find).toHaveBeenCalledWith({ category: mockCategory });
      expect(populateMock).toHaveBeenCalledWith("category");
    });

    it("should return 400 when productModel throws find", async () => {
      req = buildReq({ params: { slug: "snacks" } });
      const mockCategory = { _id: "cid1", slug: "snacks" };
      categoryModel.findOne = jest.fn().mockResolvedValue(mockCategory);
      productModel.find = jest.fn(() => {
        throw new Error("find failed");
      });

      await productCategoryController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error in getting products",
        })
      );

      expectStatusBeforeSend(res);

      // Communication based check
      expect(categoryModel.findOne).toHaveBeenCalledTimes(1);
      expect(productModel.find).toHaveBeenCalledTimes(1);
    });
  });
});