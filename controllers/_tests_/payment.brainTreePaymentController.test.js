// Brenna Lauren Tan Jia Ern, A0254710M

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const setupPaymentController =  async({ saleImplementation } = {}) => {

  const saleMock = jest.fn(
    saleImplementation || ((payload, cb) => {
      // default to "success"
      cb(null, { id: "txn1" });
      return { id: "txn1" };
    })
  );

  // Mock orderModel constructor
  const saveMock = jest.fn().mockResolvedValue({});
  const OrderModelMock = jest.fn().mockImplementation(() => ({ save: saveMock }));

  jest.doMock("braintree", () => ({
    __esModule: true,
    default: {
      Environment: { Sandbox: "Sandbox" },
      BraintreeGateway: jest.fn().mockImplementation(() => ({
        transaction: {sale: saleMock },
        clientToken: { generate: jest.fn() },
      })),
    },
  }));

  jest.doMock("../../models/orderModel.js", () => ({
    __esModule: true,
    default: OrderModelMock,
  }));

  const { brainTreePaymentController } = await import("../productController.js");
  return { brainTreePaymentController, saleMock, OrderModelMock, saveMock };
};

describe("ProductController Component: Payment Amount Calculation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it("should handle empty cart by passing amount 0 to gateway", async () => {
    // Arrange
    const cart = [];
    const nonce = "nonce123";

    const { brainTreePaymentController, saleMock } = await setupPaymentController();

    const req = { body: {nonce, cart}, user: {_id: "user123"}};
    const res = makeRes();

    // Act
    await brainTreePaymentController(req, res);

    // Assert
    expect(saleMock).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 0,
        paymentMethodNonce: nonce,
        options: { submitForSettlement: true },
      }),
      expect.any(Function),
    );
  });

  it("should handle single-item cart by passing single item price to gateway", async () => {
    // Arrange
    const cart = [{price: 10}];
    const nonce = "nonce123";

    const { brainTreePaymentController, saleMock } = await setupPaymentController();

    const req = { body: {nonce, cart}, user: {_id: "user123"}};
    const res = makeRes();

    // Act
    await brainTreePaymentController(req, res);

    // Assert
    expect(saleMock).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 10,
        paymentMethodNonce: nonce,
        options: { submitForSettlement: true },
      }),
      expect.any(Function),
    );
  });

    it("should handle multi-item cart by passing correct summed amount to gateway", async () => {
    // Arrange
    const cart = [{price: 10}, {price: 25}, {price: 5}];
    const nonce = "nonce123";

    const { brainTreePaymentController, saleMock } = await setupPaymentController();

    const req = { body: {nonce, cart}, user: {_id: "user123"} };
    const res = makeRes();

    // Act
    await brainTreePaymentController(req, res);

    // Assert
    expect(saleMock).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 40,
        paymentMethodNonce: nonce,
        options: { submitForSettlement: true },
      }),
      expect.any(Function),
    );
  });

  it("should return 500 when gateway transaction fails", async () => {
    // Arrange
    const cart = [{ price: 10 }];
    const nonce = "nonce123";

    const gatewayError = new Error("Gateway failed");

    const { brainTreePaymentController } = await setupPaymentController({
      saleImplementation: (payload, cb) => {
        cb(gatewayError, null);
        return null;
      },
    });

    const req = { body: {nonce, cart}, user: { _id: "user123" } };
    const res = makeRes();

    // Act
    await brainTreePaymentController(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(gatewayError);
    expect(res.json).not.toHaveBeenCalled();
  });

  it("should catch and log synchronous errors", async () => {
    // Arrange
    const cart = [{ price: 10 }];
    const nonce = "nonce123";

    const thrown = new Error("Synchronous failure");

    const { brainTreePaymentController } = await setupPaymentController({
      saleImplementation: () => {
        throw thrown;
      },
    });

    const req = { body: {nonce, cart}, user: { _id: "user123" } };
    const res = makeRes();

    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    // Act
    await brainTreePaymentController(req, res);

    // Assert
    expect(res.status).not.toHaveBeenCalled();
    expect(res.send).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();

    logSpy.mockRestore();
  });
});