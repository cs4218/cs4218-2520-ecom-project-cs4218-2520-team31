/* eslint-disable notice/notice */
// Amanda Quek, A0277779Y

/* eslint-disable notice/notice */
// Amanda Quek, A0277779Y

import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "parallel" });

test.describe("Product Search Flow", () => {
  test.describe("Search With Results", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/", { waitUntil: "networkidle" });
    });

    test("should allow user to search for a product and see results", async ({
      page,
    }) => {
      const searchInput = page.getByPlaceholder("Search");
      const searchButton = page.getByRole("button", { name: "Search" });

      await searchInput.waitFor({ state: "visible" });
      await searchInput.fill("phone");
      await searchButton.click();

      await expect(page).toHaveURL(/\/search/);
      await expect(page.getByRole("heading", { name: "Search Resuts" })).toBeVisible();
      await expect(page.getByText(/Found \d+/)).toBeVisible();
      await expect(page.locator(".card").first()).toBeVisible();
    });
  });

  test.describe("Search With No Results", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/", { waitUntil: "networkidle" });
    });

    test("should show an empty state when search has no matching results", async ({
      page,
    }) => {
      const searchInput = page.getByPlaceholder("Search");
      const searchButton = page.getByRole("button", { name: "Search" });

      await searchInput.waitFor({ state: "visible" });
      await searchInput.fill("zzzzzz");
      await searchButton.click();

      await expect(page).toHaveURL(/\/search/);
      await expect(page.getByRole("heading", { name: "Search Resuts" })).toBeVisible();
      await expect(page.getByText("No Products Found")).toBeVisible();
    });
  });
});