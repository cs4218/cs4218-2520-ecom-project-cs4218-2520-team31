/* eslint-disable notice/notice */
// Amanda Quek, A0277779Y

import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "parallel" });

test.describe("Product List → Product Details Journey", () => {

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("homepage")).toBeVisible();
  });

  test("should allow user to browse products and view product details", async ({ page }) => {
    await expect(page.getByText("All Products")).toBeVisible();

    const firstDetailsBtn = page
      .locator('[data-testid^="more-details-"]')
      .first();

    await expect(firstDetailsBtn).toBeVisible();
    await firstDetailsBtn.click();

    await expect(page).toHaveURL(/\/product\//);
    await expect(page.getByTestId("product-details-page")).toBeVisible();
    await expect(page.getByTestId("product-details-heading"))
      .toHaveText(/Product Details/i);
  });

  test("should handle invalid product route gracefully", async ({ page }) => {
    await page.goto("/product/does-not-exist");

    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByText(/not found/i)).toBeVisible();
  });

  test("should display multiple products on homepage", async ({ page }) => {
    const firstProduct = page.locator('[data-testid^="product-card-"]').first();

    await firstProduct.waitFor({ state: "visible" });

    const products = page.locator('[data-testid^="product-card-"]');
    const count = await products.count();

    expect(count).toBeGreaterThan(0);
  });

});