import request from "supertest";
import JWT from "jsonwebtoken";

import app from "../../app.js";
import userModel from "../../models/userModel.js";
import orderModel from "../../models/orderModel.js";
import {
  connectMemoryDb,
  clearMemoryDb,
  closeMemoryDb,
} from "../../tests/memoryDb.js";

describe("Admin Orders API", () => {
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

  it("should reject non-admin from fetching all orders", async () => {
    const normalUser = await new userModel({
      name: "Normal User",
      email: "user@test.com",
      password: "123456",
      phone: "123",
      address: "addr",
      answer: "blue",
      role: 0,
    }).save();

    const token = JWT.sign({ _id: normalUser._id }, process.env.JWT_SECRET);

    const res = await request(app)
      .get("/api/v1/auth/all-orders")
      .set("Authorization", token);

    expect(res.status).toBe(401);
  });

  it("should allow admin to fetch all orders", async () => {
    const adminUser = await new userModel({
      name: "Admin User",
      email: "admin@test.com",
      password: "123456",
      phone: "999",
      address: "admin addr",
      answer: "red",
      role: 1,
    }).save();

    const buyer1 = await new userModel({
      name: "Buyer One",
      email: "buyer1@test.com",
      password: "123456",
      phone: "111",
      address: "addr1",
      answer: "a",
      role: 0,
    }).save();

    const buyer2 = await new userModel({
      name: "Buyer Two",
      email: "buyer2@test.com",
      password: "123456",
      phone: "222",
      address: "addr2",
      answer: "b",
      role: 0,
    }).save();

    await new orderModel({
      products: [],
      payment: {},
      buyer: buyer1._id,
      status: "Not Process",
    }).save();

    await new orderModel({
      products: [],
      payment: {},
      buyer: buyer2._id,
      status: "Processing",
    }).save();

    const token = JWT.sign({ _id: adminUser._id }, process.env.JWT_SECRET);

    const res = await request(app)
      .get("/api/v1/auth/all-orders")
      .set("Authorization", token);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
  });

  it("should reject non-admin from updating order status", async () => {
    const normalUser = await new userModel({
      name: "Normal User",
      email: "user2@test.com",
      password: "123456",
      phone: "123",
      address: "addr",
      answer: "blue",
      role: 0,
    }).save();

    const buyer = await new userModel({
      name: "Buyer",
      email: "buyer@test.com",
      password: "123456",
      phone: "555",
      address: "buyer addr",
      answer: "green",
      role: 0,
    }).save();

    const order = await new orderModel({
      products: [],
      payment: {},
      buyer: buyer._id,
      status: "Not Process",
    }).save();

    const token = JWT.sign({ _id: normalUser._id }, process.env.JWT_SECRET);

    const res = await request(app)
      .put(`/api/v1/auth/order-status/${order._id}`)
      .set("Authorization", token)
      .send({ status: "Shipped" });

    expect(res.status).toBe(401);

    const unchangedOrder = await orderModel.findById(order._id);
    expect(unchangedOrder.status).toBe("Not Process");
  });

  it("should allow admin to update order status and persist the change", async () => {
    const adminUser = await new userModel({
      name: "Admin User",
      email: "admin2@test.com",
      password: "123456",
      phone: "999",
      address: "admin addr",
      answer: "red",
      role: 1,
    }).save();

    const buyer = await new userModel({
      name: "Buyer",
      email: "buyer3@test.com",
      password: "123456",
      phone: "333",
      address: "buyer addr",
      answer: "orange",
      role: 0,
    }).save();

    const order = await new orderModel({
      products: [],
      payment: {},
      buyer: buyer._id,
      status: "Not Process",
    }).save();

    const token = JWT.sign({ _id: adminUser._id }, process.env.JWT_SECRET);

    const res = await request(app)
      .put(`/api/v1/auth/order-status/${order._id}`)
      .set("Authorization", token)
      .send({ status: "Shipped" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("Shipped");

    const updatedOrder = await orderModel.findById(order._id);
    expect(updatedOrder.status).toBe("Shipped");
  });
});