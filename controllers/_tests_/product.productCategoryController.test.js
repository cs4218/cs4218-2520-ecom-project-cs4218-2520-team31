import { productCategoryController } from "../productController.js";
import productModel from "../../models/productModel.js";
import categoryModel from "../../models/categoryModel.js";
import { mockRes, silenceConsole } from "./utils.js";

jest.mock("../../models/productModel.js");
jest.mock("../../models/categoryModel.js");

describe("productCategoryController", () => {
  let restoreConsole;

  beforeEach(() => {
    jest.clearAllMocks();
    restoreConsole = silenceConsole();
  });

  afterEach(() => restoreConsole());

  it("returns 200 with category and products for slug", async () => {
    const req = { params: { slug: "phones" } };
    const res = mockRes();

    const categoryDoc = { _id: "c1", slug: "phones", name: "Phones" };
    categoryModel.findOne.mockResolvedValue(categoryDoc);

    const populateMock = jest.fn().mockResolvedValue([{ _id: "p1", name: "iPhone 15" }]);
    productModel.find.mockReturnValue({ populate: populateMock });

    await productCategoryController(req, res);

    expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: "phones" });
    expect(productModel.find).toHaveBeenCalledWith({ category: categoryDoc });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        category: expect.objectContaining({ slug: "phones" }),
        products: expect.any(Array),
      })
    );
  });

  it("returns 200 with empty products when category has no products", async () => {
    const req = { params: { slug: "phones" } };
    const res = mockRes();

    const categoryDoc = { _id: "c1", slug: "phones", name: "Phones" };
    categoryModel.findOne.mockResolvedValue(categoryDoc);

    const populateMock = jest.fn().mockResolvedValue([]);
    productModel.find.mockReturnValue({ populate: populateMock });

    await productCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        category: expect.objectContaining({ name: "Phones" }),
        products: [],
      })
    );
  });

  it("calls populate('category') when fetching category products", async () => {
    const req = { params: { slug: "phones" } };
    const res = mockRes();

    const categoryDoc = { _id: "c1", slug: "phones", name: "Phones" };
    categoryModel.findOne.mockResolvedValue(categoryDoc);

    const populateMock = jest.fn().mockResolvedValue([]);
    productModel.find.mockReturnValue({ populate: populateMock });

    await productCategoryController(req, res);

    expect(populateMock).toHaveBeenCalledWith("category");
  });

  it("returns 400 if product lookup fails after category found", async () => {
    const req = { params: { slug: "phones" } };
    const res = mockRes();

    const categoryDoc = { _id: "c1", slug: "phones", name: "Phones" };
    categoryModel.findOne.mockResolvedValue(categoryDoc);

    const populateMock = jest.fn().mockRejectedValue(new Error("DB fail"));
    productModel.find.mockReturnValue({ populate: populateMock });

    await productCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Error While Getting products",
      })
    );
  });

  it("returns 200 even if category slug not found (products result still returned)", async () => {
    const req = { params: { slug: "nonexistent" } };
    const res = mockRes();

    categoryModel.findOne.mockResolvedValue(null);

    const populateMock = jest.fn().mockResolvedValue([]);
    productModel.find.mockReturnValue({ populate: populateMock });

    await productCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        category: null,
        products: expect.any(Array),
      })
    );
  });

  it("returns 400 on category lookup error", async () => {
    const req = { params: { slug: "phones" } };
    const res = mockRes();

    categoryModel.findOne.mockRejectedValue(new Error("DB fail"));

    await productCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Error While Getting products",
      })
    );
  });
});
