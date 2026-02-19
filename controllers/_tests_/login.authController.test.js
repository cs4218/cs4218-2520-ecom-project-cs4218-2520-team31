import { registerController, loginController, forgotPasswordController } from "../authController.js";
import { silenceConsole, mockRes } from "./utils.js";
import { hashPassword, comparePassword } from "../../helpers/authHelper.js";
import userModel from "../../models/userModel.js";
import JWT from "jsonwebtoken"

jest.mock("../../models/userModel.js");
jest.mock("jsonwebtoken");
jest.mock("../../helpers/authHelper.js");

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
        userModel.findOne.mockResolvedValue({ email: "heytayo@nus.com", name: "Tayo" });

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
    });
});


describe('testing loginController', () => {

    let req;
    let res;

    beforeEach(() => {
        req = {
            body: {
                email: "heytayo@nus.com",
                password: "realPassword321!"
            }
        }
        res = mockRes();
        jest.clearAllMocks();
        silenceConsole();
    });

    test('should return 404 if email is missing', async () => {
        req.body.email = "";

        await loginController(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: "Invalid email or password"
        });
    });

    test('should return 404 if password is missing', async () => {
        req.body.password = "";

        await loginController(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: "Invalid email or password"
        });
    });

    test('should return 404 status if email is not registered', async () => {
        userModel.findOne.mockResolvedValue(null);

        await loginController(req, res);

        expect(userModel.findOne).toHaveBeenCalledWith({ email: req.body.email });
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: "Email is not registerd"
        })
    });

    test('should return 200 status if password is incorrect', async () => {
        userModel.findOne.mockResolvedValue({
            _id: "zzz111",
            email: "heytayo@nus.com",
            password: "hashedPasswordInDB"
        });
        comparePassword.mockResolvedValue(false);

        await loginController(req, res);

        expect(comparePassword).toHaveBeenCalledWith(req.body.password, "hashedPasswordInDB");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: "Invalid Password"
        });
    });

    test('should return 200 if user logged in sucessfully', async () => {
        JWT.sign.mockReturnValue("thisIsTheRealTokeeeennn");
        userModel.findOne.mockResolvedValue({
            _id: "zzz111",
            name: "Tayo",
            email: "heytayo@nus.com",
            password: "hashedPasswordInDB",
            phone: "9999999222299",
            address: "computing drive",
            role: 0
        });
        comparePassword.mockResolvedValue(true);

        await loginController(req, res);

        expect(comparePassword).toHaveBeenCalledWith(req.body.password, "hashedPasswordInDB");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: "login successfully",
            user: {
                _id: "zzz111",
                name: "Tayo",
                email: "heytayo@nus.com",
                phone: "9999999222299",
                address: "computing drive",
                role: 0
            },
            token: "thisIsTheRealTokeeeennn"
        });
    });

    test('should return 500/false when error in login', async () => {
        userModel.findOne.mockRejectedValue(new Error("DB connection failed!!!!"));

        await loginController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                message: "Error in login",
                error: expect.any(Error)
            })
        );
    });
});