// Amanda Quek Yan Ling, A0277779Y
import { buildReq, buildRes, expectStatusBeforeSend } from "./testUtils.js";
import productModel from "../../models/productModel.js";
import { searchProductController } from "../productController.js";

jest.mock("../../models/productModel.js");

describe("searchProductController", () => {
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
    it("should return matched products when keyword exists and query succeeds", async () => {
      req = buildReq({ params: { keyword: "choco" } });
      const mockResults = [
        { _id: "pid1", name: "Chocolate Bar" },
        { _id: "pid2", description: "Choco wafers" },
      ];
      const selectMock = jest.fn().mockResolvedValue(mockResults);
      productModel.find = jest.fn().mockReturnValue({ select: selectMock });

      await searchProductController(req, res);

      // Output based check
      expect(res.json).toHaveBeenCalledWith(mockResults);
      expect(res.send).not.toHaveBeenCalled();

      // Communication based check
      expect(productModel.find).toHaveBeenCalledTimes(1);
      expect(productModel.find).toHaveBeenCalledWith({
        $or: [
          { name: { $regex: "choco", $options: "i" } },
          { description: { $regex: "choco", $options: "i" } },
        ],
      });
      expect(selectMock).toHaveBeenCalledWith("-photo");
    });

    it("should return empty array when no results found", async () => {
      req = buildReq({ params: { keyword: "no-match" } });
      const selectMock = jest.fn().mockResolvedValue([]);
      productModel.find = jest.fn().mockReturnValue({ select: selectMock });
      await searchProductController(req, res);

      // Output based check
      expect(res.json).toHaveBeenCalledWith([]);
      expect(res.send).not.toHaveBeenCalled();

      // Communication based check
      expect(productModel.find).toHaveBeenCalledTimes(1);
      expect(selectMock).toHaveBeenCalledWith("-photo");
    });
  });

  // ==========================================================
  // Input Validation - Invalid
  // ==========================================================
  describe("Input Validation - Invalid", () => {
    it("should return 400 when keyword is missing", async () => {
      req = buildReq({ params: {} });

      await searchProductController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error in searching product",
        })
      );

      expectStatusBeforeSend(res);

      // Communication based check
      expect(productModel.find).not.toHaveBeenCalled();
    });

    it("should return 400 when keyword is blank", async () => {
      req = buildReq({ params: { keyword: "   " } });

      await searchProductController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error in searching product",
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
    it("should accept a non-empty keyword and query db once", async () => {
      req = buildReq({ params: { keyword: "milk" } });
      const selectMock = jest.fn().mockResolvedValue([]);
      productModel.find = jest.fn().mockReturnValue({ select: selectMock });

      await searchProductController(req, res);

      // Output based check
      expect(res.json).toHaveBeenCalledWith([]);

      // Communication based check
      expect(productModel.find).toHaveBeenCalledTimes(1);
      expect(selectMock).toHaveBeenCalledWith("-photo");
    });
  });

  // ==========================================================
  // Edge Cases
  // ==========================================================
  describe("Edge Cases", () => {
    it("should treat keyword as case-insensitive", async () => {
      req = buildReq({ params: { keyword: "CHOCO" } });
      const selectMock = jest.fn().mockResolvedValue([]);
      productModel.find = jest.fn().mockReturnValue({ select: selectMock });

      await searchProductController(req, res);

      // Output based check
      expect(res.json).toHaveBeenCalledWith([]);

      // Communication based check
      expect(productModel.find).toHaveBeenCalledWith({
        $or: [
          { name: { $regex: "CHOCO", $options: "i" } },
          { description: { $regex: "CHOCO", $options: "i" } },
        ],
      });
    });

    it("should allow special characters in keyword", async () => {
      req = buildReq({ params: { keyword: "choco*" } });
      const selectMock = jest.fn().mockResolvedValue([]);
      productModel.find = jest.fn().mockReturnValue({ select: selectMock });

      await searchProductController(req, res);

      // Output based check
      expect(res.json).toHaveBeenCalledWith([]);

      // Communication based check
      expect(productModel.find).toHaveBeenCalledWith({
        $or: [
          { name: { $regex: "choco*", $options: "i" } },
          { description: { $regex: "choco*", $options: "i" } },
        ],
      });
    });
  });

  // ==========================================================
  // Error Handling
  // ==========================================================
  describe("Error Handling", () => {
    it("should return 400 when db throws error at select stage", async () => {
      req = buildReq({ params: { keyword: "choco" } });
      const selectMock = jest.fn().mockRejectedValue(new Error("DB error"));
      productModel.find = jest.fn().mockReturnValue({ select: selectMock });

      await searchProductController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error in searching product",
        })
      );

      expectStatusBeforeSend(res);

      // Communication based check
      expect(productModel.find).toHaveBeenCalledTimes(1);
      expect(selectMock).toHaveBeenCalledWith("-photo");
    });

    it("should return 400 when db throws find", async () => {
      req = buildReq({ params: { keyword: "choco" } });
      productModel.find = jest.fn(() => {
        throw new Error("find failed");
      });

      await searchProductController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error in searching product",
        })
      );

      expectStatusBeforeSend(res);

      // Communication based check
      expect(productModel.find).toHaveBeenCalledTimes(1);
    });
  });
});