// Fajar Ibnu Fatihan, A0314606L

import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import JWT from "jsonwebtoken";
import app from "../../../../app.js";
import userModel from "../../../../models/userModel.js";
import categoryModel from "../../../../models/categoryModel.js";

let mongod;
let adminToken;

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

const clearDatabase = async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
};

describe("Admin Category Routes Integration", () => {

    beforeAll(async () => {
        await connect();

        const admin = await userModel.create({
            name: "Admin User",
            email: "admin@example.com",
            password: "hashedpassword",
            phone: "1234567890",
            address: "123 Admin St",
            answer: "fluffy",
            role: 1,
        });

        adminToken = JWT.sign({ _id: admin._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    });

    afterAll(async () => await closeDatabase());

    afterEach(async () => {
        await clearDatabase();
        jest.restoreAllMocks();
        // Re-seed admin user removed by clearDatabase
        const admin = await userModel.create({
            name: "Admin User",
            email: "admin@example.com",
            password: "hashedpassword",
            phone: "1234567890",
            address: "123 Admin St",
            answer: "fluffy",
            role: 1,
        });
        adminToken = JWT.sign({ _id: admin._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    });

    // ── POST /api/v1/category/create-category ────────────────────────────────
    describe("POST /api/v1/category/create-category", () => {

        it("should create a new category and save it to the database", async () => {
            const res = await request(app)
                .post("/api/v1/category/create-category")
                .set("Authorization", adminToken)
                .send({ name: "Electronics" });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe("new category created");
            expect(res.body.category.name).toBe("Electronics");

            // Verify saved in DB
            const saved = await categoryModel.findOne({ name: "Electronics" });
            expect(saved).not.toBeNull();
        });

        it("should return 200 when category name already exists", async () => {
            await categoryModel.create({ name: "Electronics", slug: "electronics" });

            const res = await request(app)
                .post("/api/v1/category/create-category")
                .set("Authorization", adminToken)
                .send({ name: "Electronics" });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe("Category Already Exisits");
        });

        it("should return 401 when name is missing", async () => {
            const res = await request(app)
                .post("/api/v1/category/create-category")
                .set("Authorization", adminToken)
                .send({});

            expect(res.status).toBe(401);
            expect(res.body.message).toBe("Name is required");
        });

        it("should return 401 when user is not an admin", async () => {
            const regularUser = await userModel.create({
                name: "Regular User", email: "user@example.com", password: "hashedpassword",
                phone: "0987654321", address: "456 User St", answer: "dog", role: 0,
            });
            const userToken = JWT.sign({ _id: regularUser._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

            const res = await request(app)
                .post("/api/v1/category/create-category")
                .set("Authorization", userToken)
                .send({ name: "Electronics" });

            expect(res.status).toBe(401);
            expect(res.body.message).toBe("UnAuthorized Access");
        });

        // NOTE: Bug #4 — catch block references `errro` (undefined variable), causing a
        // ReferenceError if the catch block executes. The server error path is broken.
        // See notes.md Bug #4 for details.
        it.todo("should return 500 on database error (blocked by Bug #4: errro ReferenceError in catch block)");

    });

    // ── PUT /api/v1/category/update-category/:id ─────────────────────────────
    describe("PUT /api/v1/category/update-category/:id", () => {

        it("should update a category and persist changes to the database", async () => {
            const existing = await categoryModel.create({ name: "Old Name", slug: "old-name" });

            const res = await request(app)
                .put(`/api/v1/category/update-category/${existing._id}`)
                .set("Authorization", adminToken)
                .send({ name: "New Name" });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            // NOTE: Bug #5 — response key was `messsage` (triple-s), fixed to `message`
            expect(res.body.message).toBe("Category Updated Successfully");

            // Verify updated in DB
            const updated = await categoryModel.findById(existing._id);
            expect(updated.name).toBe("New Name");
        });

        it("should return 401 when user is not an admin", async () => {
            const existing = await categoryModel.create({ name: "Old Name", slug: "old-name" });
            const regularUser = await userModel.create({
                name: "Regular User", email: "user@example.com", password: "hashedpassword",
                phone: "0987654321", address: "456 User St", answer: "dog", role: 0,
            });
            const userToken = JWT.sign({ _id: regularUser._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

            const res = await request(app)
                .put(`/api/v1/category/update-category/${existing._id}`)
                .set("Authorization", userToken)
                .send({ name: "New Name" });

            expect(res.status).toBe(401);
            expect(res.body.message).toBe("UnAuthorized Access");
        });

        it("should return 500 when a database error occurs on update", async () => {
            const existing = await categoryModel.create({ name: "Old Name", slug: "old-name" });
            jest.spyOn(categoryModel, "findByIdAndUpdate").mockRejectedValueOnce(new Error("DB Error"));

            const res = await request(app)
                .put(`/api/v1/category/update-category/${existing._id}`)
                .set("Authorization", adminToken)
                .send({ name: "New Name" });

            expect(res.status).toBe(500);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe("Error while updating category");
        });

    });

    // ── DELETE /api/v1/category/delete-category/:id ──────────────────────────
    describe("DELETE /api/v1/category/delete-category/:id", () => {

        it("should delete a category and remove it from the database", async () => {
            const existing = await categoryModel.create({ name: "To Delete", slug: "to-delete" });

            const res = await request(app)
                .delete(`/api/v1/category/delete-category/${existing._id}`)
                .set("Authorization", adminToken);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            // NOTE: Bug #6 — typo in message was "Categry", fixed to "Category"
            expect(res.body.message).toBe("Category Deleted Successfully");

            // Verify removed from DB
            const deleted = await categoryModel.findById(existing._id);
            expect(deleted).toBeNull();
        });

        it("should return 401 when user is not an admin", async () => {
            const existing = await categoryModel.create({ name: "To Delete", slug: "to-delete" });
            const regularUser = await userModel.create({
                name: "Regular User", email: "user@example.com", password: "hashedpassword",
                phone: "0987654321", address: "456 User St", answer: "dog", role: 0,
            });
            const userToken = JWT.sign({ _id: regularUser._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

            const res = await request(app)
                .delete(`/api/v1/category/delete-category/${existing._id}`)
                .set("Authorization", userToken);

            expect(res.status).toBe(401);
            expect(res.body.message).toBe("UnAuthorized Access");
        });

        it("should return 500 when a database error occurs on delete", async () => {
            const existing = await categoryModel.create({ name: "To Delete", slug: "to-delete" });
            jest.spyOn(categoryModel, "findByIdAndDelete").mockRejectedValueOnce(new Error("DB Error"));

            const res = await request(app)
                .delete(`/api/v1/category/delete-category/${existing._id}`)
                .set("Authorization", adminToken);

            expect(res.status).toBe(500);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe("error while deleting category");
        });

    });

});
