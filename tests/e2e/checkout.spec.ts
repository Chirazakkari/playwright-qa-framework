import { checkoutInfo, products } from '../../src/data/users';
import { expect, test } from '../../src/fixtures';

test.describe('Checkout', () => {
  test('end-to-end purchase of two products', async ({
    loggedInInventory: inventory,
    cartPage,
    checkoutPage,
    page,
  }) => {
    await inventory.addToCart(products.backpack);
    await inventory.addToCart(products.bikeLight);
    await inventory.openCart();
    await cartPage.startCheckout();
    await checkoutPage.fillInformation(checkoutInfo);

    await test.step('order totals are arithmetically consistent', async () => {
      const { subtotal, tax, total } = await checkoutPage.amounts();
      expect(subtotal).toBeCloseTo(29.99 + 9.99, 2);
      expect(subtotal + tax).toBeCloseTo(total, 2);
    });

    await checkoutPage.finish();
    await expect(page).toHaveURL(/checkout-complete\.html/);
  });

  // Required-field rules, one case per missing field.
  const missing = [
    { field: 'first name', info: { ...checkoutInfo, firstName: '' }, message: /First Name is required/i },
    { field: 'last name', info: { ...checkoutInfo, lastName: '' }, message: /Last Name is required/i },
    { field: 'postal code', info: { ...checkoutInfo, postalCode: '' }, message: /Postal Code is required/i },
  ];

  for (const { field, info, message } of missing) {
    test(`blocks checkout without ${field}`, async ({
      loggedInInventory: inventory,
      cartPage,
      checkoutPage,
    }) => {
      await inventory.addToCart(products.backpack);
      await inventory.openCart();
      await cartPage.startCheckout();
      await checkoutPage.fillInformation(info);
      await expect(checkoutPage.error).toContainText(message);
    });
  }
});
