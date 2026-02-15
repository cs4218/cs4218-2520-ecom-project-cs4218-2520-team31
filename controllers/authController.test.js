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
        const mockSave = jest.fn().mockResolvedValue(theRealUser);

        userModel.findOne.mockResolvedValue(null);

        hashPassword.mockResolvedValue("hfhdhfjskskflso9e093jffi");

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
});