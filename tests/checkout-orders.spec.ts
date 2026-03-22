// Brenna Lauren Tan Jia Ern, A0254710M

import { test, expect } from '@playwright/test';

const TEST_USER = {
  email: "test@mail.com",
  password: "testtest",
}

const TEST_CREDIT_CARD = {
  card_number: "4111111111111111",
  expiry_date: "1029",
  cvv: "123",
}

test.describe("User Purchase Flow", () => {
  test.setTimeout(30000);

  test.beforeEach(async ({ page }) => {
    // navigate to landing page
    await page.goto('http://localhost:3000/');
  });

  test('user can complete purchase and see order', async ({ page }) => {

    // login
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Email' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill(TEST_USER.email);
    await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill(TEST_USER.password);
    await page.getByRole('button', { name: 'LOGIN' }).click();

    // add first item to cart
    await page.getByRole('button', { name: 'ADD TO CART' }).first().click()

    // go to cart
    await page.getByRole('link', { name: 'Cart' }).click();

    // pay
    await page.getByRole('button', { name: 'Paying with Card' }).click();

    // enter credit card details
    await page.locator('iframe[name="braintree-hosted-field-number"]').contentFrame().getByRole('textbox', { name: 'Credit Card Number' }).click();
    await page.locator('iframe[name="braintree-hosted-field-number"]').contentFrame().getByRole('textbox', { name: 'Credit Card Number' }).fill(TEST_CREDIT_CARD.card_number);
    await page.locator('iframe[name="braintree-hosted-field-expirationDate"]').contentFrame().getByRole('textbox', { name: 'Expiration Date' }).click();
    await page.locator('iframe[name="braintree-hosted-field-expirationDate"]').contentFrame().getByRole('textbox', { name: 'Expiration Date' }).fill(TEST_CREDIT_CARD.expiry_date);
    await page.locator('iframe[name="braintree-hosted-field-cvv"]').contentFrame().getByRole('textbox', { name: 'CVV' }).click();
    await page.locator('iframe[name="braintree-hosted-field-cvv"]').contentFrame().getByRole('textbox', { name: 'CVV' }).fill(TEST_CREDIT_CARD.cvv);

    // submit payment
    await page.getByRole('button', { name: 'Make Payment' }).click();

    // navigate to orders page
    await page.goto('http://localhost:3000/dashboard/user/orders');

    // click orders button
    await page.getByText('Orders').nth(1).click();

    // check for correct orders page
    await expect(page.getByRole('heading', { name: /all orders|orders/i })).toBeVisible();

    // check for successful purchase
    await expect(page.getByText('Success').first()).toBeVisible();
    await expect(page.getByText('a few seconds ago').first()).toBeVisible();
  });
});