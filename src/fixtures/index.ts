import { test as base } from '@playwright/test';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { InventoryPage } from '../pages/InventoryPage';
import { LoginPage } from '../pages/LoginPage';
import { PASSWORD, users } from '../data/users';

type Pages = {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  /** An already logged-in inventory page: login cost is paid once per test, in the fixture. */
  loggedInInventory: InventoryPage;
};

/**
 * Composition over inheritance: page objects are exposed as fixtures, so a test
 * only declares what it needs and Playwright builds (and tears down) it lazily.
 */
export const test = base.extend<Pages>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  inventoryPage: async ({ page }, use) => use(new InventoryPage(page)),
  cartPage: async ({ page }, use) => use(new CartPage(page)),
  checkoutPage: async ({ page }, use) => use(new CheckoutPage(page)),
  loggedInInventory: async ({ page, loginPage, inventoryPage }, use) => {
    await loginPage.goto();
    await loginPage.login(users.standard, PASSWORD);
    await inventoryPage.expectLoaded();
    await use(inventoryPage);
  },
});

export { expect } from '@playwright/test';
