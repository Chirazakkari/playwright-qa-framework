import { PASSWORD, users } from '../../src/data/users';
import { expect, test } from '../../src/fixtures';

test.describe('Authentication', () => {
  test('a standard user reaches the inventory', async ({ loginPage, inventoryPage }) => {
    await loginPage.goto();
    await loginPage.login(users.standard, PASSWORD);
    await inventoryPage.expectLoaded();
  });

  // Data-driven negative cases: one spec body, many rules, readable report.
  const rejected = [
    { name: 'locked out user', user: users.lockedOut, pass: PASSWORD, message: /locked out/i },
    { name: 'wrong password', user: users.standard, pass: 'nope', message: /do not match/i },
    { name: 'empty username', user: '', pass: PASSWORD, message: /Username is required/i },
    { name: 'empty password', user: users.standard, pass: '', message: /Password is required/i },
  ];

  for (const { name, user, pass, message } of rejected) {
    test(`rejects ${name}`, async ({ loginPage, page }) => {
      await loginPage.goto();
      await loginPage.login(user, pass);
      await loginPage.expectError(message);
      await expect(page).not.toHaveURL(/inventory/);
    });
  }

  test('protected pages redirect an anonymous visitor to login', async ({ page, loginPage }) => {
    await page.goto('/inventory.html');
    await expect(loginPage.error).toContainText(/only access '\/inventory\.html' when you are logged in/i);
  });
});
