/* eslint-disable notice/notice */
// Fajar Ibnu Fatihan, A0314606L

import { test, expect } from "@playwright/test";

const TEST_USER = {
  name: "Login Test User",
  email: `logintest_${Date.now()}@test.com`,
  password: "password123",
  phone: "1234567890",
  address: "123 Test Street",
  DOB: "2000-01-01",
  answer: "football",
};

test.describe("Login Flow", () => {
  test("should login successfully, land on home page, and show logout option", async ({
    page,
    request,
  }) => {
    // Register user via API first
    await request.post("/api/v1/auth/register", { data: TEST_USER });

    await page.goto("/login");

    await page.getByPlaceholder("Enter Your Email ").fill(TEST_USER.email);
    await page.getByPlaceholder("Enter Your Password").fill(TEST_USER.password);
    await page.getByRole("button", { name: "LOGIN" }).click();

    // Should land on home page
    await expect(page).toHaveURL("/");

    // User name should be visible in navbar
    await expect(page.getByText(TEST_USER.name)).toBeVisible();

    // Open user dropdown and verify Logout option is visible
    await page.getByText(TEST_USER.name).click();
    await expect(page.getByRole("link", { name: "Logout" })).toBeVisible();
  });
});
