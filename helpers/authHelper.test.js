// Fajar Ibnu Fatihan, A0314606L

import { hashPassword, comparePassword } from "./authHelper";
import { silenceConsole } from "../controllers/_tests_/utils.js";

describe('authHelper', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        restoreConsole = silenceConsole();
    });

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

    test('test comparePassword should return true if password matches', async () => {
        const password = 'password123';
        const hashed = await hashPassword(password);

        const hashedResult = await comparePassword(password, hashed);
        expect(hashedResult).toBe(true);
    });

    test('test comparePassword should return false if password return non-matching result', async () => {
        const password = 'password123';
        const hashed = await hashPassword(password);

        const hashedResult = await comparePassword('anotherPassword123', hashed);
        expect(hashedResult).toBe(false);
    });
});