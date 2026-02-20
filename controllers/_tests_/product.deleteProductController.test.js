import { buildReq, buildRes, expectStatusBeforeSend } from "./testUtils.js";
import productModel from "../../models/productModel.js";
import { deleteProductController } from "../productController.js";

jest.mock("../../models/productModel.js");

describe("deleteProductController", () => {
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
    it("should delete product successfully when pid exists and delete succeeds", async () => {
      req = buildReq({ params: { pid: "pid1" } });
      const selectMock = jest.fn().mockResolvedValue({ _id: "pid1" });
      productModel.findByIdAndDelete = jest.fn().mockReturnValue({
        select: selectMock,
      });

      await deleteProductController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Product deleted successfully",
      });

      const payload = res.send.mock.calls[0][0];
      expect(Object.keys(payload).sort()).toEqual(["message", "success"].sort());

      expectStatusBeforeSend(res);

      // Communication based check
      expect(productModel.findByIdAndDelete).toHaveBeenCalledTimes(1);
      expect(productModel.findByIdAndDelete).toHaveBeenCalledWith("pid1");
      expect(selectMock).toHaveBeenCalledWith("-photo");
    });
  });

  // ==========================================================
  // Input Validation - Invalid
  // ==========================================================
  describe("Input Validation - Invalid", () => {
    it("should return 400 when pid is missing", async () => {
      req = buildReq({ params: {} });

      await deleteProductController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Missing input required",
      });

      expectStatusBeforeSend(res);

      // Communication based check
      expect(productModel.findByIdAndDelete).not.toHaveBeenCalled();
    });

    it("should return 400 when pid is blank", async () => {
      req = buildReq({ params: { pid: "   " } });

      await deleteProductController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Missing input required",
      });

      expectStatusBeforeSend(res);

      // Communication based check
      expect(productModel.findByIdAndDelete).not.toHaveBeenCalled();
    });
  });

  // ==========================================================
  // Input Validation - Valid
  // ==========================================================
  describe("Input Validation - Valid", () => {
    it("should accept valid pid and call delete once", async () => {
      req = buildReq({ params: { pid: "pid2" } });
      const selectMock = jest.fn().mockResolvedValue({ _id: "pid2" });
      productModel.findByIdAndDelete = jest.fn().mockReturnValue({
        select: selectMock,
      });

      await deleteProductController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Product deleted successfully",
      });

      expectStatusBeforeSend(res);

      // Communication based check
      expect(productModel.findByIdAndDelete).toHaveBeenCalledWith("pid2");
      expect(productModel.findByIdAndDelete).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================
  // Edge Cases
  // ==========================================================
  describe("Edge Cases", () => {
    it("should always exclude photo field using select('-photo')", async () => {
      req = buildReq({ params: { pid: "pid3" } });

      const selectMock = jest.fn().mockResolvedValue({ _id: "pid3" });
      productModel.findByIdAndDelete = jest.fn().mockReturnValue({
        select: selectMock,
      });

      await deleteProductController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(200);
      expectStatusBeforeSend(res);

      // Communication based check
      expect(selectMock).toHaveBeenCalledWith("-photo");
    });
  });

  // ==========================================================
  // Error Handling
  // ==========================================================
  describe("Error Handling", () => {
    it("should return 500 when db rejects delete", async () => {
      req = buildReq({ params: { pid: "pid1" } });
      const selectMock = jest.fn().mockRejectedValue(new Error("DB delete error"));
      productModel.findByIdAndDelete = jest.fn().mockReturnValue({
        select: selectMock,
      });

      await deleteProductController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error while deleting product",
        })
      );

      expectStatusBeforeSend(res);

      // Communication based check
      expect(productModel.findByIdAndDelete).toHaveBeenCalledWith("pid1");
      expect(selectMock).toHaveBeenCalledWith("-photo");
    });

    it("should return 500 when db throws findByIdAndDelete", async () => {
      req = buildReq({ params: { pid: "pid1" } });
      productModel.findByIdAndDelete = jest.fn(() => {
        throw new Error("findByIdAndDelete failed");
      });

      await deleteProductController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error while deleting product",
        })
      );

      expectStatusBeforeSend(res);

      // Communication based check
      expect(productModel.findByIdAndDelete).toHaveBeenCalledTimes(1);
    });
  });
});