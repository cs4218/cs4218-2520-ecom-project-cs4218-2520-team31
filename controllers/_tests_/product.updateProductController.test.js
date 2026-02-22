// Amanda Quek Yan Ling, A0277779Y
process.env.BRAINTREE_MERCHANT_ID = "dummy";
process.env.BRAINTREE_PUBLIC_KEY = "dummy";
process.env.BRAINTREE_PRIVATE_KEY = "dummy";

jest.mock("braintree", () => ({
  Environment: { Sandbox: {} },
  BraintreeGateway: jest.fn(() => ({
    clientToken: { generate: jest.fn() },
    transaction: { sale: jest.fn() },
  })),
}));

jest.mock("../../models/productModel.js");
jest.mock("fs");
jest.mock("slugify");

import { updateProductController } from "../productController.js";
import productModel from "../../models/productModel.js";
import { buildReq, buildRes, expectStatusBeforeSend } from "./testUtils.js";
import fs from "fs";
import slugify from "slugify";

describe("updateProductController", () => {
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
    it("should update product and attach photo when valid photo provided", async () => {
      req = buildReq({
        params: { pid: "pid2" },
        fields: {
          name: "Photo Product",
          description: "Desc",
          price: 10,
          category: "cat1",
          quantity: 1,
          shipping: false,
        },
        files: {
          photo: {
            path: "/fake/path.jpg",
            type: "image/jpeg",
            size: 200000,
          },
        },
      });
      slugify.mockReturnValue("photo-product");
      const saveMock = jest.fn().mockResolvedValue(true);
      const updatedDoc = {
        _id: "pid2",
        name: "Photo Product",
        photo: { data: null, contentType: null },
        save: saveMock,
      };
      productModel.findByIdAndUpdate = jest.fn().mockResolvedValue(updatedDoc);
      fs.readFileSync.mockReturnValue(Buffer.from("img-bytes"));

      await updateProductController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Product Updated Successfully",
        products: updatedDoc,
      });

      expectStatusBeforeSend(res);

      // State based check
      expect(updatedDoc.photo.data).toEqual(Buffer.from("img-bytes"));
      expect(updatedDoc.photo.contentType).toBe("image/jpeg");

      // Communication based check
      expect(productModel.findByIdAndUpdate).toHaveBeenCalledTimes(1);
      expect(fs.readFileSync).toHaveBeenCalledWith("/fake/path.jpg");
      expect(updatedDoc.photo.data).toEqual(Buffer.from("img-bytes"));
      expect(updatedDoc.photo.contentType).toBe("image/jpeg");
      expect(saveMock).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================
  // Input Validation - Invalid
  // ==========================================================
  describe("Input Validation - Invalid", () => {
    it("should return 500 when name is missing", async () => {
      req = buildReq({
        params: { pid: "pid1" },
        fields: {
          name: "",
          description: "Desc",
          price: 10,
          category: "cat1",
          quantity: 1,
        },
        files: {
          photo: {
            path: "/fake/x.jpg",
            type: "image/jpeg",
            size: 1000
          },
        },
      });

      await updateProductController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ error: "Name is Required" });

      expectStatusBeforeSend(res);

      // Communication based check
      expect(productModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should return 500 when description is missing", async () => {
      req = buildReq({
        params: { pid: "pid1" },
        fields: {
          name: "X",
          description: "",
          price: 10,
          category: "cat1",
          quantity: 1,
        },
        files: {
          photo: {
            path: "/fake/x.jpg",
            type: "image/jpeg",
            size: 1000
          },
        },
      });

      await updateProductController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ error: "Description is Required" });

      expectStatusBeforeSend(res);

      // Communication based check
      expect(productModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should return 500 when price is missing", async () => {
      req = buildReq({
        params: { pid: "pid1" },
        fields: {
          name: "X",
          description: "Desc",
          price: "",
          category: "cat1",
          quantity: 1,
        },
        files: {
          photo: {
            path: "/fake/x.jpg",
            type: "image/jpeg",
            size: 1000
          },
        },
      });

      await updateProductController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ error: "Price is Required" });

      expectStatusBeforeSend(res);

      // Communication based check
      expect(productModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should return 500 when category is missing", async () => {
      req = buildReq({
        params: { pid: "pid1" },
        fields: {
          name: "X",
          description: "Desc",
          price: 10,
          category: "",
          quantity: 1,
        },
        files: {
          photo: {
            path: "/fake/x.jpg",
            type: "image/jpeg",
            size: 1000
          },
        },
      });

      await updateProductController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ error: "Category is Required" });

      expectStatusBeforeSend(res);

      // Communication based check
      expect(productModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should return 500 when quantity is missing", async () => {
      req = buildReq({
        params: { pid: "pid1" },
        fields: {
          name: "X",
          description: "Desc",
          price: 10,
          category: "cat1",
          quantity: "",
        },
        files: {
          photo: {
            path: "/fake/x.jpg",
            type: "image/jpeg",
            size: 1000
          },
        },
      });

      await updateProductController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ error: "Quantity is Required" });

      expectStatusBeforeSend(res);

      // Communication based check
      expect(productModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should return 500 when photo is missing", async () => {
      req = buildReq({
        params: { pid: "pid1" },
        fields: {
          name: "X",
          description: "Desc",
          price: 10,
          category: "cat1",
          quantity: 1,
        },
        files: {},
      });

      await updateProductController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ error: "Photo is Required" });

      expectStatusBeforeSend(res);

      // Communication based check
      expect(productModel.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(fs.readFileSync).not.toHaveBeenCalled();
      expect(slugify).not.toHaveBeenCalled();
    });

    it("should return 500 when photo size exceeds 1MB", async () => {
      req = buildReq({
        params: { pid: "pid1" },
        fields: {
          name: "X",
          description: "Desc",
          price: 10,
          category: "cat1",
          quantity: 1,
        },
        files: {
          photo: {
            path: "/fake/large.jpg",
            type: "image/jpeg",
            size: 1000001,
          },
        },
      });

      await updateProductController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        error: "Photo should be less then 1MB",
      });

      expectStatusBeforeSend(res);

      // Communication based check
      expect(productModel.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(fs.readFileSync).not.toHaveBeenCalled();
    });
  });

  // ==========================================================
  // Input Validation - Valid
  // ==========================================================
  describe("Input Validation - Valid", () => {
    it("should accept photo size exactly 1MB", async () => {
      req = buildReq({
        params: { pid: "pid9" },
        fields: {
          name: "Valid",
          description: "Desc",
          price: 10,
          category: "cat1",
          quantity: 1,
        },
        files: {
          photo: {
            path: "/fake/exact.jpg",
            type: "image/jpeg",
            size: 1000000,
          },
        },
      });
      slugify.mockReturnValue("valid");
      const saveMock = jest.fn().mockResolvedValue(true);
      const updatedDoc = { _id: "pid9", photo: {}, save: saveMock };
      productModel.findByIdAndUpdate = jest.fn().mockResolvedValue(updatedDoc);
      fs.readFileSync.mockReturnValue(Buffer.from("ok"));

      await updateProductController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Product Updated Successfully",
        products: updatedDoc,
      });

      expectStatusBeforeSend(res);

      // State based check
      expect(updatedDoc.photo.data).toEqual(Buffer.from("ok"));
      expect(updatedDoc.photo.contentType).toBe("image/jpeg");

      // Communication based check
      expect(fs.readFileSync).toHaveBeenCalledWith("/fake/exact.jpg");
      expect(saveMock).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================
  // Error Handling
  // ==========================================================
  describe("Error Handling", () => {
    it("should return 500 when db throws error", async () => {
      req = buildReq({
        params: { pid: "pid1" },
        fields: {
          name: "X",
          description: "Desc",
          price: 10,
          category: "cat1",
          quantity: 1,
        },
        files: {
          photo: {
            path: "/fake/x.jpg",
            type: "image/jpeg",
            size: 1000
          },
        },
      });
      productModel.findByIdAndUpdate = jest
        .fn()
        .mockRejectedValue(new Error("DB error"));

      await updateProductController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error in updating product",
        })
      );

      expectStatusBeforeSend(res);
    });

    it("should return 500 when db throws findByIdAndUpdate", async () => {
      req = buildReq({
        params: { pid: "pid1" },
        fields: {
          name: "X",
          description: "Desc",
          price: 10,
          category: "cat1",
          quantity: 1,
        },
        files: {
          photo: {
            path: "/fake/x.jpg",
            type: "image/jpeg",
            size: 1000
          },
        },
      });
      productModel.findByIdAndUpdate = jest.fn(() => {
        throw new Error("findByIdAndUpdate failed");
      });

      await updateProductController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error in updating product",
        })
      );

      expectStatusBeforeSend(res);
    });

    it("should return 500 when db throws save", async () => {
      req = buildReq({
        params: { pid: "pid1" },
        fields: {
          name: "X",
          description: "Desc",
          price: 10,
          category: "cat1",
          quantity: 1,
        },
        files: {
          photo: {
            path: "/fake/x.jpg",
            type: "image/jpeg",
            size: 1000
          },
        },
      });
      slugify.mockReturnValue("x");
      const saveMock = jest.fn().mockRejectedValue(new Error("save failed"));
      const updatedDoc = { _id: "pid1", photo: {}, save: saveMock };

      productModel.findByIdAndUpdate = jest.fn().mockResolvedValue(updatedDoc);

      await updateProductController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error in updating product",
        })
      );

      expectStatusBeforeSend(res);
    });
  });
});