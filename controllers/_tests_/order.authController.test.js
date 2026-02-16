import { getOrdersController } from "../authController.js";
import orderModel from "../../models/orderModel.js";
import { getAllOrdersController } from "../authController.js";

jest.mock("../../models/orderModel.js", () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
  },
}));

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("AuthController Component: User Order Retrieval Logic ", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should filter orders by authenticated user", async () => {
    // Arrange
    const req = { user: { _id: "user123" } };
    const res = makeRes();

    // Mock chain which resolves to []
    const query = { populate: jest.fn() };
    query.populate.mockReturnValueOnce(query);
    query.populate.mockResolvedValueOnce([]);

    orderModel.find.mockReturnValue(query);

    // Act
    await getOrdersController(req, res);

    // Assert
    expect(orderModel.find).toHaveBeenCalledWith({ buyer: "user123" });
  });

  it("should return orders in JSON response on successful retrieval in getOrdersController", async () => {
    // Arrange
    const req = { user: { _id: "user123" } };
    const res = makeRes();

    const mockOrders = [{ _id: "o1" }];

    // Mock chain which resolves to mockOrders
    const query = { populate: jest.fn() };
    query.populate.mockReturnValueOnce(query);
    query.populate.mockResolvedValueOnce(mockOrders);

    orderModel.find.mockReturnValue(query);

    // Act
    await getOrdersController(req, res);

    // Assert
    expect(res.json).toHaveBeenCalledWith(mockOrders);
  });

  it("should return orders in JSON response on successful retrieval in getAllOrdersController", async () => {
    // Arrange
    const req = {};
    const res = makeRes();

    const mockOrders = [{ _id: "o1" }];

    // Mock chain which resolves to mockOrders
    const query = { populate: jest.fn(), sort: jest.fn() };
    query.populate.mockReturnValueOnce(query);
    query.populate.mockReturnValueOnce(query);
    query.sort.mockResolvedValueOnce(mockOrders);

    orderModel.find.mockReturnValue(query);

    // Act
    await getAllOrdersController(req, res);

    // Assert
    expect(res.json).toHaveBeenCalledWith(mockOrders);
  });

  it("should handle database errors and return 500 response in getOrdersController", async () => {
    // Arrange
    const req = { user: { _id: "user123" } };
    const res = makeRes();

    const dbError = new Error("DB failure");

    // Mock chained query which resolves to rejection
    const query = { populate: jest.fn() };

    query.populate
      .mockReturnValueOnce(query)
      .mockRejectedValueOnce(dbError);

    orderModel.find.mockReturnValue(query);

    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    // Act
    await getOrdersController(req, res);

    // Assert
    expect(orderModel.find).toHaveBeenCalledWith({ buyer: "user123" });

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error While Geting Orders",
      error: dbError,
    });

    expect(logSpy).toHaveBeenCalledWith(dbError);

    logSpy.mockRestore();
  });

  it("should handle database errors and return 500 response in getAllOrdersController", async () => {
    // Arrange
    const req = {};
    const res = makeRes();

    const dbError = new Error("DB failure");

    // Mock chain which resolves to rejection
    const query = {
      populate: jest.fn(),
      sort: jest.fn(),
    };

    query.populate.mockReturnValueOnce(query);      // populate products
    query.populate.mockReturnValueOnce(query);      // populate buyer
    query.sort.mockRejectedValueOnce(dbError);      // sort throws -> triggers catch

    orderModel.find.mockReturnValue(query);

    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    // Act
    await getAllOrdersController(req, res);

    // Assert
    expect(orderModel.find).toHaveBeenCalledWith({});

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error While Geting Orders",
      error: dbError,
    });

    expect(logSpy).toHaveBeenCalledWith(dbError);

    logSpy.mockRestore();
  });

  it("should retrieve all orders without user filtering in getAllOrdersController", async () => {
    // Arrange
    const req = {};
    const res = makeRes();

    // Mock chain which reolves to []
    const query = { populate: jest.fn(), sort: jest.fn() };
    query.populate.mockReturnValueOnce(query);
    query.populate.mockReturnValueOnce(query);
    query.sort.mockResolvedValueOnce([]);

    orderModel.find.mockReturnValue(query);

    // Act
    await getAllOrdersController(req, res);

    // Assert
    expect(orderModel.find).toHaveBeenCalledWith({});
  });

  it("should populate products and buyer fields in getOrdersController", async () => {
    // Arrange
    const req = { user: { _id: "user123" } };
    const res = makeRes();
    const mockOrders = [{ _id: "o1" }];

    // Mock chain which resolves to mockOrders
    const query = { populate: jest.fn() };
    query.populate.mockReturnValueOnce(query).mockResolvedValueOnce(mockOrders);

    orderModel.find.mockReturnValue(query);

    // Act
    await getOrdersController(req, res);

    // Assert
    expect(query.populate).toHaveBeenNthCalledWith(1, "products", "-photo");
    expect(query.populate).toHaveBeenNthCalledWith(2, "buyer", "name");
  });

  it("should populate products and buyer fields in getAllOrdersController", async () => {
    // Arrange
    const req = {};
    const res = makeRes();

    // Mock chain which resolves to []
    const query = { populate: jest.fn(), sort: jest.fn() };
    query.populate.mockReturnValueOnce(query);
    query.populate.mockReturnValueOnce(query);
    query.sort.mockResolvedValueOnce([]);

    orderModel.find.mockReturnValue(query);

    // Act
    await getAllOrdersController(req, res);

    // Assert
    expect(query.populate).toHaveBeenNthCalledWith(1, "products", "-photo");
    expect(query.populate).toHaveBeenNthCalledWith(2, "buyer", "name");
  });

  it("should sort orders by creation date in descending order in getAllOrdersController", async () => {
    // Arrange
    const req = {};
    const res = makeRes();

    // Mock chain which resolves to []
    const query = { populate: jest.fn(), sort: jest.fn() };
    query.populate.mockReturnValueOnce(query);
    query.populate.mockReturnValueOnce(query);
    query.sort.mockResolvedValueOnce([]);

    orderModel.find.mockReturnValue(query);

    // Act
    await getAllOrdersController(req, res);

    // Assert
    expect(query.sort).toHaveBeenCalledWith({ createdAt: "-1" });
  });
});
