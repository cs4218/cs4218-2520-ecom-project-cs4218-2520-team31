// Amanda Quek Yan Ling, A0277779Y
import { buildReq, buildRes, expectStatusBeforeSend } from "./testUtils.js";
import productModel from "../../models/productModel.js";
import { productListController } from "../productController.js";

jest.mock("../../models/productModel.js");

describe("productListController", () => {
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
    it("should return first page of products when page params is empty", async () => {
      req = buildReq({ params: {} });
      const mockProducts = [{ _id: "pid1" }, { _id: "pid2" }];

      const sortMock = jest.fn().mockResolvedValue(mockProducts);
      const limitMock = jest.fn().mockReturnValue({ sort: sortMock });
      const skipMock = jest.fn().mockReturnValue({ limit: limitMock });
      const selectMock = jest.fn().mockReturnValue({ skip: skipMock });
      productModel.find = jest.fn().mockReturnValue({ select: selectMock });

      await productListController(req, res);

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
      expect(productModel.find).toHaveBeenCalledWith({});
      expect(selectMock).toHaveBeenCalledWith("-photo");
      expect(skipMock).toHaveBeenCalledWith(0);
      expect(limitMock).toHaveBeenCalledWith(6);
      expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
    });

    it("should return products for given page when page param is provided", async () => {
      req = buildReq({ params: { page: 3 } });
      const mockProducts = [{ _id: "pid10" }];

      const sortMock = jest.fn().mockResolvedValue(mockProducts);
      const limitMock = jest.fn().mockReturnValue({ sort: sortMock });
      const skipMock = jest.fn().mockReturnValue({ limit: limitMock });
      const selectMock = jest.fn().mockReturnValue({ skip: skipMock });
      productModel.find = jest.fn().mockReturnValue({ select: selectMock });

      await productListController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: mockProducts,
      });

      expectStatusBeforeSend(res);

      // Communication based check
      expect(selectMock).toHaveBeenCalledWith("-photo");
      expect(skipMock).toHaveBeenCalledWith((3 - 1) * 6);
      expect(limitMock).toHaveBeenCalledWith(6);
      expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
    });
  });

  // ==========================================================
  // Input Validation - Invalid
  // ==========================================================
  describe("Input Validation - Invalid", () => {
    it("should return 400 when page is blank", async () => {
      req = buildReq({ params: { page: "   " } });

      await productListController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error while fetching products per page",
        })
      );

      expectStatusBeforeSend(res);

      // Communication based check
      expect(productModel.find).not.toHaveBeenCalled();
    });

    it("should return 400 when page is non-numeric", async () => {
      req = buildReq({ params: { page: "abc" } });

      await productListController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error while fetching products per page",
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
    it("should accept numeric string page and paginate correctly", async () => {
      req = buildReq({ params: { page: "2" } });
      const mockProducts = [{ _id: "pid3" }];

      const sortMock = jest.fn().mockResolvedValue(mockProducts);
      const limitMock = jest.fn().mockReturnValue({ sort: sortMock });
      const skipMock = jest.fn().mockReturnValue({ limit: limitMock });
      const selectMock = jest.fn().mockReturnValue({ skip: skipMock });
      productModel.find = jest.fn().mockReturnValue({ select: selectMock });

      await productListController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: mockProducts,
      });

      expectStatusBeforeSend(res);

      // Communication based check
      expect(skipMock).toHaveBeenCalledWith((2 - 1) * 6);
    });
  });

  // ==========================================================
  // Edge Cases
  // ==========================================================
  describe("Edge Cases", () => {
    it("should treat page 0 as a negative skip and still call db", async () => {
      req = buildReq({ params: { page: 0 } });
      const mockProducts = [];

      const sortMock = jest.fn().mockResolvedValue(mockProducts);
      const limitMock = jest.fn().mockReturnValue({ sort: sortMock });
      const skipMock = jest.fn().mockReturnValue({ limit: limitMock });
      const selectMock = jest.fn().mockReturnValue({ skip: skipMock });
      productModel.find = jest.fn().mockReturnValue({ select: selectMock });

      await productListController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: mockProducts,
      });

      expectStatusBeforeSend(res);

      // Communication based check
      expect(skipMock).toHaveBeenCalledWith((0 - 1) * 6);
    });

    it("should handle large page numbers", async () => {
      req = buildReq({ params: { page: 999 } });
      const mockProducts = [];

      const sortMock = jest.fn().mockResolvedValue(mockProducts);
      const limitMock = jest.fn().mockReturnValue({ sort: sortMock });
      const skipMock = jest.fn().mockReturnValue({ limit: limitMock });
      const selectMock = jest.fn().mockReturnValue({ skip: skipMock });
      productModel.find = jest.fn().mockReturnValue({ select: selectMock });

      await productListController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: mockProducts,
      });

      expectStatusBeforeSend(res);

      // Communication based check
      expect(skipMock).toHaveBeenCalledWith((999 - 1) * 6);
    });
  });

  // ==========================================================
  // Error Handling
  // ==========================================================
  describe("Error Handling", () => {
    it("should return 400 when db rejects at sort stage", async () => {
      req = buildReq({ params: { page: 1 } });

      const sortMock = jest.fn().mockRejectedValue(new Error("DB error"));
      const limitMock = jest.fn().mockReturnValue({ sort: sortMock });
      const skipMock = jest.fn().mockReturnValue({ limit: limitMock });
      const selectMock = jest.fn().mockReturnValue({ skip: skipMock });
      productModel.find = jest.fn().mockReturnValue({ select: selectMock });

      await productListController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error while fetching products per page",
        })
      );

      expectStatusBeforeSend(res);

      // Communication based check
      expect(productModel.find).toHaveBeenCalledWith({});
      expect(selectMock).toHaveBeenCalledWith("-photo");
      expect(skipMock).toHaveBeenCalled();
      expect(limitMock).toHaveBeenCalledWith(6);
      expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
    });

    it("should return 400 when db throws find", async () => {
      req = buildReq({ params: { page: 1 } });
      productModel.find = jest.fn(() => {
        throw new Error("find failed");
      });

      await productListController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error while fetching products per page",
        })
      );

      expectStatusBeforeSend(res);

      // Communication based check
      expect(productModel.find).toHaveBeenCalledTimes(1);
    });
  });
});