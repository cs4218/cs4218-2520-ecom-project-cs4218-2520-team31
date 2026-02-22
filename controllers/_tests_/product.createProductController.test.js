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

import { createProductController } from "../productController.js";
import productModel from "../../models/productModel.js";
import { buildReq, buildRes, expectStatusBeforeSend } from "./testUtils.js";
import fs from "fs";
import slugify from "slugify";

describe("createProductController", () => {
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
    it("should create product successfully when valid fields and photo are provided", async () => {
      req = buildReq({
        fields: {
          name: "New Product",
          description: "New Description",
          price: 100,
          category: "cat1",
          quantity: 10,
          shipping: true,
        },
        files: {
          photo: {
            path: "/fake/path.jpg",
            type: "image/jpeg",
            size: 200000,
          },
        },
      });
      slugify.mockReturnValue("new-product");
      fs.readFileSync.mockReturnValue(Buffer.from("img-bytes"));
      const saveMock = jest.fn().mockResolvedValue(true);
      const createdDoc = {
        _id: "pid1",
        name: "New Product",
        slug: "new-product",
        photo: { data: null, contentType: null },
        save: saveMock,
      };

      productModel.mockImplementation(() => createdDoc);

      await createProductController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Product Created Successfully",
        products: createdDoc,
      });
      const payload = res.send.mock.calls[0][0];
      expect(Object.keys(payload).sort()).toEqual(
        ["message", "products", "success"].sort()
      );

      expectStatusBeforeSend(res);

      // State based check
      expect(createdDoc.photo.data).toEqual(Buffer.from("img-bytes"));
      expect(createdDoc.photo.contentType).toBe("image/jpeg");

      // Communication based check
      expect(slugify).toHaveBeenCalledWith("New Product");
      expect(productModel).toHaveBeenCalledTimes(1);
      expect(productModel).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "New Product",
          description: "New Description",
          price: 100,
          category: "cat1",
          quantity: 10,
          shipping: true,
          slug: "new-product",
        })
      );
      expect(fs.readFileSync).toHaveBeenCalledWith("/fake/path.jpg");
      expect(saveMock).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================
  // Input Validation - Invalid
  // ==========================================================
  describe("Input Validation - Invalid", () => {
    it("should return 500 when name is missing", async () => {
      req = buildReq({
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

      await createProductController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ error: "Name is Required" });

      expectStatusBeforeSend(res);

      // Communication based check
      expect(productModel).not.toHaveBeenCalled();
      expect(fs.readFileSync).not.toHaveBeenCalled();
      expect(slugify).not.toHaveBeenCalled();
    });

    it("should return 500 when description is missing", async () => {
      req = buildReq({
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

      await createProductController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ error: "Description is Required" });

      expectStatusBeforeSend(res);

      // Communication based check
      expect(productModel).not.toHaveBeenCalled();
    });

    it("should return 500 when price is missing", async () => {
      req = buildReq({
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

      await createProductController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ error: "Price is Required" });

      expectStatusBeforeSend(res);

      // Communication based check
      expect(productModel).not.toHaveBeenCalled();
    });

    it("should return 500 when category is missing", async () => {
      req = buildReq({
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

      await createProductController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ error: "Category is Required" });

      expectStatusBeforeSend(res);

      // Communication based check
      expect(productModel).not.toHaveBeenCalled();
    });

    it("should return 500 when quantity is missing", async () => {
      req = buildReq({
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

      await createProductController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ error: "Quantity is Required" });

      expectStatusBeforeSend(res);

      // Communication based check
      expect(productModel).not.toHaveBeenCalled();
    });

    it("should return 500 when photo is missing", async () => {
      req = buildReq({
        fields: {
          name: "X",
          description: "Desc",
          price: 10,
          category: "cat1",
          quantity: 1,
        },
        files: {},
      });

      await createProductController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        error: "Photo is Required",
      });

      expectStatusBeforeSend(res);

      // Communication based check
      expect(productModel).not.toHaveBeenCalled();
      expect(fs.readFileSync).not.toHaveBeenCalled();
      expect(slugify).not.toHaveBeenCalled();
    });

    it("should return 500 when photo size exceeds 1MB", async () => {
      req = buildReq({
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

      await createProductController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        error: "Photo should be less than 1MB",
      });

      expectStatusBeforeSend(res);

      // Communication based check
      expect(productModel).not.toHaveBeenCalled();
      expect(fs.readFileSync).not.toHaveBeenCalled();
    });
  });

  // ==========================================================
  // Input Validation - Valid
  // ==========================================================
  describe("Input Validation - Valid", () => {
    it("should accept photo size exactly 1MB", async () => {
      req = buildReq({
        fields: {
          name: "Exact",
          description: "Desc",
          price: 10,
          category: "cat1",
          quantity: 1,
          shipping: false,
        },
        files: {
          photo: {
            path: "/fake/exact.jpg",
            type: "image/jpeg",
            size: 1000000,
          },
        },
      });

      slugify.mockReturnValue("exact");
      fs.readFileSync.mockReturnValue(Buffer.from("ok"));

      const saveMock = jest.fn().mockResolvedValue(true);
      const createdDoc = {
        _id: "pid9",
        photo: { data: null, contentType: null },
        save: saveMock,
      };
      productModel.mockImplementation(() => createdDoc);

      await createProductController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Product Created Successfully",
        products: createdDoc,
      });

      expectStatusBeforeSend(res);

      // State based check
      expect(createdDoc.photo.data).toEqual(Buffer.from("ok"));
      expect(createdDoc.photo.contentType).toBe("image/jpeg");

      // Communication based check
      expect(fs.readFileSync).toHaveBeenCalledWith("/fake/exact.jpg");
      expect(saveMock).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================
  // Error Handling
  // ==========================================================
  describe("Error Handling", () => {
    it("should return 500 when db throws save", async () => {
      req = buildReq({
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
      fs.readFileSync.mockReturnValue(Buffer.from("img"));

      const saveMock = jest.fn().mockRejectedValue(new Error("save failed"));
      const createdDoc = { photo: {}, save: saveMock };
      productModel.mockImplementation(() => createdDoc);

      await createProductController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error in creating product",
        })
      );

      expectStatusBeforeSend(res);

      // Communication based check
      expect(saveMock).toHaveBeenCalledTimes(1);
    });

    it("should return 500 when productModel constructor fails", async () => {
      req = buildReq({
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
      productModel.mockImplementation(() => {
        throw new Error("constructor failed");
      });

      await createProductController(req, res);

      // Output based check
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error in creating product",
        })
      );

      expectStatusBeforeSend(res);
    });
  });
});