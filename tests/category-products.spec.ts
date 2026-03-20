/* eslint-disable notice/notice */
// Amanda Quek, A0277779Y

import { test, expect } from "@playwright/test";

test.describe("Category → Product Flow", () => {

  test.describe("Category Navigation", () => {

    test.beforeEach(async ({ page }) => {
      await page.goto("/categories", { waitUntil: "networkidle" });

      await expect(page.getByTestId("categories-page")).toBeVisible();
    });

    test("should allow user to navigate to category page", async ({ page }) => {
      const firstCategoryLink = page
        .locator('[data-testid^="category-link-"]')
        .first();

      await firstCategoryLink.waitFor({ state: "visible" });
      await firstCategoryLink.click();

      await expect(page).toHaveURL(/\/category\//);
      await expect(page.getByTestId("category-page")).toBeVisible();
    });

  });

  test.describe("Category → Product Details", () => {

    test.beforeEach(async ({ page }) => {
      await page.goto("/categories", { waitUntil: "networkidle" });

      const firstCategoryLink = page
        .locator('[data-testid^="category-link-"]')
        .first();

      await firstCategoryLink.waitFor({ state: "visible" });
      await firstCategoryLink.click();

      await expect(page.getByTestId("category-page")).toBeVisible();
    });

    test("should open product details", async ({ page }) => {
      const btn = page
        .locator('[data-testid^="category-more-details-"]')
        .first();

      await btn.waitFor({ state: "visible" });
      await btn.click();

      await expect(page).toHaveURL(/\/product\//);
      await expect(page.getByTestId("product-details-page")).toBeVisible();
    });

  });

});