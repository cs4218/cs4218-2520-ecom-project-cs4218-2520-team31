// Brenna Lauren Tan Jia Ern, A0254710M

import { test, expect } from "@playwright/test";
import path from 'path';

const TEST_PRODUCT = {
  name: "Sonic Book",
  url_suffix: "Sonic-Book",
  description: "A random book",
  image_name: "test_image.png",
  price: "59.99",
  quantity: "2",
}

const TEST_PRODUCT_2 = {
  name: "Mario Book",
  url_suffix: "Mario-Book",
  description: "Another random book",
  image_name: "test_image_2.png",
  price: "69.99",
  quantity: "3",
}

test.describe("Admin Product Management Flow", () => {
  test.setTimeout(30000);

  test.beforeEach(async ({ page }) => {

    // navigate to landing page
    await page.goto('http://localhost:3000/');

    // login as admin
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Email' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill(process.env.ADMIN_TEST_EMAIL!);
    await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill(process.env.ADMIN_TEST_PASSWORD!);
    await page.getByRole('button', { name: 'LOGIN' }).click();
    await expect(page).toHaveURL("/");
  });

  test('admin can create new product', async ({ page }) => {
    // flow: create test product 1 -> verify test product 1 created -> delete test product 1
    // (cleans up database each time)

    // navigate to admin create product page
    await page.goto('http://localhost:3000/dashboard/admin/create-product');
    await page.waitForLoadState("networkidle");

    // select product category
    await page.locator('div').filter({ hasText: /^Select a category$/ }).first().click();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    // upload product picture
    await page.getByText('Upload Photo').click();
    await page.locator('input[name="photo"]').setInputFiles(path.join(__dirname, TEST_PRODUCT.image_name));

    // fill product name
    await page.getByRole('textbox', { name: 'write a name' }).click();
    await page.getByRole('textbox', { name: 'write a name' }).fill(TEST_PRODUCT.name);

    // fill product description
    await page.getByRole('textbox', { name: 'write a description' }).click();
    await page.getByRole('textbox', { name: 'write a description' }).fill(TEST_PRODUCT.description);

    // fill product price
    await page.getByPlaceholder('write a Price').click();
    await page.getByPlaceholder('write a Price').fill(TEST_PRODUCT.price);

    // fill product quantity
    await page.getByPlaceholder('write a quantity').click();
    await page.getByPlaceholder('write a quantity').fill(TEST_PRODUCT.quantity);

    // fill product shipping option
    await page.locator('#rc_select_1').click();
    await page.getByText('Yes').click();

    // click create product button
    await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();

    // wait to get redirected
    await page.waitForURL('**/dashboard/admin/products');

    // click products page button
    await page.getByText('Products').nth(1).click();

    // verify added item is listed in products page
    const expectedProduct = page.locator('card m-2').filter({
      hasText: TEST_PRODUCT.name,
    });
    expect(expectedProduct.isVisible());

    // wait to be redirected back to products page
    await page.waitForURL('**/dashboard/admin/products');

    // BELOW: DELETE ITEM SEQUENCE

    // click added product
    await page.getByText(TEST_PRODUCT.name).first().click();
    const pageTitle = page.locator('col-md-9').filter({
      hasText: "Update Product",
    });
    expect(pageTitle.isVisible());

    // wait for page to load
    await page.getByText(TEST_PRODUCT.name).isVisible();
    await page.waitForTimeout(500);

    // prepare delete prompt response
    page.once('dialog', async (dialog) => {
      expect(dialog.type()).toBe('prompt');
      expect(dialog.message()).toMatch("Are you sure you want to delete this product?");
      await dialog.accept('yes');
    });

    // click delete (prompt response fires immediately)
    await page.getByRole('button', { name: 'DELETE PRODUCT' }).click();

    // wait to get redirected to products page
    await page.waitForURL('**/dashboard/admin/products');

    // verify that test product has been deleted
    await expect(page.getByText(TEST_PRODUCT.name)).toHaveCount(0);

  });

  test("admin can update existing product", async ({ page }) => {

    // flow: create test product 1 -> verify test product 1 created -> update to test product 2 -> verify test product 2 updated
    //       -> delete test product 2
    // (cleans up database each time)

    // navigate to admin create product page
    await page.goto('http://localhost:3000/dashboard/admin/create-product');
    await page.waitForLoadState("networkidle");

    // select product category
    await page.locator('div').filter({ hasText: /^Select a category$/ }).first().click();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    // upload product picture
    await page.getByText('Upload Photo').click();
    await page.locator('input[name="photo"]').setInputFiles(path.join(__dirname, TEST_PRODUCT.image_name));

    // fill product name
    await page.getByRole('textbox', { name: 'write a name' }).click();
    await page.getByRole('textbox', { name: 'write a name' }).fill(TEST_PRODUCT.name);

    // fill product description
    await page.getByRole('textbox', { name: 'write a description' }).click();
    await page.getByRole('textbox', { name: 'write a description' }).fill(TEST_PRODUCT.description);

    // fill product price
    await page.getByPlaceholder('write a Price').click();
    await page.getByPlaceholder('write a Price').fill(TEST_PRODUCT.price);

    // fill product quantity
    await page.getByPlaceholder('write a quantity').click();
    await page.getByPlaceholder('write a quantity').fill(TEST_PRODUCT.quantity);

    // fill product shipping option
    await page.locator('#rc_select_1').click();
    await page.getByText('Yes').click();
    await page.waitForTimeout(200);

    // click create product button
    await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();

    // wait to get redirected
    await page.waitForURL('**/dashboard/admin/products');

    // click products page button
    await page.getByText('Products').nth(1).click();

    // verify added item is listed in products page
    const expectedProduct2 = page.locator('card m-2').filter({
      hasText: TEST_PRODUCT.name,
    });
    expect(expectedProduct2.isVisible());

    // click test product 1
    await page.getByText(TEST_PRODUCT.name).first().click();

    // wait until page has loaded
    const pageTitle = page.locator('col-md-9').filter({
      hasText: "Update Product",
    });
    expect(pageTitle.isVisible());
    await page.waitForURL('**/dashboard/admin/product/' + TEST_PRODUCT.url_suffix);
    //await page.getByText(TEST_PRODUCT.name).isVisible();
    await page.waitForTimeout(500);

    // upload updated product picture
    await page.getByText('Upload Photo').click();
    await page.locator('input[name="photo"]').setInputFiles(path.join(__dirname, TEST_PRODUCT_2.image_name));

    // update product name
    await page.getByRole('textbox', { name: 'write a name' }).click();
    await page.getByRole('textbox', { name: 'write a name' }).fill(TEST_PRODUCT_2.name);

    // update product description
    await page.getByRole('textbox', { name: 'write a description' }).click();
    await page.getByRole('textbox', { name: 'write a description' }).fill(TEST_PRODUCT_2.description);

    // update product price
    await page.getByPlaceholder('write a Price').click();
    await page.getByPlaceholder('write a Price').fill(TEST_PRODUCT_2.price);

    // update product quantity
    await page.getByPlaceholder('write a quantity').click();
    await page.getByPlaceholder('write a quantity').fill(TEST_PRODUCT_2.quantity);

    // click update product button
    await page.getByRole('button', { name: 'UPDATE PRODUCT' }).click();

    // wait for site to stabilise
    await page.waitForLoadState("networkidle");

    // click products page button
    await page.getByRole('link', { name: 'Products' }).click();

    // verify updated item is listed in products page
    const expectedProduct = page.locator('card m-2').filter({
      hasText: TEST_PRODUCT_2.name,
    });
    expect(expectedProduct.isVisible());

    // wait to be redirected back to products page
    await page.waitForURL('**/dashboard/admin/products');

    // BELOW: DELETE ITEM SEQUENCE

    // click updated product (test product 2)
    await page.getByText(TEST_PRODUCT_2.name).first().click();
    //expect(pageTitle.isVisible());
    await page.waitForURL('**/dashboard/admin/product/' + TEST_PRODUCT_2.url_suffix);

    // wait for page to load
    await page.getByText(TEST_PRODUCT_2.name).isVisible();
    await page.waitForTimeout(500);

    // prepare delete prompt response
    page.once('dialog', async (dialog) => {
      expect(dialog.type()).toBe('prompt');
      expect(dialog.message()).toMatch("Are you sure you want to delete this product?");
      await dialog.accept('yes');
    });

    // click delete (prompt response fires immediately)
    await page.getByRole('button', { name: 'DELETE PRODUCT' }).click();

    // wait to get redirected to products page
    await page.waitForURL('**/dashboard/admin/products');

    // verify that test product 2 has been deleted
    await expect(page.getByText(TEST_PRODUCT_2.name)).toHaveCount(0);
  });
});