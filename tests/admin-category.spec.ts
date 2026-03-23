/* eslint-disable notice/notice */
// Fajar Ibnu Fatihan, A0314606L

import { test, expect } from "@playwright/test";

test.describe.serial("Admin Category Management", () => {
  const uniqueName = `TestCat ${Date.now()}`;
  const updatedName = `UpdatedCat ${Date.now()}`;

  test.beforeEach(async ({ page, request }) => {
    // Login as admin via API and set auth in localStorage
    const response = await request.post("/api/v1/auth/login", {
      data: {
        email: process.env.ADMIN_TEST_EMAIL,
        password: process.env.ADMIN_TEST_PASSWORD,
      },
    });
    const data = await response.json();
    await page.goto("/login");
    await page.evaluate((authData) => {
      localStorage.setItem("auth", JSON.stringify(authData));
    }, data);
  });

  test("should create a new category", async ({ page }) => {
    await page.goto("/dashboard/admin/create-category");
    await page.waitForLoadState("networkidle");

    await page.getByPlaceholder("Enter new category").fill(uniqueName);
    await page.getByRole("button", { name: "Submit" }).click();

    await expect(page.getByText(`${uniqueName} is created`)).toBeVisible();
    await expect(page.getByRole("cell", { name: uniqueName })).toBeVisible();
  });

  test("should update the category", async ({ page }) => {
    await page.goto("/dashboard/admin/create-category");
    await page.waitForLoadState("networkidle");

    // Find the row with our category and click Edit
    const row = page.locator("tr").filter({ hasText: uniqueName });
    await row.getByRole("button", { name: "Edit" }).click();

    // Wait for modal and fill updated name
    const modal = page.locator(".ant-modal-content");
    await expect(modal).toBeVisible();

    const modalInput = modal.getByPlaceholder("Enter new category");
    await modalInput.clear();
    await modalInput.fill(updatedName);
    await modal.getByRole("button", { name: "Submit" }).click();

    await expect(page.getByText(`${updatedName} is updated`)).toBeVisible();
  });

  test("should delete the category", async ({ page }) => {
    await page.goto("/dashboard/admin/create-category");
    await page.waitForLoadState("networkidle");

    // Find the row with updated category and click Delete
    const row = page.locator("tr").filter({ hasText: updatedName });
    await row.getByRole("button", { name: "Delete" }).click();

    await expect(page.getByText("category is deleted")).toBeVisible();
  });
});
