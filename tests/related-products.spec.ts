/* eslint-disable notice/notice */
// Amanda Quek, A0277779Y

import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "parallel" });

test.describe("Related Products Flow", () => {

  test.describe("View Related Products", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/", { waitUntil: "networkidle" });

      const firstDetailsBtn = page
        .locator('[data-testid^="more-details-"]')
        .first();

      await firstDetailsBtn.waitFor({ state: "visible" });
      await firstDetailsBtn.click();

      await expect(page.getByTestId("product-details-page")).toBeVisible();
    });
    test("should display related products section on product details page", async ({ page }) => {
      await expect(page.getByTestId("related-products-section")).toBeVisible();
      await expect(page.getByTestId("related-products-heading"))
        .toContainText("Similar Products");
    });
  });

  test.describe("Navigate via Related Products", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/", { waitUntil: "networkidle" });

      const firstDetailsBtn = page
        .locator('[data-testid^="more-details-"]')
        .first();

      await firstDetailsBtn.waitFor({ state: "visible" });
      await firstDetailsBtn.click();

      await expect(page.getByTestId("product-details-page")).toBeVisible();
    });

    test("should allow navigation to another product from related products", async ({
      page,
    }) => {
      const relatedButtons = page.locator('[data-testid^="related-more-details-"]');
      const noRelatedText = page.getByTestId("no-related-products");

      await expect
        .poll(async () => {
          const relatedCount = await relatedButtons.count();
          const noRelatedCount = await noRelatedText.count();
          return relatedCount > 0 || noRelatedCount > 0;
        })
        .toBeTruthy();

      const relatedCount = await relatedButtons.count();

      if (relatedCount > 0) {
        const firstRelatedBtn = relatedButtons.first();
        await firstRelatedBtn.waitFor({ state: "visible" });
        await firstRelatedBtn.click();

        await expect(page).toHaveURL(/\/product\//);
        await expect(page.getByTestId("product-details-page")).toBeVisible();
      } else {
        await expect(noRelatedText).toBeVisible();
      }
    });

  });

});