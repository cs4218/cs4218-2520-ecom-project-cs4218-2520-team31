import request from "supertest";

jest.mock("braintree", () => {
  const mockGenerate = jest.fn();

  return {
    __esModule: true,
    default: {
      BraintreeGateway: jest.fn().mockImplementation(() => ({
        clientToken: {
          generate: mockGenerate,
        },
      })),
      Environment: {
        Sandbox: {},
      },
      __mockGenerate: mockGenerate,
    },
  };
});

import app from "../../app.js";
import braintree from "braintree";

describe("Braintree Token API", () => {
  beforeEach(() => {
    braintree.__mockGenerate.mockReset();
  });

  it("should return client token successfully", async () => {
    braintree.__mockGenerate.mockImplementation((_, callback) => {
      callback(null, { clientToken: "fake-token" });
    });

    const res = await request(app).get("/api/v1/product/braintree/token");

    expect(res.status).toBe(200);
    expect(res.body.clientToken).toBe("fake-token");
  });

  it("should return 500 if braintree fails", async () => {
    braintree.__mockGenerate.mockImplementation((_, callback) => {
      callback(new Error("Braintree error"), null);
    });

    const res = await request(app).get("/api/v1/product/braintree/token");

    expect(res.status).toBe(500);
  });
});