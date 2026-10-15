/**
 * Public demo credentials published by Swag Labs on its login page.
 * They are not secrets: they exist so people can practice.
 */
export const PASSWORD = 'secret_sauce';

export const users = {
  standard: 'standard_user',
  lockedOut: 'locked_out_user',
  problem: 'problem_user',
  performanceGlitch: 'performance_glitch_user',
} as const;

export const checkoutInfo = {
  firstName: 'Test',
  lastName: 'Automation',
  postalCode: '75001',
} as const;

export const products = {
  backpack: 'Sauce Labs Backpack',
  bikeLight: 'Sauce Labs Bike Light',
  boltTShirt: 'Sauce Labs Bolt T-Shirt',
} as const;
