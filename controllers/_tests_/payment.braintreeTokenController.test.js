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