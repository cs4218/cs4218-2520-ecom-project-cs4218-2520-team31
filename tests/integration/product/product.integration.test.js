// Fajar Ibnu Fatihan, A0314606L

import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import JWT from "jsonwebtoken";
import app from "../../../app.js";
import userModel from "../../../models/userModel.js";
import productModel from "../../../models/productModel.js";
import categoryModel from "../../../models/categoryModel.js";

let mongod;
let adminToken;
let adminUser;
let categoryId;

// Small buffer used as a fake photo attachment (< 1MB, satisfies controller validation)
const fakePhoto = Buffer.from("fake-image-data");

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

describe("Admin Product Routes Integration", () => {

    beforeAll(async () => {
        await connect();

        // Seed admin user (role=1) — shared across all tests
        adminUser = await userModel.create({
            name: "Admin User",
            email: "admin@example.com",
            password: "hashedpassword",
            phone: "1234567890",
            address: "123 Admin St",
            answer: "fluffy",
            role: 1,
        });

        // Generate a valid JWT for the admin
        adminToken = JWT.sign(
            { _id: adminUser._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Seed a category (required by product model)
        const category = await categoryModel.create({
            name: "Test Category",
            slug: "test-category",
        });
        categoryId = category._id;
    });

    afterAll(async () => await closeDatabase());

    afterEach(async () => {
        // Only wipe products between tests — keep admin user + category
        await productModel.deleteMany({});
        await userModel.deleteMany({ role: 0 }); // clean up any regular users created mid-test
        jest.restoreAllMocks();
    });

    // ── POST /api/v1/product/create-product ─────────────────────────────────
    describe("POST /api/v1/product/create-product", () => {

        it("should create a product and save it to the database", async () => {
            const res = await request(app)
                .post("/api/v1/product/create-product")
                .set("Authorization", adminToken)
                .field("name", "Test Product")
                .field("description", "A test product description")
                .field("price", "99.99")
                .field("category", categoryId.toString())
                .field("quantity", "10")
                .field("shipping", "true")
                .attach("photo", fakePhoto, { filename: "test.jpg", contentType: "image/jpeg" });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe("Product Created Successfully");
            expect(res.body.products.name).toBe("Test Product");

            // Verify actually saved in DB
            const saved = await productModel.findOne({ name: "Test Product" });
            expect(saved).not.toBeNull();
            expect(saved.price).toBe(99.99);
        });

        it("should return 500 when name is missing", async () => {
            const res = await request(app)
                .post("/api/v1/product/create-product")
                .set("Authorization", adminToken)
                .field("description", "A test product description")
                .field("price", "99.99")
                .field("category", categoryId.toString())
                .field("quantity", "10")
                .attach("photo", fakePhoto, { filename: "test.jpg", contentType: "image/jpeg" });

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Name is Required");
        });

        it("should return 401 when user is not an admin", async () => {
            // Seed a regular user (role=0)
            const regularUser = await userModel.create({
                name: "Regular User",
                email: "user@example.com",
                password: "hashedpassword",
                phone: "0987654321",
                address: "456 User St",
                answer: "dog",
                role: 0,
            });
            const userToken = JWT.sign(
                { _id: regularUser._id },
                process.env.JWT_SECRET,
                { expiresIn: "7d" }
            );

            const res = await request(app)
                .post("/api/v1/product/create-product")
                .set("Authorization", userToken)
                .field("name", "Test Product")
                .field("description", "desc")
                .field("price", "99.99")
                .field("category", categoryId.toString())
                .field("quantity", "10")
                .attach("photo", fakePhoto, { filename: "test.jpg", contentType: "image/jpeg" });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe("UnAuthorized Access");
        });

    });

    // ── PUT /api/v1/product/update-product/:pid ──────────────────────────────
    describe("PUT /api/v1/product/update-product/:pid", () => {

        it("should update an existing product in the database", async () => {
            // Seed a product to update
            const existing = await productModel.create({
                name: "Old Product",
                slug: "old-product",
                description: "Old description",
                price: 50,
                category: categoryId,
                quantity: 5,
            });

            const res = await request(app)
                .put(`/api/v1/product/update-product/${existing._id}`)
                .set("Authorization", adminToken)
                .field("name", "Updated Product")
                .field("description", "Updated description")
                .field("price", "199.99")
                .field("category", categoryId.toString())
                .field("quantity", "20")
                .field("shipping", "false")
                .attach("photo", fakePhoto, { filename: "test.jpg", contentType: "image/jpeg" });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe("Product Updated Successfully");
            expect(res.body.products.name).toBe("Updated Product");

            // Verify actually updated in DB
            const updated = await productModel.findById(existing._id);
            expect(updated.name).toBe("Updated Product");
            expect(updated.price).toBe(199.99);
        });

        it("should return 500 when name is missing on update", async () => {
            const existing = await productModel.create({
                name: "Old Product",
                slug: "old-product",
                description: "Old description",
                price: 50,
                category: categoryId,
                quantity: 5,
            });

            const res = await request(app)
                .put(`/api/v1/product/update-product/${existing._id}`)
                .set("Authorization", adminToken)
                .field("description", "Updated description")
                .field("price", "199.99")
                .field("category", categoryId.toString())
                .field("quantity", "20")
                .attach("photo", fakePhoto, { filename: "test.jpg", contentType: "image/jpeg" });

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Name is Required");
        });

    });

});
