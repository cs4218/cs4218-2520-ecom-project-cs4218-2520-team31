// Amanda Quek Yan Ling, A0277779Y
import { buildReq, buildRes, expectStatusBeforeSend } from "./testUtils.js";
import productModel from "../../models/productModel.js";
import { getProductController } from "../productController.js";

jest.mock("../../models/productModel.js");

describe("getProductController", () => {
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
    it("should return products successfully when query succeeds", async () => {
      req = buildReq();
      const mockProducts = [
        { _id: "pid1", name: "Product 1" },
        { _id: "pid2", name: "Product 2" },
      ];

      const sortMock = jest.fn().mockResolvedValue(mockProducts);
      const limitMock = jest.fn().mockReturnValue({ sort: sortMock });
      const selectMock = jest.fn().mockReturnValue({ limit: limitMock });
      const populateMock = jest.fn().mockReturnValue({ select: selectMock });
      productModel.find = jest.fn().mockReturnValue({ populate: populateMock });

      await getProductController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        counTotal: mockProducts.length,
        message: "All Products",
        products: mockProducts,
      });

      const payload = res.send.mock.calls[0][0];
      expect(Object.keys(payload).sort()).toEqual(
        ["counTotal", "message", "products", "success"].sort()
      );

      expectStatusBeforeSend(res);

      // Communication based check
      expect(productModel.find).toHaveBeenCalledTimes(1);
      expect(productModel.find).toHaveBeenCalledWith({});
      expect(populateMock).toHaveBeenCalledWith("category");
      expect(selectMock).toHaveBeenCalledWith("-photo");
      expect(limitMock).toHaveBeenCalledWith(12);
      expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
    });

    it("should return empty products when no products exist", async () => {
      req = buildReq();
      const mockProducts = [];

      const sortMock = jest.fn().mockResolvedValue(mockProducts);
      const limitMock = jest.fn().mockReturnValue({ sort: sortMock });
      const selectMock = jest.fn().mockReturnValue({ limit: limitMock });
      const populateMock = jest.fn().mockReturnValue({ select: selectMock });
      productModel.find = jest.fn().mockReturnValue({ populate: populateMock });

      await getProductController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        counTotal: 0,
        message: "All Products",
        products: [],
      });

      expectStatusBeforeSend(res);

      // Communication based check
      expect(productModel.find).toHaveBeenCalledWith({});
    });
  });

  // ==========================================================
  // Edge Cases
  // ==========================================================
  describe("Edge Cases", () => {
    it("should limit results to 12 products", async () => {
      req = buildReq();

      const sortMock = jest.fn().mockResolvedValue([]);
      const limitMock = jest.fn().mockReturnValue({ sort: sortMock });
      const selectMock = jest.fn().mockReturnValue({ limit: limitMock });
      const populateMock = jest.fn().mockReturnValue({ select: selectMock });
      productModel.find = jest.fn().mockReturnValue({ populate: populateMock });

      await getProductController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(200);
      expectStatusBeforeSend(res);

      // Communication based check
      expect(limitMock).toHaveBeenCalledWith(12);
    });

    it("should exclude photo field", async () => {
      req = buildReq();
      const sortMock = jest.fn().mockResolvedValue([]);
      const limitMock = jest.fn().mockReturnValue({ sort: sortMock });
      const selectMock = jest.fn().mockReturnValue({ limit: limitMock });
      const populateMock = jest.fn().mockReturnValue({ select: selectMock });
      productModel.find = jest.fn().mockReturnValue({ populate: populateMock });

      await getProductController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(200);
      expectStatusBeforeSend(res);

      // Communication based check
      expect(selectMock).toHaveBeenCalledWith("-photo");
    });

    it("should populate category field", async () => {
      req = buildReq();
      const sortMock = jest.fn().mockResolvedValue([]);
      const limitMock = jest.fn().mockReturnValue({ sort: sortMock });
      const selectMock = jest.fn().mockReturnValue({ limit: limitMock });
      const populateMock = jest.fn().mockReturnValue({ select: selectMock });
      productModel.find = jest.fn().mockReturnValue({ populate: populateMock });

      await getProductController(req, res);

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
    it("should return 500 when db throws error", async () => {
      req = buildReq();
      const sortMock = jest.fn().mockRejectedValue(new Error("DB error"));
      const limitMock = jest.fn().mockReturnValue({ sort: sortMock });
      const selectMock = jest.fn().mockReturnValue({ limit: limitMock });
      const populateMock = jest.fn().mockReturnValue({ select: selectMock });
      productModel.find = jest.fn().mockReturnValue({ populate: populateMock });

      await getProductController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error in getting products",
        })
      );

      expectStatusBeforeSend(res);
    });

    it("should return 500 when db throws find", async () => {
      req = buildReq();
      productModel.find = jest.fn(() => {
        throw new Error("find failed");
      });

      await getProductController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error in getting products",
        })
      );

      expectStatusBeforeSend(res);

      // Communication based check
      expect(productModel.find).toHaveBeenCalledTimes(1);
    });
  });
});