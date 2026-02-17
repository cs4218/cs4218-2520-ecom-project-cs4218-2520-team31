import { registerController } from "./authController.js";
import { silenceConsole, mockRes } from "./_tests_/utils.js";
import { hashPassword } from "../helpers/authHelper.js";
import userModel from "../models/userModel.js";

jest.mock("../models/userModel.js");
jest.mock("jsonwebtoken");
jest.mock("../helpers/authHelper.js");

describe('testing registerController', () => {

    let req;
    let res;

    beforeEach(() => {
        req = {
            body: {
                name: "Tayo",
                email: "heytayo@nus.com",
                password: "realPassword321!",
                phone: "9999999222299",
                address: "computing drive",
                answer: "this is the real answer"
            }
        }
        res = mockRes();
        jest.clearAllMocks();
        silenceConsole();
    });

    test('should register a new user successfully when all fields are provided', async () => {
        const theRealUser = req.body;
        userModel.findOne.mockResolvedValue(null);
        hashPassword.mockResolvedValue("hfhdhfjskskflso9e093jffi");

        const mockSave = jest.fn().mockResolvedValue(theRealUser);
        userModel.mockImplementation(() => ({
            save: mockSave
        }))

        await registerController(req, res);

        expect(userModel.findOne).toHaveBeenCalledWith({ email: theRealUser.email })
        expect(hashPassword).toHaveBeenCalledWith(theRealUser.password);
        expect(mockSave).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.send).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                message: "User Register Successfully"
            })
        )
    });

    test('should return error when name is missing', async () => {
        req.body.name = "";
        await registerController(req, res);
        // uses "error" key instead of "message"
        expect(res.send).toHaveBeenCalledWith({ error: "Name is Required" });
    });

    test('should return message when email is missing', async () => {
        req.body.email = "";
        await registerController(req, res);
        expect(res.send).toHaveBeenCalledWith({ message: "Email is Required" });
    });

    test('should return message when password is missing', async () => {
        req.body.password = "";
        await registerController(req, res);
        expect(res.send).toHaveBeenCalledWith({ message: "Password is Required" });
    });

    test('should return message when phone is missing', async () => {
        req.body.phone = "";
        await registerController(req, res);
        expect(res.send).toHaveBeenCalledWith({ message: "Phone no is Required" });
    });

    test('should return message when address is missing', async () => {
        req.body.address = "";
        await registerController(req, res);
        expect(res.send).toHaveBeenCalledWith({ message: "Address is Required" });
    });

    test('should return message when answer is missing', async () => {
        req.body.answer = "";
        await registerController(req, res);
        expect(res.send).toHaveBeenCalledWith({ message: "Answer is Required" });
    });

    test('should return 200/false when user already registered', async () => {
        userModel.findOne.mockResolvedValue(req.body.email);

        await registerController(req, res);

        expect(userModel.findOne).toHaveBeenCalledWith({ email: "heytayo@nus.com" });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                message: "Already Register please login"
            })
        );
    });

    test('should return 500/false when registration fails', async () => {
        userModel.findOne.mockResolvedValue(null);
        hashPassword.mockRejectedValue(new Error("Failed to hash password"));

        await registerController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                message: "Errro in Registeration",
                error: expect.any(Error)
            })
        );
    })
});