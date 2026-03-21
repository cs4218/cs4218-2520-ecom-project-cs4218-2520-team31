// Fajar Ibnu Fatihan, A0314606L

import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../../../../app.js";
import userModel from "../../../../models/userModel.js";
import { hashPassword } from "../../../../helpers/authHelper.js";

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

// Helper — seed a registered user with a real hashed password
const seedUser = async () => {
    const hashed = await hashPassword("password123");
    return userModel.create({
        name: "Test User",
        email: "test@example.com",
        password: hashed,
        phone: "1234567890",
        address: "123 Test St",
        answer: "fluffy",
    });
};

describe("POST /api/v1/auth/login", () => {

    beforeAll(async () => await connect());
    afterAll(async () => await closeDatabase());
    afterEach(async () => {
        await clearDatabase();
        jest.restoreAllMocks();
    });

    // ── Happy path ───────────────────────────────────────────────────────────
    it("should login successfully and return user data with JWT token", async () => {
        await seedUser();

        const res = await request(app)
            .post("/api/v1/auth/login")
            .send({ email: "test@example.com", password: "password123" });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("login successfully");

        // User object returned (no password field)
        expect(res.body.user).toBeDefined();
        expect(res.body.user.email).toBe("test@example.com");
        expect(res.body.user.password).toBeUndefined();

        // JWT token returned
        expect(res.body.token).toBeDefined();
    });

    // ── Missing credentials ──────────────────────────────────────────────────
    // Both missing email and missing password hit the same guard: !email || !password
    test.each([
        ["email",    { password: "password123" }],
        ["password", { email: "test@example.com" }],
    ])("should return 404 when %s is missing", async (field, body) => {
        const res = await request(app)
            .post("/api/v1/auth/login")
            .send(body);

        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Invalid email or password");
    });

    // ── Email not registered ─────────────────────────────────────────────────
    it("should return 404 when email is not registered", async () => {
        const res = await request(app)
            .post("/api/v1/auth/login")
            .send({ email: "nobody@example.com", password: "password123" });

        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Email is not registered");
    });

    // ── Wrong password ───────────────────────────────────────────────────────
    it("should return 200 with success false when password is incorrect", async () => {
        await seedUser();

        const res = await request(app)
            .post("/api/v1/auth/login")
            .send({ email: "test@example.com", password: "wrongpassword" });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Invalid Password");
    });

    // ── Server error (catch block) ───────────────────────────────────────────
    it("should return 500 when a database error occurs", async () => {
        jest.spyOn(userModel, "findOne").mockRejectedValueOnce(new Error("DB Error"));

        const res = await request(app)
            .post("/api/v1/auth/login")
            .send({ email: "test@example.com", password: "password123" });

        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Error in login");
    });

});
