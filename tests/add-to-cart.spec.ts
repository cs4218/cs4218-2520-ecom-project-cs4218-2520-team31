/* eslint-disable notice/notice */
// Amanda Quek, A0277779Y

import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "parallel" });
test.describe("Add to Cart Flow", () => {

  test.beforeEach(async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.evaluate(() => localStorage.removeItem("cart"));
  });

  test("should allow user to add a product to cart from homepage", async ({ page }) => {
    const addToCartBtn = page
      .locator('[data-testid^="add-to-cart-"]')
      .first();

    await addToCartBtn.waitFor({ state: "visible" });
    await addToCartBtn.click();

    const cartValue = await page.evaluate(() => localStorage.getItem("cart"));
    expect(cartValue).not.toBeNull();

    const parsed = JSON.parse(cartValue!);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThan(0);
  });

});