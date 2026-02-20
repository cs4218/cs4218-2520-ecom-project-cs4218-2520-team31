import { buildReq, buildRes, expectStatusBeforeSend } from "./testUtils.js";
import productModel from "../../models/productModel.js";
import { productFiltersController } from "../productController.js";

jest.mock("../../models/productModel.js");

describe("productFiltersController", () => {
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
    it("should return filtered products when checked and radio are provided", async () => {
      req = buildReq({
        body: {
          checked: ["cat1", "cat2"],
          radio: [10, 50],
        },
      });
      const mockProducts = [{ _id: "pid1" }, { _id: "pid2" }];
      productModel.find.mockResolvedValue(mockProducts);

      await productFiltersController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: mockProducts,
      });
      const payload = res.send.mock.calls[0][0];
      expect(Object.keys(payload).sort()).toEqual(["products", "success"].sort());

      expectStatusBeforeSend(res);

      // Communication-Based Check
      expect(productModel.find).toHaveBeenCalledTimes(1);
      expect(productModel.find).toHaveBeenCalledWith({
        category: ["cat1", "cat2"],
        price: { $gte: 10, $lte: 50 },
      });
    });

    it("should return all products when checked is empty and radio is empty", async () => {
      req = buildReq({
        body: {
          checked: [],
          radio: [],
        },
      });
      const mockProducts = [{ _id: "pid1" }];
      productModel.find.mockResolvedValue(mockProducts);

      await productFiltersController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: mockProducts,
      });

      expectStatusBeforeSend(res);

      // Communication-Based Check
      expect(productModel.find).toHaveBeenCalledTimes(1);
      expect(productModel.find).toHaveBeenCalledWith({});
    });
  });

  // ==========================================================
  // Input Validation - Invalid
  // ==========================================================
  describe("Input Validation - Invalid", () => {
    it("should return 400 when checked is missing", async () => {
      req = buildReq({
        body: {
          radio: [10, 50],
        },
      });

      await productFiltersController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error while filtering products",
        })
      );

      expectStatusBeforeSend(res);

      // Communication-Based Check
      expect(productModel.find).not.toHaveBeenCalled();
    });

    it("should return 400 when radio is missing", async () => {
      req = buildReq({
        body: {
          checked: ["cat1"],
        },
      });

      await productFiltersController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error while filtering products",
        })
      );

      expectStatusBeforeSend(res);

      // Communication-Based Check
      expect(productModel.find).not.toHaveBeenCalled();
    });
  });

  // ==========================================================
  // Input Validation - Valid
  // ==========================================================
  describe("Input Validation - Valid", () => {
    it("should accept checked with filled values and empty radio", async () => {
      req = buildReq({
        body: {
          checked: ["cat1"],
          radio: [],
        },
      });

      const mockProducts = [{ _id: "p1" }];
      productModel.find.mockResolvedValue(mockProducts);

      await productFiltersController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: mockProducts,
      });

      expectStatusBeforeSend(res);

      // Communication-Based Check
      expect(productModel.find).toHaveBeenCalledWith({
        category: ["cat1"],
      });
    });

    it("should accept empty checked and radio with two values", async () => {
      req = buildReq({
        body: {
          checked: [],
          radio: [100, 200],
        },
      });

      const mockProducts = [{ _id: "pid2" }];
      productModel.find.mockResolvedValue(mockProducts);

      await productFiltersController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: mockProducts,
      });

      expectStatusBeforeSend(res);

      // Communication-Based Check
      expect(productModel.find).toHaveBeenCalledWith({
        price: { $gte: 100, $lte: 200 },
      });
    });
  });

  // ==========================================================
  // Edge Cases
  // ==========================================================
  describe("Edge Cases", () => {
    it("should ignore checked when checked length is 0", async () => {
      req = buildReq({
        body: {
          checked: [],
          radio: [1, 2],
        },
      });
      const mockProducts = [{ _id: "pid1" }];
      productModel.find.mockResolvedValue(mockProducts);

      await productFiltersController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: mockProducts,
      });

      expectStatusBeforeSend(res);

      // Communication-Based Check
      expect(productModel.find).toHaveBeenCalledWith({
        price: { $gte: 1, $lte: 2 },
      });
    });

    it("should treat radio values as provided when min > max", async () => {
      req = buildReq({
        body: {
          checked: ["cat1"],
          radio: [50, 10],
        },
      });
      const mockProducts = [];
      productModel.find.mockResolvedValue(mockProducts);

      await productFiltersController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: mockProducts,
      });

      expectStatusBeforeSend(res);

      // Communication-Based Check
      expect(productModel.find).toHaveBeenCalledWith({
        category: ["cat1"],
        price: { $gte: 50, $lte: 10 },
      });
    });
  });

  // ==========================================================
  // Error Handling
  // ==========================================================
  describe("Error Handling", () => {
    it("should return 400 when db throws error", async () => {
      req = buildReq({
        body: {
          checked: ["cat1"],
          radio: [10, 50],
        },
      });

      productModel.find.mockRejectedValue(new Error("DB error"));

      await productFiltersController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error while filtering products",
        })
      );

      expectStatusBeforeSend(res);
    });

    it("should return 400 when db throws find", async () => {
      req = buildReq({
        body: {
          checked: ["cat1"],
          radio: [10, 50],
        },
      });

      productModel.find.mockImplementation(() => {
        throw new Error("find failed");
      });

      await productFiltersController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error while filtering products",
        })
      );

      expectStatusBeforeSend(res);
    });
  });
});