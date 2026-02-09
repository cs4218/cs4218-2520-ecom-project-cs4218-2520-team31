import { realtedProductController } from "../productController.js";
import productModel from "../../models/productModel.js";
import { mockRes, silenceConsole } from "./utils.js";

jest.mock("../../models/productModel.js");

describe("realtedProductController", () => {
  let restoreConsole;

  beforeEach(() => {
    jest.clearAllMocks();
    restoreConsole = silenceConsole();
  });

  afterEach(() => restoreConsole());

  it("returns 200 with related products", async () => {
    const req = { params: { pid: "p1", cid: "c1" } };
    const res = mockRes();

    const exec = jest.fn().mockResolvedValue([{ _id: "p2", name: "Samsung S24" }]);

    productModel.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          populate: exec,
        }),
      }),
    });

    await realtedProductController(req, res);

    expect(productModel.find).toHaveBeenCalledWith({
      category: "c1",
      _id: { $ne: "p1" },
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        products: expect.any(Array),
      })
    );
  });

  it("returns 400 on error", async () => {
    const req = { params: { pid: "p1", cid: "c1" } };
    const res = mockRes();

    productModel.find.mockImplementation(() => {
      throw new Error("DB fail");
    });

    await realtedProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "error while geting related product",
      })
    );
  });
});
