/* eslint-disable notice/notice */
// Amanda Quek, A0277779Y

import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "parallel" });
test.describe("Product Photo Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    const firstDetailsBtn = page
      .locator('[data-testid^="more-details-"]')
      .first();

    await firstDetailsBtn.waitFor({ state: "visible" });
    await firstDetailsBtn.click();

    await expect(page.getByTestId("product-details-page")).toBeVisible();
  });

  test("should display product image on product details page", async ({ page }) => {
    const image = page.getByTestId("product-details-image");

    await image.waitFor({ state: "visible" });
    await expect(image).toBeVisible();

    await expect(image).toHaveAttribute("src", /product-photo/);

    const src = await image.getAttribute("src");
    if (!src) throw new Error("Image src is null");

    expect(src).toContain("product-photo");
  });

});