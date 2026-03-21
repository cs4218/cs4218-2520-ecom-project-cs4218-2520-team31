// Fajar Ibnu Fatihan, A0314606L

import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import JWT from "jsonwebtoken";
import app from "../../../../app.js";
import userModel from "../../../../models/userModel.js";
import productModel from "../../../../models/productModel.js";
import categoryModel from "../../../../models/categoryModel.js";

let mongod;
let adminToken;
let adminUser;
let categoryId;

const fakePhoto = Buffer.from("fake-image-data");            // < 1MB — passes validation
const largePhoto = Buffer.alloc(1000001, "x");              // > 1MB — fails validation

const connect = async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    process.env.JWT_SECRET = "my-super-secret-token";
};

const closeDatabase = async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongod.stop();
};

// Build a multipart create-product request, omitting one field at a time
const buildCreateReq = (token, omitField = null) => {
    let req = request(app)
        .post("/api/v1/product/create-product")
        .set("Authorization", token);

    const fields = { name: "Test Product", description: "A description", price: "99.99", quantity: "10" };
    Object.entries(fields).forEach(([k, v]) => { if (k !== omitField) req = req.field(k, v); });
    if (omitField !== "category") req = req.field("category", categoryId.toString());
    if (omitField !== "photo") req = req.attach("photo", fakePhoto, { filename: "test.jpg", contentType: "image/jpeg" });

    return req;
};

// Build a multipart update-product request, omitting one field at a time
const buildUpdateReq = (token, pid, omitField = null) => {
    let req = request(app)
        .put(`/api/v1/product/update-product/${pid}`)
        .set("Authorization", token);

    const fields = { name: "Updated Product", description: "Updated desc", price: "199.99", quantity: "20" };
    Object.entries(fields).forEach(([k, v]) => { if (k !== omitField) req = req.field(k, v); });
    if (omitField !== "category") req = req.field("category", categoryId.toString());
    if (omitField !== "photo") req = req.attach("photo", fakePhoto, { filename: "test.jpg", contentType: "image/jpeg" });

    return req;
};

// Seed a product for update tests
const seedProduct = () => productModel.create({
    name: "Old Product",
    slug: "old-product",
    description: "Old description",
    price: 50,
    category: categoryId,
    quantity: 5,
});

describe("Admin Product Routes Integration", () => {

    beforeAll(async () => {
        await connect();

        adminUser = await userModel.create({
            name: "Admin User",
            email: "admin@example.com",
            password: "hashedpassword",
            phone: "1234567890",
            address: "123 Admin St",
            answer: "fluffy",
            role: 1,
        });

        adminToken = JWT.sign({ _id: adminUser._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

        const category = await categoryModel.create({ name: "Test Category", slug: "test-category" });
        categoryId = category._id;
    });

    afterAll(async () => await closeDatabase());

    afterEach(async () => {
        await productModel.deleteMany({});
        await userModel.deleteMany({ role: 0 });
        jest.restoreAllMocks();
    });

    // ── POST /api/v1/product/create-product ─────────────────────────────────
    describe("POST /api/v1/product/create-product", () => {

        it("should create a product and save it to the database", async () => {
            const res = await buildCreateReq(adminToken);

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe("Product Created Successfully");
            expect(res.body.products.name).toBe("Test Product");

            const saved = await productModel.findOne({ name: "Test Product" });
            expect(saved).not.toBeNull();
            expect(saved.price).toBe(99.99);
        });

        test.each([
            ["name",        "Name is Required"],
            ["description", "Description is Required"],
            ["price",       "Price is Required"],
            ["category",    "Category is Required"],
            ["quantity",    "Quantity is Required"],
            ["photo",       "Photo is Required"],
        ])("should return 500 when %s is missing", async (omitField, expectedError) => {
            const res = await buildCreateReq(adminToken, omitField);

            expect(res.status).toBe(500);
            expect(res.body.error).toBe(expectedError);
        });

        it("should return 500 when photo exceeds 1MB", async () => {
            const res = await request(app)
                .post("/api/v1/product/create-product")
                .set("Authorization", adminToken)
                .field("name", "Test Product")
                .field("description", "A description")
                .field("price", "99.99")
                .field("category", categoryId.toString())
                .field("quantity", "10")
                .attach("photo", largePhoto, { filename: "large.jpg", contentType: "image/jpeg" });

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Photo should be less than 1MB");
        });

        it("should return 401 when user is not an admin", async () => {
            const regularUser = await userModel.create({
                name: "Regular User", email: "user@example.com", password: "hashedpassword",
                phone: "0987654321", address: "456 User St", answer: "dog", role: 0,
            });
            const userToken = JWT.sign({ _id: regularUser._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

            const res = await buildCreateReq(userToken);

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe("UnAuthorized Access");
        });

        it("should return 500 when a database error occurs", async () => {
            jest.spyOn(productModel.prototype, "save").mockRejectedValueOnce(new Error("DB Error"));

            const res = await buildCreateReq(adminToken);

            expect(res.status).toBe(500);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe("Error in creating product");
        });

    });

    // ── PUT /api/v1/product/update-product/:pid ──────────────────────────────
    describe("PUT /api/v1/product/update-product/:pid", () => {

        it("should update an existing product in the database", async () => {
            const existing = await seedProduct();
            const res = await buildUpdateReq(adminToken, existing._id);

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe("Product Updated Successfully");
            expect(res.body.products.name).toBe("Updated Product");

            const updated = await productModel.findById(existing._id);
            expect(updated.name).toBe("Updated Product");
            expect(updated.price).toBe(199.99);
        });

        test.each([
            ["name",        "Name is Required"],
            ["description", "Description is Required"],
            ["price",       "Price is Required"],
            ["category",    "Category is Required"],
            ["quantity",    "Quantity is Required"],
            ["photo",       "Photo is Required"],
        ])("should return 500 when %s is missing on update", async (omitField, expectedError) => {
            const existing = await seedProduct();
            const res = await buildUpdateReq(adminToken, existing._id, omitField);

            expect(res.status).toBe(500);
            expect(res.body.error).toBe(expectedError);
        });

        it("should return 500 when photo exceeds 1MB on update", async () => {
            const existing = await seedProduct();

            const res = await request(app)
                .put(`/api/v1/product/update-product/${existing._id}`)
                .set("Authorization", adminToken)
                .field("name", "Updated Product")
                .field("description", "Updated desc")
                .field("price", "199.99")
                .field("category", categoryId.toString())
                .field("quantity", "20")
                // Note: controller has typo "less then" instead of "less than" (Bug #3)
                .attach("photo", largePhoto, { filename: "large.jpg", contentType: "image/jpeg" });

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Photo should be less then 1MB");
        });

        it("should return 401 when user is not an admin on update", async () => {
            const existing = await seedProduct();
            const regularUser = await userModel.create({
                name: "Regular User", email: "user@example.com", password: "hashedpassword",
                phone: "0987654321", address: "456 User St", answer: "dog", role: 0,
            });
            const userToken = JWT.sign({ _id: regularUser._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

            const res = await buildUpdateReq(userToken, existing._id);

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe("UnAuthorized Access");
        });

        it("should return 500 when a database error occurs on update", async () => {
            const existing = await seedProduct();
            jest.spyOn(productModel, "findByIdAndUpdate").mockRejectedValueOnce(new Error("DB Error"));

            const res = await buildUpdateReq(adminToken, existing._id);

            expect(res.status).toBe(500);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe("Error in updating product");
        });

    });

});
