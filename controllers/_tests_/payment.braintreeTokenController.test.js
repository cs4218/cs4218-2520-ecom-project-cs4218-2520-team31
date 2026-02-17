// Brenna Lauren Tan Jia Ern, A0254710M
import { braintreeTokenController } from "../productController.js";
import braintree, { BraintreeGateway } from "braintree";

// Mock braintree module
jest.mock("braintree", () => {
  const generateMock = jest.fn();

  return {
    BraintreeGateway: jest.fn().mockImplementation(() => ({
      clientToken: {
        generate: generateMock,
      },
    })),
    Environment: {
      Sandbox: "Sandbox",
    },
  };
});

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

const setupControllerWithMock = async (generateImplementation) => {
  jest.resetModules();

  const generateMock = jest.fn(generateImplementation);

  jest.doMock("braintree", () => ({
    __esModule: true,
    default: {
      Environment: { Sandbox: "Sandbox" },
      BraintreeGateway: jest.fn().mockImplementation(() => ({
        clientToken: { generate: generateMock },
      })),
    },
  }));

  const { braintreeTokenController } = await import("../productController.js");

  return { braintreeTokenController, generateMock };
}

describe("ProductController Component: Braintree Token Generation (Success)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should invoke Braintree client token generation", async () => {
    // Arrange
    const req = {};
    const res = makeRes();

    const gatewayInstance = new braintree.BraintreeGateway();
    const generateMock = gatewayInstance.clientToken.generate;

    generateMock.mockImplementation((args, cb) => {
      cb(null, {clientToken: "mock-token"});
    });

    // Act
    await braintreeTokenController(req, res);

    // Assert
    expect(generateMock).toHaveBeenCalledWith({}, expect.any(Function));
  });

  it("should send token response when generation succeeds", async () => {
    // Arrange
    const req = {};
    const res = makeRes();

    const gatewayInstance = new braintree.BraintreeGateway();
    const generateMock = gatewayInstance.clientToken.generate;

    const mockResponse = { clientToken: "mock-token" };

    generateMock.mockImplementation((args, cb) => {
      cb(null, mockResponse);
    });

    // Act
    await braintreeTokenController(req, res);

    // Assert
    expect(res.send).toHaveBeenCalledWith(mockResponse);
  });

  it("should not trigger error handling on success path", async () => {
    // Arrange
    const req = {};
    const res = makeRes();

    const gatewayInstance = new braintree.BraintreeGateway();
    const generateMock = gatewayInstance.clientToken.generate;

    const mockResponse = { clientToken: "mock-token" };

    generateMock.mockImplementation((args, cb) => {
      cb(null, mockResponse);
    });

    // Act
    await braintreeTokenController(req, res);

    // Assert
    expect(res.status).not.toHaveBeenCalledWith(500);
  });

  it("should correctly handle callback-based flow", async () => {
    // Arrange
    const req = {};
    const res = makeRes();

    const gatewayInstance = new braintree.BraintreeGateway();
    const generateMock = gatewayInstance.clientToken.generate;

    let callbackExecuted = false;

    generateMock.mockImplementation((args, cb) => {
      callbackExecuted = true;
      cb(null, {clientToken: "mock-token"});
    })

    // Act
    await braintreeTokenController(req, res);

    // Assert
    expect(callbackExecuted).toBe(true);
  })
})

describe("ProductController Component: Braintree Token Generation (Error Handling)", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  })

  it("should respond with 500 status when gateway returns error", async () => {
    // Arrange
    const err = new Error("Token generation failed");

    const { braintreeTokenController } = await setupControllerWithMock((args, cb) => cb(err, null));

    const req = {};
    const res = makeRes();

    // Act
    await braintreeTokenController(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(err);
  });

  it("should not send success response on error path", async () => {
    // Arrange
    const err = new Error("Token generation failed");
    const successResponse = { clientToken: "wrong" };

    const { braintreeTokenController } = await setupControllerWithMock((args, cb) => cb(err, successResponse));

    const req = {};
    const res = makeRes();

    // Act
    await braintreeTokenController(req, res);

    // Assert
    expect(res.send).not.toHaveBeenCalledWith(successResponse);
  });

  it("should execute error branch through callback flow", async () => {
    // Arrange
    const err = new Error("Token generation failed");

    const { braintreeTokenController, generateMock } = await setupControllerWithMock((args, cb) => cb(err, null));

    const req = {};
    const res = makeRes();

    // Act
    await braintreeTokenController(req, res);

    // Assert
    expect(generateMock).toHaveBeenCalledWith({}, expect.any(Function));
  });

  it("should catch and log synchronous errors", async () => {
    // Arrange
    const thrown = new Error("Synchronous failure");

    const { braintreeTokenController } = await setupControllerWithMock(() => {
      throw thrown;
    });

    const req = {};
    const res = makeRes();

    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    // Act
    await braintreeTokenController(req, res);

    // Assert
    expect(logSpy).toHaveBeenCalledWith(thrown);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.send).not.toHaveBeenCalled();

    logSpy.mockRestore();
  });
});