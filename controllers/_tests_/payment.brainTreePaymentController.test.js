// Brenna Lauren Tan Jia Ern, A0254710M

import { describe } from "node:test";

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

  describe("ProductController Component: Successful Transaction Processing", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest.resetModules();
    });

    it("should call gateway.transaction.sale with required fields and callback", async () => {
      // Arrange
      const cart = [{ price: 10 }, { price: 5 }];
      const nonce = "nonce123";

      const { brainTreePaymentController, saleMock } = await setupPaymentController();

      const req = { body: { nonce, cart }, user: { _id: "user123" }};
      const res = makeRes();

      // Act
      await brainTreePaymentController(req, res);

      // Assert
      expect(saleMock).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: expect.any(Number),
          paymentMethodNonce: nonce,
          options: { submitForSettlement: true },
        }),
        expect.any(Function)
      );
    });

    it("should create an orderModel instance with correct fields when transaction succeeds", async () => {
      // Arrange
      const cart = [{ price: 10 }];
      const nonce = "nonce123";
      const userId = "user123";
      const result = { id: "txn-success" };

      const { brainTreePaymentController, OrderModelMock } = await setupPaymentController({ 
        saleImplementation: (payload, cb) => cb(null, result),
      });

      const req = { body: { nonce, cart }, user: { _id: userId } };
      const res = makeRes();

      // Act
      await brainTreePaymentController(req, res);

      // Assert
      expect(OrderModelMock).toHaveBeenCalledWith({
        products: cart,
        payment: result,
        buyer: userId,
      });
    });

    it("should trigger order save operation on successful transaction", async () => {
      // Arrange
      const cart = [{ price: 10 }];
      const nonce = "nonce123";
      const result = { id: "txn-success" };

      const { brainTreePaymentController, saveMock } = await setupPaymentController({
        saleImplementation: (payload, cb) => cb(null, result),
      });

      const req = { body: { nonce, cart }, user: { _id: "user123" }};
      const res = makeRes();

      // Act
      await brainTreePaymentController(req, res);

      // Assert
      expect(saveMock).toHaveBeenCalledTimes(1);
    });

    it("should return correct JSON response on successful transaction", async () => {
      // Arrange
      const cart = [{ price: 10 }];
      const nonce = "nonce123";

      const { brainTreePaymentController } = await setupPaymentController();

      const req = { body: { nonce, cart }, user: { _id: "user123" } };
      const res = makeRes();

      // Act
      await brainTreePaymentController(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith({ok: true});
    });
  });
});

describe("ProductController Component: Failed Transaction Handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it("should respond with status 500 and send error payload when gateway returns no valid result", async () => {
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

    const req = { body: { nonce, cart }, user: { _id: "user123" } };
    const res = makeRes();

    // Act
    await brainTreePaymentController(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(gatewayError);
  });

  it("should not create or save an order when transaction fails", async () => {
    // Arrange
    const cart = [{ price: 10 }];
    const nonce = "nonce123";
    const gatewayError = new Error("Gateway failed");

    const { brainTreePaymentController, OrderModelMock, saveMock } = await setupPaymentController({
      saleImplementation: (payload, cb) => {
        cb(gatewayError, null);
        return null;
      },
    });

    const req = { body: { nonce, cart }, user: { _id: "user123" } };
    const res = makeRes();

    // Act
    await brainTreePaymentController(req, res);

    // Assert
    expect(OrderModelMock).not.toHaveBeenCalled();
    expect(saveMock).not.toHaveBeenCalled();
  });

  it("should not return success response when transaction fails", async () => {
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

    const req = { body: { nonce, cart }, user: { _id: "user123" } };
    const res = makeRes();

    // Act
    await brainTreePaymentController(req, res);

    // Assert
    expect(res.json).not.toHaveBeenCalledWith({ ok: true });
  });

  it("should catch and log synchronous errors", async () => {
    const cart = [{ price: 10 }];
    const nonce = "nonce123";
    const thrown = new Error("Synchronous failure");

    const { brainTreePaymentController } = await setupPaymentController({
      saleImplementation: () => {
        throw thrown;
      },
    });

    const req = { body: { nonce, cart }, user: { _id: "user123" }};
    const res = makeRes();

    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    await brainTreePaymentController(req, res);

    expect(logSpy).toHaveBeenCalledWith(thrown);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.send).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();

    logSpy.mockRestore();
  });
});