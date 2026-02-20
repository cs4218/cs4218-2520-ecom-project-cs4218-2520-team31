import { buildReq, buildRes, expectStatusBeforeSend } from "./testUtils.js";
import productModel from "../../models/productModel.js";
import { productPhotoController } from "../productController.js";

jest.mock("../../models/productModel.js");

//Amanda Quek Yan Ling, A0277779Y
describe("productPhotoController", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = buildReq();
    res = buildRes();
    res.set = jest.fn().mockReturnThis();
  });

  // ==========================================================
  // Main Flow
  // ==========================================================
  describe("Main Flow", () => {
    it("should return photo when pid is valid and photo exists", async () => {
      req = buildReq({ params: { pid: "pid1" } });
      const buffer = Buffer.from("photo-bytes");
      const mockProduct = {
        photo: {
          data: buffer,
          contentType: "image/jpeg",
        },
      };
      const selectMock = jest.fn().mockResolvedValue(mockProduct);
      productModel.findById.mockReturnValue({ select: selectMock });

      await productPhotoController(req, res);

      // Output based check
      expect(res.set).toHaveBeenCalledWith("Content-type", "image/jpeg");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(buffer);

      expectStatusBeforeSend(res);

      // Communication-Based Check
      expect(productModel.findById).toHaveBeenCalledWith("pid1");
      expect(selectMock).toHaveBeenCalledWith("photo");
    });
  });

  // ==========================================================
  // Input Validation - Invalid
  // ==========================================================
  describe("Input Validation - Invalid", () => {
    it("should return 400 when pid is missing", async () => {
      req = buildReq({ params: {} });

      await productPhotoController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Missing input required",
      });

      expectStatusBeforeSend(res);

      expect(productModel.findById).not.toHaveBeenCalled();
    });

    it("should return 400 when pid is blank", async () => {
      req = buildReq({ params: { pid: "   " } });

      await productPhotoController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Missing input required",
      });

      expectStatusBeforeSend(res);

      // Communication-Based Check
      expect(productModel.findById).not.toHaveBeenCalled();
    });
  });

  // ==========================================================
  // Input Validation - Valid
  // ==========================================================
  describe("Input Validation - Valid", () => {
    it("should accept valid pid and query database", async () => {
      req = buildReq({ params: { pid: "valid-pid" } });

      const buffer = Buffer.from("x");
      const mockProduct = {
        photo: { data: buffer, contentType: "image/png" },
      };

      const selectMock = jest.fn().mockResolvedValue(mockProduct);
      productModel.findById.mockReturnValue({ select: selectMock });

      await productPhotoController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(buffer);

      expectStatusBeforeSend(res);

      // Communication-Based Check
      expect(productModel.findById).toHaveBeenCalledWith("valid-pid");
    });
  });

  // ==========================================================
  // Edge Cases
  // ==========================================================
  describe("Edge Cases", () => {
    it("should not send response when photo is null", async () => {
      req = buildReq({ params: { pid: "no-photo" } });

      const mockProduct = {
        photo: { data: null, contentType: "image/jpeg" },
      };

      const selectMock = jest.fn().mockResolvedValue(mockProduct);
      productModel.findById.mockReturnValue({ select: selectMock });

      await productPhotoController(req, res);

      // Output based check
      expect(res.status).not.toHaveBeenCalled();
      expect(res.send).not.toHaveBeenCalled();

      // Communication-Based Check
      expect(productModel.findById).toHaveBeenCalledWith("no-photo");
    });

    it("should return 500 when product is null", async () => {
      req = buildReq({ params: { pid: "not-found" } });

      const selectMock = jest.fn().mockResolvedValue(null);
      productModel.findById.mockReturnValue({ select: selectMock });

      await productPhotoController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error while getting photo",
        })
      );

      expectStatusBeforeSend(res);
    });
  });

  // ==========================================================
  // Error Handling
  // ==========================================================
  describe("Error Handling", () => {
    it("should return 500 when db throws error", async () => {
      req = buildReq({ params: { pid: "pid1" } });

      const selectMock = jest.fn().mockRejectedValue(new Error("DB error"));
      productModel.findById.mockReturnValue({ select: selectMock });

      await productPhotoController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error while getting photo",
        })
      );

      expectStatusBeforeSend(res);
    });

    it("should return 500 when db throws findById", async () => {
      req = buildReq({ params: { pid: "pid1" } });

      productModel.findById.mockImplementation(() => {
        throw new Error("findById failed");
      });

      await productPhotoController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error while getting photo",
        })
      );

      expectStatusBeforeSend(res);
    });
  });
});