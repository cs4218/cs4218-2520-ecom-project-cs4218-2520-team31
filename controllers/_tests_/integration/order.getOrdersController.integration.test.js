// Brenna Lauren Tan Jia Ern, A0254710M

import request from "supertest";
import mongoose from "mongoose";
import JWT from "jsonwebtoken";

import app from "../../../app.js";
import orderModel from "../../../models/orderModel.js";
import userModel from "../../../models/userModel.js";

import {
  connectMemoryDb,
  clearMemoryDb,
  closeMemoryDb,
} from "../../../tests/setupMemoryDb.js";

describe("Get Orders API", () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = "test-secret";
    await connectMemoryDb();
  });

  afterEach(async () => {
    await clearMemoryDb();
  });

  afterAll(async () => {
    await closeMemoryDb();
  });

  it("should reject unauthenticated request", async () => {
    const res = await request(app).get("/api/v1/auth/orders");

    expect(res.status).toBeGreaterThanOrEqual(400); // flexible (401/403)
  });

  it("should return only the logged-in user's orders", async () => {
    // create 2 users
    const user1 = await new userModel({
      name: "User One",
      email: "user1@test.com",
      password: "123456",
      phone: "123",
      address: "addr",
      answer: "test",
    }).save();

    const user2 = await new userModel({
      name: "User Two",
      email: "user2@test.com",
      password: "123456",
      phone: "456",
      address: "addr",
      answer: "test",
    }).save();

    // create orders for both users
    await new orderModel({
      products: [],
      payment: {},
      buyer: user1._id,
    }).save();

    await new orderModel({
      products: [],
      payment: {},
      buyer: user2._id,
    }).save();

    // login as user1
    const token = JWT.sign({ _id: user1._id }, process.env.JWT_SECRET);

    const res = await request(app)
      .get("/api/v1/auth/orders")
      .set("Authorization", token);

    expect(res.status).toBe(200);

    // should only return user1's orders
    expect(res.body.length).toBe(1);
    expect(res.body[0].buyer._id).toBe(user1._id.toString());
  });
});