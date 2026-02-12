import JWT from "jsonwebtoken";
import { requireSignIn } from "./authMiddleware.js";

jest.mock("jsonwebtoken");

describe('requireSignIn middleware', () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
        req = {
            headers: {
                authorization: 'fake-token'
            }
        };
        res = {};
        next = jest.fn();
        jest.clearAllMocks();
    });

    test('should call next() and set request user if token is valid', async () => {
        const mockUser = { _id: '123', name: 'Test User' };
        JWT.verify.mockReturnValue(mockUser);

        await requireSignIn(req, res, next);

        expect(JWT.verify).toHaveBeenCalledWith('fake-token', process.env.JWT_SECRET);
        expect(req.user).toEqual(mockUser);
        expect(next).toHaveBeenCalled();
    });
});