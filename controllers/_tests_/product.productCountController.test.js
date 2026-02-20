import { buildReq, buildRes, expectStatusBeforeSend } from "./testUtils.js";
import productModel from "../../models/productModel.js";
import { productCountController } from "../productController.js";

jest.mock("../../models/productModel.js");

describe("productCountController", () => {
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
    it("should return total product count when query succeeds", async () => {
      req = buildReq();
      const estimatedMock = jest.fn().mockResolvedValue(123);
      productModel.find = jest.fn().mockReturnValue({
        estimatedDocumentCount: estimatedMock,
      });

      await productCountController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        total: 123,
      });
      const payload = res.send.mock.calls[0][0];
      expect(Object.keys(payload).sort()).toEqual(["success", "total"].sort());

      expectStatusBeforeSend(res);

      // Communication based check
      expect(productModel.find).toHaveBeenCalledTimes(1);
      expect(productModel.find).toHaveBeenCalledWith({});
      expect(estimatedMock).toHaveBeenCalledTimes(1);
    });

    it("should return 0 when estimatedDocumentCount returns 0", async () => {
      req = buildReq();
      const estimatedMock = jest.fn().mockResolvedValue(0);
      productModel.find = jest.fn().mockReturnValue({
        estimatedDocumentCount: estimatedMock,
      });
      await productCountController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        total: 0,
      });

      expectStatusBeforeSend(res);

      // Communication based check
      expect(productModel.find).toHaveBeenCalledTimes(1);
      expect(productModel.find).toHaveBeenCalledWith({});
      expect(estimatedMock).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================
  // Input Validation - Invalid
  // ==========================================================
  describe("Input Validation - Invalid", () => {
    it("should ignore request input and return count as 0", async () => {
      req = buildReq({ body: { random: "random" }, params: { id: "randomid" } });
      const estimatedMock = jest.fn().mockResolvedValue(5);
      productModel.find = jest.fn().mockReturnValue({
        estimatedDocumentCount: estimatedMock,
      });

      await productCountController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        total: 5,
      });

      expectStatusBeforeSend(res);

      // Communication based check
      expect(productModel.find).toHaveBeenCalledWith({});
      expect(estimatedMock).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================
  // Edge Cases
  // ==========================================================
  describe("Edge Cases", () => {
    it("should handle large counts", async () => {
      req = buildReq();
      const estimatedMock = jest.fn().mockResolvedValue(999999);
      productModel.find = jest.fn().mockReturnValue({
        estimatedDocumentCount: estimatedMock,
      });

      await productCountController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        total: 999999,
      });

      expectStatusBeforeSend(res);

      // Communication based check
      expect(productModel.find).toHaveBeenCalledWith({});
      expect(estimatedMock).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================
  // Error Handling
  // ==========================================================
  describe("Error Handling", () => {
    it("should return 400 when estimatedDocumentCount throws error", async () => {
      req = buildReq();
      const estimatedMock = jest.fn().mockRejectedValue(new Error("DB error"));
      productModel.find = jest.fn().mockReturnValue({
        estimatedDocumentCount: estimatedMock,
      });

      await productCountController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error in product count",
        })
      );

      expectStatusBeforeSend(res);

      // Communication based check
      expect(productModel.find).toHaveBeenCalledWith({});
      expect(estimatedMock).toHaveBeenCalledTimes(1);
    });

    it("should return 400 when db throws find", async () => {
      req = buildReq();
      productModel.find = jest.fn(() => {
        throw new Error("find failed");
      });

      await productCountController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error in product count",
        })
      );

      expectStatusBeforeSend(res);

      // Communication based check
      expect(productModel.find).toHaveBeenCalledTimes(1);
    });
  });
});