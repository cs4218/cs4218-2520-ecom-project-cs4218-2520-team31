/* eslint-disable notice/notice */
// Fajar Ibnu Fatihan, A0314606L

import { test, expect } from "@playwright/test";

const TEST_USER = {
  name: "Error Test User",
  email: `errortest_${Date.now()}@test.com`,
  password: "password123",
  phone: "1234567890",
  address: "123 Test Street",
  DOB: "2000-01-01",
  answer: "football",
};

test.describe("Authentication Error Handling", () => {
  test("should show error toast on invalid password", async ({
    page,
    request,
  }) => {
    // Register user first
    await request.post("/api/v1/auth/register", { data: TEST_USER });

    await page.goto("/login");

    await page.getByPlaceholder("Enter Your Email").fill(TEST_USER.email);
    await page.getByPlaceholder("Enter Your Password").fill("wrongpassword");
    await page.getByRole("button", { name: "LOGIN" }).click();

    await expect(page.getByText("Invalid Password")).toBeVisible();
  });

  test("should redirect unauthenticated user from protected route", async ({
    page,
  }) => {
    await page.goto("/dashboard/user/orders");

    // Spinner shows countdown message
    await expect(
      page.getByText(/redirecting to you in/i)
    ).toBeVisible();

    // After countdown, should redirect to login page
    await expect(page).toHaveURL("/login", { timeout: 10000 });
  });
});
