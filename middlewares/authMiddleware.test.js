// Fajar Ibnu Fatihan, A0314606L

import JWT from "jsonwebtoken";
import { requireSignIn, isAdmin } from "./authMiddleware.js";
import userModel from "../models/userModel.js";
import { silenceConsole } from "../controllers/_tests_/utils.js";


jest.mock("jsonwebtoken");
jest.mock("../models/userModel.js");

describe('requireSignIn middleware', () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
        req = {
            headers: {
                authorization: 'aaassssvvvbbbdddd1234567890qwertyuiopasdfghjklzxcvbnm'
            }
        };
        res = {};
        next = jest.fn();
        jest.clearAllMocks();
        restoreConsole = silenceConsole();
    });

    test('should call next() and set request user if token is valid', async () => {
        const mockUser = { _id: '29', name: 'Ben Ten' };
        JWT.verify.mockReturnValue(mockUser);

        await requireSignIn(req, res, next);

        expect(JWT.verify).toHaveBeenCalledWith('aaassssvvvbbbdddd1234567890qwertyuiopasdfghjklzxcvbnm', process.env.JWT_SECRET);
        expect(req.user).toEqual(mockUser);
        expect(next).toHaveBeenCalled();
    });

    test('should not call next() if token is invalid', async () => {
        JWT.verify.mockImplementation(() => {
            throw new Error('invalid token');
        });

        await requireSignIn(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(req.user).toBeUndefined();
    });

});

describe('isAdmin middleware', () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
        req = {
            user: { _id: 'realUser666' }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn()
        };
        next = jest.fn();
        jest.clearAllMocks();
        restoreConsole = silenceConsole();
    });

    test('testing isAdmin should call next() if user is admin (role === 1)', async () => {
        const fakeUserAdmin = { _id: 'realUser666', role: 1 };
        userModel.findById.mockResolvedValue(fakeUserAdmin);

        await isAdmin(req, res, next);

        expect(userModel.findById).toHaveBeenCalledWith('realUser666');
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    test('testing if input is not an admin (role !== 1)', async () => {
        const fakeUserNotAdmin = { _id: 'realUser666', role: 4 };
        userModel.findById.mockResolvedValue(fakeUserNotAdmin);

        await isAdmin(req, res, next);

        expect(userModel.findById).toHaveBeenCalledWith('realUser666');
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should return 401 with error message if database error occurs', async () => {
        const mockError = new Error('Database connection failed');
        userModel.findById.mockRejectedValue(mockError);

        await isAdmin(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            error: mockError,
            message: "Error in admin middleware",
        });
    });
});