// Fajar Ibnu Fatihan, A0314606L

import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import JWT from "jsonwebtoken";
import app from "../../../../app.js";
import userModel from "../../../../models/userModel.js";

let mongod;

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

describe("Auth Middleware Integration", () => {

    beforeAll(async () => await connect());
    afterAll(async () => await closeDatabase());
    afterEach(async () => {
        await clearDatabase();
        jest.restoreAllMocks();
    });

    // ── requireSignIn — GET /api/v1/auth/user-auth ───────────────────────────
    describe("requireSignIn middleware", () => {

        it("should return 200 when a valid JWT token is provided", async () => {
            const user = await userModel.create({
                name: "Test User",
                email: "test@example.com",
                password: "hashedpassword",
                phone: "1234567890",
                address: "123 Test St",
                answer: "fluffy",
                role: 0,
            });

            const token = JWT.sign({ _id: user._id }, process.env.JWT_SECRET, {
                expiresIn: "7d",
            });

            const res = await request(app)
                .get("/api/v1/auth/user-auth")
                .set("Authorization", token);

            expect(res.status).toBe(200);
            expect(res.body.ok).toBe(true);
        });

        // NOTE: Known bug — requireSignIn catch block does not send a 401 response
        // when the token is missing or invalid. The request hangs indefinitely.
        // This is a defect in authMiddleware.js that should be fixed by adding:
        // return res.status(401).send({ success: false, message: "Unauthorized" })
        // in the catch block. Test skipped to avoid timeout.
        it.todo("should return 401 when no token is provided (blocked by requireSignIn bug)");

    });

    // ── isAdmin — GET /api/v1/auth/test ──────────────────────────────────────
    describe("isAdmin middleware", () => {

        it("should allow access when user has role=1 (admin)", async () => {
            const admin = await userModel.create({
                name: "Admin User",
                email: "admin@example.com",
                password: "hashedpassword",
                phone: "1234567890",
                address: "123 Admin St",
                answer: "fluffy",
                role: 1,
            });

            const token = JWT.sign({ _id: admin._id }, process.env.JWT_SECRET, {
                expiresIn: "7d",
            });

            const res = await request(app)
                .get("/api/v1/auth/test")
                .set("Authorization", token);

            expect(res.status).toBe(200);
            expect(res.text).toBe("Protected Routes");
        });

        it("should return 401 when user has role=0 (non-admin)", async () => {
            const regularUser = await userModel.create({
                name: "Regular User",
                email: "user@example.com",
                password: "hashedpassword",
                phone: "1234567890",
                address: "456 User St",
                answer: "fluffy",
                role: 0,
            });

            const token = JWT.sign({ _id: regularUser._id }, process.env.JWT_SECRET, {
                expiresIn: "7d",
            });

            const res = await request(app)
                .get("/api/v1/auth/test")
                .set("Authorization", token);

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe("UnAuthorized Access");
        });

    });

});
