// Brenna Lauren Tan Jia Ern, A0254710M
import mongoose from "mongoose";
import Order from "./orderModel.js";

describe("OrderModel Component: Schema Validation and Default Values", () => {

  it("should apply default status when not provided", async () => {
    // Arrange
    const order = new Order({
      products: [new mongoose.Types.ObjectId()],
      buyer: new mongoose.Types.ObjectId(),
    });

    // Act
    await order.validate();

    // Assert
    expect(order.status).toBe("Not Process");
  });

  it("should accept allowed enum values for status", async () => {
    // Arrange
    const order = new Order({
      products: [new mongoose.Types.ObjectId()],
      buyer: new mongoose.Types.ObjectId(),
      status: "Shipped",
    });

    // Act, Assert
    await expect(order.validate()).resolves.not.toThrow();
  });

  it("should reject invalid enum values for status", async () => {
    // Arrange
    const order = new Order({
      products: [new mongoose.Types.ObjectId()],
      buyer: new mongoose.Types.ObjectId(),
      status: "InvalidStatus",
    });

    // Act, Assert
    await expect(order.validate()).rejects.toThrow();
  });

  it("should accept an array of ObjectId refrences for products field", async () => {
    // Arrange
    const order = new Order({
      products: [
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId()
      ],
      buyer: new mongoose.Types.ObjectId(),
      status: "Processing",
    });

    // Act, Assert
    await expect(order.validate()).resolves.not.toThrow();
  });

  it("should enable timestamps in schema definition", async () => {
    // unable to test timestamp generation as it is only generated on save() and create(), not validate()
    // only test for schema configuration (timestamps enabled)
    expect(Order.schema.options.timestamps).toBe(true);
  });
});