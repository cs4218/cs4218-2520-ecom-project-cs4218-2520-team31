// Amanda Quek Yan Ling, A0277779Y

import express from "express";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import productRoutes from "../../../routes/productRoutes.js";
import productModel from "../../../models/productModel.js";
import categoryModel from "../../../models/categoryModel.js";

process.env.BRAINTREE_MERCHANT_ID = "fake_merchant_id";
process.env.BRAINTREE_PUBLIC_KEY = "fake_public_key";
process.env.BRAINTREE_PRIVATE_KEY = "fake_private_key";

export const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/v1/product", productRoutes);
  return app;
};

export const setupTestDB = async () => {
  const mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  return mongoServer;
};

export const teardownTestDB = async (mongoServer) => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
};

export const clearDatabase = async () => {
  await productModel.deleteMany({});
  await categoryModel.deleteMany({});
};

export const seedProducts = async () => {
  const electronicsCategory = await categoryModel.create({
    name: "Electronics",
    slug: "electronics",
  });

  const fashionCategory = await categoryModel.create({
    name: "Fashion",
    slug: "fashion",
  });

  const iphone = await productModel.create({
    name: "iPhone 15",
    slug: "iphone-15",
    description: "Apple smartphone",
    price: 1499,
    category: electronicsCategory._id,
    quantity: 10,
    shipping: true,
    photo: {
      data: Buffer.from("fake-iphone-photo"),
      contentType: "image/png",
    },
  });

  const samsung = await productModel.create({
    name: "Samsung S24",
    slug: "samsung-s24",
    description: "Samsung smartphone",
    price: 1299,
    category: electronicsCategory._id,
    quantity: 5,
    shipping: true,
  });

  const tshirt = await productModel.create({
    name: "Plain T-Shirt",
    slug: "plain-tshirt",
    description: "Cotton T-shirt",
    price: 25,
    category: fashionCategory._id,
    quantity: 50,
    shipping: false,
  });

  return {
    electronicsCategory,
    fashionCategory,
    iphone,
    samsung,
    tshirt,
  };
};

export { productModel, categoryModel };