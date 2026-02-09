import { productPhotoController } from "../productController.js";
import productModel from "../../models/productModel.js";
import { mockRes, silenceConsole } from "./utils.js";

jest.mock("../../models/productModel.js");

describe("productPhotoController", () => {
  let restoreConsole;

  beforeEach(() => {
    jest.clearAllMocks();
    restoreConsole = silenceConsole();
  });

  afterEach(() => restoreConsole());

  it("returns 200 with image buffer + sets content-type if photo exists", async () => {
    const req = { params: { pid: "p1" } };
    const res = mockRes();

    const photoBuffer = Buffer.from("fakeimage");
    const exec = jest.fn().mockResolvedValue({
      photo: { data: photoBuffer, contentType: "image/png" },
    });

    productModel.findById.mockReturnValue({ select: exec });

    await productPhotoController(req, res);

    expect(productModel.findById).toHaveBeenCalledWith("p1");
    expect(res.set).toHaveBeenCalledWith("Content-type", "image/png");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(photoBuffer);
  });

  it("does not send photo if photo.data is missing", async () => {
    const req = { params: { pid: "p1" } };
    const res = mockRes();

    const exec = jest.fn().mockResolvedValue({
      photo: { data: null, contentType: "image/png" },
    });

    productModel.findById.mockReturnValue({ select: exec });

    await productPhotoController(req, res);

    expect(res.status).not.toHaveBeenCalledWith(200);
    expect(res.send).not.toHaveBeenCalled();
  });

  it("returns 500 on error", async () => {
    const req = { params: { pid: "p1" } };
    const res = mockRes();

    productModel.findById.mockImplementation(() => {
      throw new Error("DB fail");
    });

    await productPhotoController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Erorr while getting photo",
      })
    );
  });
});
