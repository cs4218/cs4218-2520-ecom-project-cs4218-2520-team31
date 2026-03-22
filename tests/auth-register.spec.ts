/* eslint-disable notice/notice */
// Fajar Ibnu Fatihan, A0314606L

import { test, expect } from "@playwright/test";

test.describe("Registration Flow", () => {
  test("should register a new user and redirect to login page", async ({
    page,
  }) => {
    const uniqueEmail = `testuser_${Date.now()}@test.com`;

    await page.goto("/register");

    await page.getByPlaceholder("Enter Your Name").fill("Test User");
    await page.getByPlaceholder("Enter Your Email").fill(uniqueEmail);
    await page.getByPlaceholder("Enter Your Password").fill("password123");
    await page.getByPlaceholder("Enter Your Phone").fill("1234567890");
    await page.getByPlaceholder("Enter Your Address").fill("123 Test Street");
    await page.getByPlaceholder("Enter Your DOB").fill("2000-01-01");
    await page
      .getByPlaceholder("What is Your Favorite sports")
      .fill("football");

    await page.getByRole("button", { name: "REGISTER" }).click();

    await expect(
      page.getByText("Register Successfully, please login")
    ).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});
