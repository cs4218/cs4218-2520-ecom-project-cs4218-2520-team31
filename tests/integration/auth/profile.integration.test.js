// Fajar Ibnu Fatihan, A0314606L

import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import JWT from "jsonwebtoken";
import app from "../../../app.js";
import userModel from "../../../models/userModel.js";
import { hashPassword } from "../../../helpers/authHelper.js";

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

// Helper — seed a user and return { user, token }
const seedUser = async (overrides = {}) => {
    const hashed = await hashPassword("password123");
    const user = await userModel.create({
        name: "Test User",
        email: "test@example.com",
        password: hashed,
        phone: "1234567890",
        address: "123 Test St",
        answer: "fluffy",
        role: 0,
        ...overrides,
    });
    const token = JWT.sign({ _id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });
    return { user, token };
};

describe("PUT /api/v1/auth/profile", () => {

    beforeAll(async () => await connect());
    afterAll(async () => await closeDatabase());
    afterEach(async () => {
        await clearDatabase();
        jest.restoreAllMocks();
    });

    // ── Happy path ───────────────────────────────────────────────────────────
    it("should update user profile and persist changes to database", async () => {
        const { token, user } = await seedUser();

        const res = await request(app)
            .put("/api/v1/auth/profile")
            .set("Authorization", token)
            .send({
                name: "Updated Name",
                phone: "0987654321",
                address: "456 New St",
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("Profile Updated SUccessfully");
        expect(res.body.updatedUser.name).toBe("Updated Name");
        expect(res.body.updatedUser.phone).toBe("0987654321");

        // Verify actually persisted in DB
        const updated = await userModel.findById(user._id);
        expect(updated.name).toBe("Updated Name");
        expect(updated.phone).toBe("0987654321");
        expect(updated.address).toBe("456 New St");
    });

    it("should update password with new hash when valid password provided", async () => {
        const { token, user } = await seedUser();

        const res = await request(app)
            .put("/api/v1/auth/profile")
            .set("Authorization", token)
            .send({ password: "newpassword123" });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        // Verify password was changed and rehashed in DB
        const updated = await userModel.findById(user._id);
        expect(updated.password).not.toBe("password123");
        expect(updated.password).not.toBe("newpassword123"); // must be hashed
    });

    it("should retain existing fields when only partial update is sent", async () => {
        const { token, user } = await seedUser();

        const res = await request(app)
            .put("/api/v1/auth/profile")
            .set("Authorization", token)
            .send({ name: "Only Name Changed" });

        expect(res.status).toBe(200);

        // Phone and address should remain unchanged
        const updated = await userModel.findById(user._id);
        expect(updated.name).toBe("Only Name Changed");
        expect(updated.phone).toBe("1234567890");
        expect(updated.address).toBe("123 Test St");
    });

    // ── BVA: password length ─────────────────────────────────────────────────
    it("should return error when password is less than 6 characters", async () => {
        const { token } = await seedUser();

        const res = await request(app)
            .put("/api/v1/auth/profile")
            .set("Authorization", token)
            .send({ password: "abc" });

        // Controller uses res.json() with no status → defaults to 200
        expect(res.status).toBe(200);
        expect(res.body.error).toBe("Passsword is required and 6 character long");
    });

    it("should accept password exactly 6 characters long (BVA boundary)", async () => {
        const { token } = await seedUser();

        const res = await request(app)
            .put("/api/v1/auth/profile")
            .set("Authorization", token)
            .send({ password: "abc123" });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    // ── Server error (catch block) ───────────────────────────────────────────
    it("should return 400 when a database error occurs", async () => {
        const { token } = await seedUser();
        jest.spyOn(userModel, "findById").mockRejectedValueOnce(new Error("DB Error"));

        const res = await request(app)
            .put("/api/v1/auth/profile")
            .set("Authorization", token)
            .send({ name: "New Name" });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Error While Update profile");
    });

});
