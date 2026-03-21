import request from "supertest";
import JWT from "jsonwebtoken";
import mongoose from "mongoose";
import app from "../../../app.js";
import orderModel from "../../../models/orderModel.js";
import {
  connectMemoryDb,
  clearMemoryDb,
  closeMemoryDb,
} from "../../../tests/setupMemoryDb.js";

jest.mock("braintree", () => {
  const mockSale = jest.fn();

  return {
    __esModule: true,
    default: {
      BraintreeGateway: jest.fn().mockImplementation(() => ({
        transaction: {
          sale: mockSale,
        },
      })),
      Environment: {
        Sandbox: {},
      },
      __mockSale: mockSale,
    },
  };
});

import braintree from "braintree";

describe("Braintree Payment API", () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = "test-secret";
    await connectMemoryDb();
  });

  afterEach(async () => {
    braintree.__mockSale.mockReset();
    await clearMemoryDb();
  });

  afterAll(async () => {
    await closeMemoryDb();
  });

  it("should process payment and create an order", async () => {
    const userId = new mongoose.Types.ObjectId().toString();

    const token = JWT.sign(
      { _id: userId, email: "test@example.com" },
      process.env.JWT_SECRET
    );

    braintree.__mockSale.mockImplementation((payload, callback) => {
      callback(null, {
        success: true,
        transaction: {
          id: "txn_123",
          amount: "30",
        },
      });
    });

    const cart = [
      { _id: new mongoose.Types.ObjectId().toString(), price: 10 },
      { _id: new mongoose.Types.ObjectId().toString(), price: 20 },
    ];

    const res = await request(app)
      .post("/api/v1/product/braintree/payment")
      .set("Authorization", token)
      .send({
        nonce: "fake-nonce",
        cart,
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });

    // wait required as controller does .save() without await
    let savedOrder = null;
    for (let i = 0; i < 10; i++) {
      savedOrder = await orderModel.findOne({ buyer: userId });
      if (savedOrder) break;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }

    expect(savedOrder).not.toBeNull();
    expect(savedOrder.buyer.toString()).toBe(userId);
    expect(savedOrder.products).toHaveLength(2);
    expect(savedOrder.payment.transaction.id).toBe("txn_123");
  });

  it("should return 500 when braintree payment fails", async () => {
    const userId = new mongoose.Types.ObjectId().toString();

    const token = JWT.sign(
      { _id: userId, email: "test@example.com" },
      process.env.JWT_SECRET
    );

    braintree.__mockSale.mockImplementation((payload, callback) => {
      callback(new Error("Payment failed"), null);
    });

    const res = await request(app)
      .post("/api/v1/product/braintree/payment")
      .set("Authorization", token)
      .send({
        nonce: "fake-nonce",
        cart: [{ _id: new mongoose.Types.ObjectId().toString(), price: 15 }],
      });

    expect(res.status).toBe(500);

    const orders = await orderModel.find({});
    expect(orders).toHaveLength(0);
  });
});