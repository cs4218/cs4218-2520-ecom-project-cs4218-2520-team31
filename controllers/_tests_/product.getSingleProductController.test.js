import { getSingleProductController } from "../productController.js";
import productModel from "../../models/productModel.js";
import { mockRes, silenceConsole } from "./utils.js";

jest.mock("../../models/productModel.js");

describe("getSingleProductController", () => {
  let restoreConsole;

  beforeEach(() => {
    jest.clearAllMocks();
    restoreConsole = silenceConsole();
  });

  afterEach(() => restoreConsole());

  it("returns 200 with product when slug exists", async () => {
    const req = { params: { slug: "iphone-15" } };
    const res = mockRes();

    const exec = jest.fn().mockResolvedValue({
      _id: "p1",
      slug: "iphone-15",
      name: "iPhone 15",
      category: { _id: "c1", name: "Phones" },
    });

    productModel.findOne.mockReturnValue({
      select: jest.fn().mockReturnValue({
        populate: exec,
      }),
    });

    await getSingleProductController(req, res);

    expect(productModel.findOne).toHaveBeenCalledWith({ slug: "iphone-15" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Single Product Fetched",
        product: expect.objectContaining({ slug: "iphone-15" }),
      })
    );
  });

  it("returns 500 on model error", async () => {
    const req = { params: { slug: "iphone-15" } };
    const res = mockRes();

    productModel.findOne.mockImplementation(() => {
      throw new Error("DB fail");
    });

    await getSingleProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Eror while getitng single product",
      })
    );
  });
});
