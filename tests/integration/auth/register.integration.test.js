// Fajar Ibnu Fatihan, A0314606L

import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../../../app.js";
import userModel from "../../../models/userModel.js";

let mongod;

// Connect to the in-memory database.
const connect = async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    process.env.JWT_SECRET = "my-super-secret-token";
};

// Drop database, close the connection and stop mongod.
const closeDatabase = async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongod.stop();
};

// Clear all test data after each test.
const clearDatabase = async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
    }
};

describe("POST /api/v1/auth/register", () => {

    beforeAll(async () => await connect());
    afterAll(async () => await closeDatabase());
    afterEach(async () => {
        await clearDatabase();
        jest.restoreAllMocks();
    });

    // ── Happy path ──────────────────────────────────────────────────────────
    it("should register a new user and save to database with hashed password", async () => {
        const newUser = {
            name: "Test User",
            email: "test@example.com",
            password: "password123",
            phone: "1234567890",
            address: "123 Test St",
            answer: "fluffy"
        };

        const res = await request(app)
            .post("/api/v1/auth/register")
            .send(newUser);

        // Assert — HTTP response
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.user).toBeDefined();
        expect(res.body.user.email).toBe(newUser.email);

        // Assert — actual DB state
        const savedUser = await userModel.findOne({ email: "test@example.com" });
        expect(savedUser).not.toBeNull();
        expect(savedUser.name).toBe("Test User");

        // Assert — password was hashed (controller → authHelper integration)
        expect(savedUser.password).not.toBe("password123");
    });

    // ── Missing field validation ─────────────────────────────────────────────
    // Base valid body — each case omits one field
    const validBody = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        phone: "1234567890",
        address: "123 Test St",
        answer: "fluffy"
    };

    test.each([
        ["name",     { ...validBody, name: undefined },     "Name is Required"],
        ["email",    { ...validBody, email: undefined },    "Email is Required"],
        ["password", { ...validBody, password: undefined }, "Password is Required"],
        ["phone",    { ...validBody, phone: undefined },    "Phone no is Required"],
        ["address",  { ...validBody, address: undefined },  "Address is Required"],
        ["answer",   { ...validBody, answer: undefined },   "Answer is Required"],
    ])("should return error message when %s is missing", async (field, body, expectedMessage) => {
        const res = await request(app)
            .post("/api/v1/auth/register")
            .send(body);

        // Controller uses res.send() with no status → defaults to 200
        expect(res.status).toBe(200);
        expect(res.body.message).toBe(expectedMessage);
    });

    // ── Duplicate email ──────────────────────────────────────────────────────
    it("should return error when email is already registered", async () => {
        // Pre-insert a user with the same email
        await userModel.create({
            name: "Existing User",
            email: "test@example.com",
            password: "hashedpassword",
            phone: "1234567890",
            address: "123 Test St",
            answer: "fluffy"
        });

        const res = await request(app)
            .post("/api/v1/auth/register")
            .send({
                name: "New User",
                email: "test@example.com",
                password: "password123",
                phone: "0987654321",
                address: "456 New St",
                answer: "cat"
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Already Register please login");
    });

    // ── Server error (catch block) ───────────────────────────────────────────
    it("should return 500 when a database error occurs", async () => {
        // Force findOne to throw to trigger the catch block
        jest.spyOn(userModel, "findOne").mockRejectedValueOnce(new Error("DB Error"));

        const res = await request(app)
            .post("/api/v1/auth/register")
            .send({
                name: "Test User",
                email: "test@example.com",
                password: "password123",
                phone: "1234567890",
                address: "123 Test St",
                answer: "fluffy"
            });

        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Error in Registration");
    });

});
