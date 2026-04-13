// For AI test demo
import { updateProfileController } from '../authController.js';
import userModel from '../../models/userModel.js';
import * as authHelper from '../../helpers/authHelper.js';

jest.mock('../../models/userModel.js', () => ({
    __esModule: true,
    default: {
        findById: jest.fn(),
        findByIdAndUpdate: jest.fn(),
    },
}));

jest.mock('../../helpers/authHelper.js', () => ({
    __esModule: true,
    comparePassword: jest.fn(),
    hashPassword: jest.fn(),
}));

const makeRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('updateProfileController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('rejects password shorter than 6 characters', async () => {
        userModel.findById.mockResolvedValue({
            _id: 'user123',
            name: 'Old Name',
            email: 'old@example.com',
            phone: '12345678',
            address: 'Old Address',
            password: 'hashed-old',
        });

        const req = {
            user: { _id: 'user123' },
            body: {
                password: '123',
            },
        };
        const res = makeRes();

        await updateProfileController(req, res);

        expect(userModel.findById).toHaveBeenCalledWith('user123');
        expect(res.json).toHaveBeenCalledWith({
            error: 'Passsword is required and 6 character long',
        });
        expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('preserves unchanged fields during partial update', async () => {
        userModel.findById.mockResolvedValue({
            _id: 'user123',
            name: 'Old Name',
            email: 'old@example.com',
            phone: '12345678',
            address: 'Old Address',
            password: 'hashed-old',
        });

        userModel.findByIdAndUpdate.mockResolvedValue({
            _id: 'user123',
            name: 'New Name',
            email: 'old@example.com',
            phone: '12345678',
            address: 'Old Address',
            password: 'hashed-old',
        });

        const req = {
            user: { _id: 'user123' },
            body: {
                name: 'New Name',
            },
        };
        const res = makeRes();

        await updateProfileController(req, res);

        expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
            'user123',
            {
                name: 'New Name',
                password: 'hashed-old',
                phone: '12345678',
                address: 'Old Address',
            },
            { new: true }
        );

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                message: 'Profile Updated SUccessfully',
            })
        );
    });

    it('documents current behavior: email is not included in update payload', async () => {
        userModel.findById.mockResolvedValue({
            _id: 'user123',
            name: 'Old Name',
            email: 'old@example.com',
            phone: '12345678',
            address: 'Old Address',
            password: 'hashed-old',
        });

        userModel.findByIdAndUpdate.mockResolvedValue({
            _id: 'user123',
            name: 'Old Name',
            email: 'old@example.com',
            phone: '12345678',
            address: 'Old Address',
            password: 'hashed-old',
        });

        const req = {
            user: { _id: 'user123' },
            body: {
                email: 'new@example.com',
            },
        };
        const res = makeRes();

        await updateProfileController(req, res);

        const updatePayload = userModel.findByIdAndUpdate.mock.calls[0][1];

        expect(updatePayload.email).toBeUndefined();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('hashes password when a valid new password is provided', async () => {
        userModel.findById.mockResolvedValue({
            _id: 'user123',
            name: 'Old Name',
            email: 'old@example.com',
            phone: '12345678',
            address: 'Old Address',
            password: 'hashed-old',
        });

        authHelper.hashPassword.mockResolvedValue('hashed-new-password');

        userModel.findByIdAndUpdate.mockResolvedValue({
            _id: 'user123',
            name: 'Old Name',
            email: 'old@example.com',
            phone: '12345678',
            address: 'Old Address',
            password: 'hashed-new-password',
        });

        const req = {
            user: { _id: 'user123' },
            body: {
                password: 'newpassword123',
            },
        };
        const res = makeRes();

        await updateProfileController(req, res);

        expect(authHelper.hashPassword).toHaveBeenCalledWith('newpassword123');
        expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
            'user123',
            {
                name: 'Old Name',
                password: 'hashed-new-password',
                phone: '12345678',
                address: 'Old Address',
            },
            { new: true }
        );
    });

    it('returns 400 when findById throws', async () => {
        userModel.findById.mockRejectedValue(new Error('DB fail'));

        const req = {
            user: { _id: 'user123' },
            body: {},
        };
        const res = makeRes();

        await updateProfileController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                message: 'Error While Update profile',
            })
        );
    });
});