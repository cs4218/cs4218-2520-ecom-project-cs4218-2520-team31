import { MongoMemoryServer } from "mongodb-memory-server";

export default async function globalSetup() {
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    // Store the URI and instance for teardown
    globalThis.__MONGOD__ = mongod;
    process.env.MONGO_URL = uri;
    process.env.JWT_SECRET = "test-jwt-secret-key";
}
