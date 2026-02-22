// Amanda Quek Yan Ling, A0277779Y
import { buildReq, buildRes, expectStatusBeforeSend } from "./testUtils.js";
import productModel from "../../models/productModel.js";
import { getSingleProductController } from "../productController.js";

jest.mock("../../models/productModel.js");

describe("getSingleProductController", () => {
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
    it("should get single product when input exists and query succeeds", async () => {
      req = buildReq({ params: { slug: "test-product" } });

      const mockProduct = {
        _id: "pid1",
        name: "Test Product",
        slug: "test-product",
        description: "Test Description",
        price: 100,
        category: { _id: "c1", name: "Category 1" },
        quantity: 10,
        shipping: true,
      };

      const populateMock = jest.fn().mockResolvedValue(mockProduct);
      const selectMock = jest.fn().mockReturnValue({ populate: populateMock });
      productModel.findOne.mockReturnValue({ select: selectMock });

      await getSingleProductController(req, res);

      // Output-Based Check
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Single Product Fetched",
        product: mockProduct,
      });

      const payload = res.send.mock.calls[0][0];
      expect(Object.keys(payload).sort()).toEqual(
        ["message", "product", "success"].sort()
      );

      expectStatusBeforeSend(res);

      // Communication-Based Check
      expect(productModel.findOne).toHaveBeenCalledTimes(1);
      expect(productModel.findOne).toHaveBeenCalledWith({
        slug: "test-product",
      });
      expect(selectMock).toHaveBeenCalledWith("-photo");
      expect(populateMock).toHaveBeenCalledWith("category");
    });

    it("should return 200 with null response as no product is found", async () => {
      req = buildReq({ params: { slug: "missing-product" } });

      const populateMock = jest.fn().mockResolvedValue(null);
      const selectMock = jest.fn().mockReturnValue({ populate: populateMock });
      productModel.findOne.mockReturnValue({ select: selectMock });

      await getSingleProductController(req, res);

      // Output-Based Check
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Single Product Fetched",
        product: null,
      });

      expectStatusBeforeSend(res);

      // Communication-Based Check
      expect(productModel.findOne).toHaveBeenCalledTimes(1);
      expect(productModel.findOne).toHaveBeenCalledWith({
        slug: "missing-product",
      });
    });
  });

  // ==========================================================
  // Input Validation - Invalid
  // ==========================================================
  describe("Input Validation - Invalid", () => {
    it("should return 400 when input is missing", async () => {
      req = buildReq({ params: {} });

      await getSingleProductController(req, res);

      // Output-Based Check
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Missing input required",
      });

      expectStatusBeforeSend(res);

      // Communication-Based Check 
      expect(productModel.findOne).not.toHaveBeenCalled();
    });

    it("should return 400 when input is blank", async () => {
      req = buildReq({ params: { slug: "   " } });

      await getSingleProductController(req, res);

      // Output-Based Check (STRICT)
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Missing input required",
      });

      // Nit: status() before send()
      expectStatusBeforeSend(res);

      // Communication-Based Check
      expect(productModel.findOne).not.toHaveBeenCalled();
    });
  });

  // ==========================================================
  // Input Validation - Valid
  // ==========================================================
  describe("Input Validation - Valid", () => {
    it("should accept a non-empty string and query db once", async () => {
      req = buildReq({ params: { slug: "valid-product" } });
      const mockProduct = { _id: "pid2", slug: "valid-product" };

      const populateMock = jest.fn().mockResolvedValue(mockProduct);
      const selectMock = jest.fn().mockReturnValue({ populate: populateMock });
      productModel.findOne.mockReturnValue({ select: selectMock });

      await getSingleProductController(req, res);

      // Communication-Based Check
      expect(productModel.findOne).toHaveBeenCalledTimes(1);
      expect(productModel.findOne).toHaveBeenCalledWith({ slug: "valid-product" });

      // Output-Based Check
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Single Product Fetched",
        product: mockProduct,
      });

      expectStatusBeforeSend(res);
    });
  });

  // ==========================================================
  // Edge Cases
  // ==========================================================
  describe("Edge Cases", () => {
    it("should exclude photo field using select('-photo')", async () => {
      req = buildReq({ params: { slug: "no-photo-product" } });

      const populateMock = jest.fn().mockResolvedValue({ _id: "pid3" });
      const selectMock = jest.fn().mockReturnValue({ populate: populateMock });
      productModel.findOne.mockReturnValue({ select: selectMock });

      await getSingleProductController(req, res);

      // Communication-Based Check
      expect(selectMock).toHaveBeenCalledWith("-photo");

      expect(res.status).toHaveBeenCalledWith(200);
      expectStatusBeforeSend(res);
    });

    it("should populate category using populate('category')", async () => {
      // ================== ARRANGE ==================
      req = buildReq({ params: { slug: "category-product" } });

      const populateMock = jest.fn().mockResolvedValue({ _id: "pid4" });
      const selectMock = jest.fn().mockReturnValue({ populate: populateMock });
      productModel.findOne.mockReturnValue({ select: selectMock });

      await getSingleProductController(req, res);

      // Communication-Based Check
      expect(populateMock).toHaveBeenCalledWith("category");

      expect(res.status).toHaveBeenCalledWith(200);
      expectStatusBeforeSend(res);
    });
  });

  // ==========================================================
  // Error Handling
  // ==========================================================
  describe("Error Handling", () => {
    it("should return 500 with error message when database query rejects", async () => {
      req = buildReq({ params: { slug: "test-product" } });

      const mockError = new Error("Database connection failed");

      const populateMock = jest.fn().mockRejectedValue(mockError);
      const selectMock = jest.fn().mockReturnValue({ populate: populateMock });
      productModel.findOne.mockReturnValue({ select: selectMock });

      await getSingleProductController(req, res);

      // Output-Based Check
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error while getting single product",
        })
      );

      expectStatusBeforeSend(res);
    });

    it("should return 500 when db throws findOne", async () => {
      req = buildReq({ params: { slug: "test-product" } });

      productModel.findOne.mockImplementation(() => {
        throw new Error("findOne failed");
      });

      await getSingleProductController(req, res);

      // Output-Based Check
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error while getting single product",
        })
      );

      expectStatusBeforeSend(res);
    });
  });
});