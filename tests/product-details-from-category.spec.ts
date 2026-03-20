/* eslint-disable notice/notice */
// Amanda Quek, A0277779Y

import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "parallel" });

test.describe("Category to Product Details Journey", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/categories");
  });

  test("should allow me to navigate from categories page to category page to product details", async ({
    page,
  }) => {
    const firstCategoryLink = page.locator('[data-testid^="category-link-"]').first();
    await firstCategoryLink.click();

    await expect(page.getByTestId("category-page")).toBeVisible();
    await expect(page.getByTestId("category-heading")).toContainText("Category -");

    const firstProductBtn = page
      .locator('[data-testid^="category-more-details-"]')
      .first();

    await firstProductBtn.click();
    await expect(page).toHaveURL(/\/product\//);
    await expect(page.getByTestId("product-details-page")).toBeVisible();
    await expect(page.getByTestId("product-details-heading")).toHaveText(
      "Product Details"
    );
  });
});