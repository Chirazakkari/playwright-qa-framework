import { products } from '../../src/data/users';
import { expect, test } from '../../src/fixtures';

test.describe('Cart and catalogue', () => {
  test('cart badge follows add and remove', async ({ loggedInInventory: inventory }) => {
    await expect(inventory.cartBadge).toBeHidden();

    await inventory.addToCart(products.backpack);
    await inventory.addToCart(products.bikeLight);
    await expect(inventory.cartBadge).toHaveText('2');

    await inventory.removeFromCart(products.backpack);
    await expect(inventory.cartBadge).toHaveText('1');
  });

  test('cart lists exactly what was added', async ({ loggedInInventory: inventory, cartPage }) => {
    await inventory.addToCart(products.boltTShirt);
    await inventory.addToCart(products.backpack);
    await inventory.openCart();

    // The cart keeps insertion order, so this also guards against silent re-ordering.
    await cartPage.expectProducts([products.boltTShirt, products.backpack]);
  });

  test.describe('sorting', () => {
    test('price low to high is ascending', async ({ loggedInInventory: inventory }) => {
      await inventory.sortBy('lohi');
      const prices = await inventory.priceValues();
      expect(prices).toEqual([...prices].sort((a, b) => a - b));
    });

    test('price high to low is descending', async ({ loggedInInventory: inventory }) => {
      await inventory.sortBy('hilo');
      const prices = await inventory.priceValues();
      expect(prices).toEqual([...prices].sort((a, b) => b - a));
    });

    test('name Z to A is reverse alphabetical', async ({ loggedInInventory: inventory }) => {
      await inventory.sortBy('za');
      const names = await inventory.names.allTextContents();
      expect(names).toEqual([...names].sort().reverse());
    });
  });
});
