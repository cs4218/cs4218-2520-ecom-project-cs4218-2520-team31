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

describe("register integration test", () => {

    beforeAll(async () => await connect());
    afterAll(async () => await closeDatabase());
    afterEach(async () => await clearDatabase());

    it("should register a new user and save to database with hashed password", async () => {
        // Arrange
        const newUser = {
            name: "Test User",
            email: "test@example.com",
            password: "password123",
            phone: "1234567890",
            address: "123 Test St",
            answer: "fluffy"
        };

        // Act — real HTTP request through the full Express stack
        const res = await request(app)
            .post("/api/v1/auth/register")
            .send(newUser);

        // Assert — HTTP response
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.user).toBeDefined();
        expect(res.body.user.email).toBe(newUser.email);

        // Assert — verify ACTUAL database state (this is what makes it integration!)
        const savedUser = await userModel.findOne({ email: "test@example.com" });
        expect(savedUser).not.toBeNull();
        expect(savedUser.name).toBe("Test User");

        // Assert — password was hashed (controller → authHelper integration)
        expect(savedUser.password).not.toBe("password123");
    });


});
