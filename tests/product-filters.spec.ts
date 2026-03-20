/* eslint-disable notice/notice */
// Amanda Quek, A0277779Y

import { test, expect } from "@playwright/test";
test.describe.configure({ mode: "parallel" });

test.describe("Product Filters Flow", () => {
  test.describe("Apply Filters", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/", { waitUntil: "networkidle" });

      await expect(page.getByTestId("homepage")).toBeVisible();
      await expect(page.getByTestId("filters-panel")).toBeVisible();
    });

    test("should allow user to apply a category filter on homepage", async ({
      page,
    }) => {
      const firstCategoryFilter = page
        .locator('[data-testid^="category-filter-"]')
        .first();

      await firstCategoryFilter.waitFor({ state: "visible" });
      await firstCategoryFilter.click();

      await expect(page.getByTestId("product-grid")).toBeVisible();
      await expect(
        page.locator('[data-testid^="product-card-"]').first()
      ).toBeVisible();
    });
  });

  test.describe("Reset Filters", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/", { waitUntil: "networkidle" });

      await expect(page.getByTestId("homepage")).toBeVisible();
      await expect(page.getByTestId("filters-panel")).toBeVisible();

      const firstCategoryFilter = page
        .locator('[data-testid^="category-filter-"]')
        .first();

      await firstCategoryFilter.waitFor({ state: "visible" });
      await firstCategoryFilter.click();
    });

    test("should allow user to reset filters safely", async ({ page }) => {
      await expect(page.getByTestId("reset-filters-btn")).toBeVisible();
      await page.waitForLoadState("networkidle");

      await page.getByTestId("reset-filters-btn").click();

      await expect(page.getByTestId("homepage")).toBeVisible();
      await expect(page.getByTestId("filters-panel")).toBeVisible();
    });
  });
});