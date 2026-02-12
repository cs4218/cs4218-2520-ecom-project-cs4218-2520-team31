import { hashPassword, comparePassword } from "./authHelper";

describe('authHelper', () => {
    test('test hashPassword should return a hashed string', async () => {
        const password = 'password123';
        const hashed = await hashPassword(password);

        expect(hashed).toBeDefined();
        expect(hashed).not.toBe(password);
    });

    test('test hashPassword return an error if bcrypt fail to hash', async () => {
        const password = undefined;
        const hashed = await hashPassword(password);

        expect(hashed).toBeUndefined();
    });
});