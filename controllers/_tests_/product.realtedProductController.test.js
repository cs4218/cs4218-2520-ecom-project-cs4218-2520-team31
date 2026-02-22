// Amanda Quek Yan Ling, A0277779Y
import { buildReq, buildRes, expectStatusBeforeSend } from "./testUtils.js";
import productModel from "../../models/productModel.js";
import { realtedProductController } from "../productController.js";

jest.mock("../../models/productModel.js");

describe("realtedProductController", () => {
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
    it("should return related products when pid and cid exist and query succeeds", async () => {
      req = buildReq({ params: { pid: "pid1", cid: "cid1" } });
      const mockProducts = [
        { _id: "pid2", category: { _id: "cid1", name: "Cat" } },
        { _id: "pid3", category: { _id: "cid1", name: "Cat" } },
      ];
      const populateMock = jest.fn().mockResolvedValue(mockProducts);
      const limitMock = jest.fn().mockReturnValue({ populate: populateMock });
      const selectMock = jest.fn().mockReturnValue({ limit: limitMock });
      productModel.find = jest.fn().mockReturnValue({ select: selectMock });

      await realtedProductController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: mockProducts,
      });
      const payload = res.send.mock.calls[0][0];
      expect(Object.keys(payload).sort()).toEqual(["products", "success"].sort());

      expectStatusBeforeSend(res);

      // Communication based check
      expect(productModel.find).toHaveBeenCalledTimes(1);
      expect(productModel.find).toHaveBeenCalledWith({
        category: "cid1",
        _id: { $ne: "pid1" },
      });
      expect(selectMock).toHaveBeenCalledWith("-photo");
      expect(limitMock).toHaveBeenCalledWith(3);
      expect(populateMock).toHaveBeenCalledWith("category");
    });

    it("should return empty array when no related products exist", async () => {
      req = buildReq({ params: { pid: "pid1", cid: "cid1" } });
      const populateMock = jest.fn().mockResolvedValue([]);
      const limitMock = jest.fn().mockReturnValue({ populate: populateMock });
      const selectMock = jest.fn().mockReturnValue({ limit: limitMock });
      productModel.find = jest.fn().mockReturnValue({ select: selectMock });

      await realtedProductController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: [],
      });

      expectStatusBeforeSend(res);

      // Communication based check
      expect(productModel.find).toHaveBeenCalledTimes(1);
      expect(limitMock).toHaveBeenCalledWith(3);
    });
  });

  // ==========================================================
  // Input Validation - Invalid
  // ==========================================================
  describe("Input Validation - Invalid", () => {
    it("should return 400 when pid is missing", async () => {
      req = buildReq({ params: { cid: "cid1" } });

      await realtedProductController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error in getting related product",
        })
      );

      expectStatusBeforeSend(res);

      // Communication based check
      expect(productModel.find).not.toHaveBeenCalled();
    });

    it("should return 400 when cid is missing", async () => {
      req = buildReq({ params: { pid: "pid1" } });

      await realtedProductController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error in getting related product",
        })
      );

      expectStatusBeforeSend(res);

      // Communication based check
      expect(productModel.find).not.toHaveBeenCalled();
    });

    it("should return 400 when pid is blank", async () => {
      req = buildReq({ params: { pid: "   ", cid: "cid1" } });

      await realtedProductController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error in getting related product",
        })
      );

      expectStatusBeforeSend(res);

      // Communication based check
      expect(productModel.find).not.toHaveBeenCalled();
    });

    it("should return 400 when cid is blank", async () => {
      req = buildReq({ params: { pid: "pid1", cid: "   " } });

      await realtedProductController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error in getting related product",
        })
      );

      expectStatusBeforeSend(res);

      // Communication based check
      expect(productModel.find).not.toHaveBeenCalled();
    });
  });

  // ==========================================================
  // Input Validation - Valid
  // ==========================================================
  describe("Input Validation - Valid", () => {
    it("should accept valid pid and cid and query db once", async () => {
      req = buildReq({ params: { pid: "pidV", cid: "cidV" } });
      const populateMock = jest.fn().mockResolvedValue([]);
      const limitMock = jest.fn().mockReturnValue({ populate: populateMock });
      const selectMock = jest.fn().mockReturnValue({ limit: limitMock });
      productModel.find = jest.fn().mockReturnValue({ select: selectMock });

      await realtedProductController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(200);

      expectStatusBeforeSend(res);

      // Communication based check
      expect(productModel.find).toHaveBeenCalledTimes(1);
      expect(productModel.find).toHaveBeenCalledWith({
        category: "cidV",
        _id: { $ne: "pidV" },
      });
    });
  });

  // ==========================================================
  // Edge Cases
  // ==========================================================
  describe("Edge Cases", () => {
    it("should limit results to 3 products", async () => {
      req = buildReq({ params: { pid: "pid1", cid: "cid1" } });
      const populateMock = jest.fn().mockResolvedValue([]);
      const limitMock = jest.fn().mockReturnValue({ populate: populateMock });
      const selectMock = jest.fn().mockReturnValue({ limit: limitMock });
      productModel.find = jest.fn().mockReturnValue({ select: selectMock });

      await realtedProductController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(200);

      expectStatusBeforeSend(res);

      // Communication based check
      expect(limitMock).toHaveBeenCalledWith(3);
    });

    it("should exclude photo", async () => {
      req = buildReq({ params: { pid: "pid1", cid: "cid1" } });
      const populateMock = jest.fn().mockResolvedValue([]);
      const limitMock = jest.fn().mockReturnValue({ populate: populateMock });
      const selectMock = jest.fn().mockReturnValue({ limit: limitMock });
      productModel.find = jest.fn().mockReturnValue({ select: selectMock });

      await realtedProductController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(200);

      expectStatusBeforeSend(res);

      // Communication based check
      expect(selectMock).toHaveBeenCalledWith("-photo");
    });

    it("should populate category", async () => {
      req = buildReq({ params: { pid: "pid1", cid: "cid1" } });
      const populateMock = jest.fn().mockResolvedValue([]);
      const limitMock = jest.fn().mockReturnValue({ populate: populateMock });
      const selectMock = jest.fn().mockReturnValue({ limit: limitMock });
      productModel.find = jest.fn().mockReturnValue({ select: selectMock });

      await realtedProductController(req, res);

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
    it("should return 400 when db throws error", async () => {
      req = buildReq({ params: { pid: "pid1", cid: "cid1" } });
      const populateMock = jest.fn().mockRejectedValue(new Error("DB error"));
      const limitMock = jest.fn().mockReturnValue({ populate: populateMock });
      const selectMock = jest.fn().mockReturnValue({ limit: limitMock });
      productModel.find = jest.fn().mockReturnValue({ select: selectMock });

      await realtedProductController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error in getting related product",
        })
      );

      expectStatusBeforeSend(res);

      // Communication based check
      expect(productModel.find).toHaveBeenCalledTimes(1);
      expect(selectMock).toHaveBeenCalledWith("-photo");
      expect(limitMock).toHaveBeenCalledWith(3);
      expect(populateMock).toHaveBeenCalledWith("category");
    });

    it("should return 400 when db throws find", async () => {
      req = buildReq({ params: { pid: "pid1", cid: "cid1" } });
      productModel.find = jest.fn(() => {
        throw new Error("find failed");
      });

      await realtedProductController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error in getting related product",
        })
      );

      expectStatusBeforeSend(res);

      // Communication based check
      expect(productModel.find).toHaveBeenCalledTimes(1);
    });
  });
});