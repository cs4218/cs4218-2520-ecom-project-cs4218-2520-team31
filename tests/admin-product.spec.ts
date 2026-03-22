/* eslint-disable notice/notice */
// Fajar Ibnu Fatihan, A0314606L

import { test, expect } from "@playwright/test";

test.describe("Admin Product Management", () => {
  test.setTimeout(30000);

  test.beforeEach(async ({ page }) => {
    // Login as admin via UI
    await page.goto("/login");
    await page.getByPlaceholder("Enter Your Email").fill(process.env.ADMIN_TEST_EMAIL!);
    await page.getByPlaceholder("Enter Your Password").fill(process.env.ADMIN_TEST_PASSWORD!);
    await page.getByRole("button", { name: "LOGIN" }).click();
    await expect(page).toHaveURL("/");
  });

  test("should create a new product", async ({ page }) => {
    await page.goto("/dashboard/admin/create-product");
    await page.waitForLoadState("networkidle");

    // Select category (click the combobox to open dropdown)
    await page.getByRole("combobox").first().click();
    await page
      .locator(".ant-select-item-option")
      .filter({ hasText: "Electronics" })
      .click();

    // Upload photo (minimal 1x1 PNG)
    await page.locator('input[name="photo"]').setInputFiles({
      name: "test-product.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "base64"
      ),
    });

    // Fill product details
    await page
      .getByPlaceholder("write a name")
      .fill(`Test Product ${Date.now()}`);
    await page
      .getByPlaceholder("write a description")
      .fill("A test product description");
    await page.getByPlaceholder("write a Price").fill("99");
    await page.getByPlaceholder("write a quantity").fill("10");

    // Select shipping (click the second combobox)
    await page.getByRole("combobox").last().click();
    await page
      .locator(".ant-select-item-option")
      .filter({ hasText: "Yes" })
      .click();

    // Submit
    await page.getByRole("button", { name: "CREATE PRODUCT" }).click();

    await expect(
      page.getByText("Product Created Successfully")
    ).toBeVisible();
  });

  test("should update an existing product", async ({ page }) => {
    await page.goto("/dashboard/admin/products");
    await page.waitForLoadState("networkidle");

    // Click first product to open update page
    await page.locator(".product-link").first().click();

    await expect(
      page.getByRole("heading", { name: "Update Product" })
    ).toBeVisible();

    // Wait for product data to load into the form
    const nameInput = page.getByPlaceholder("write a name");
    await expect(nameInput).not.toHaveValue("");

    // Update product name
    await nameInput.clear();
    await nameInput.fill(`Updated Product ${Date.now()}`);

    // Upload a photo (required by updateProductController)
    await page.locator('input[name="photo"]').setInputFiles({
      name: "test-product.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "base64"
      ),
    });

    await page.getByRole("button", { name: "UPDATE PRODUCT" }).click();

    await expect(
      page.getByText("Product Updated Successfully")
    ).toBeVisible();
  });
});
