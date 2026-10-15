import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '../../src/fixtures';

/**
 * Accessibility smoke with axe-core.
 * Policy: the build fails on "critical" violations only. Lower severities are attached
 * to the report so they are visible and tracked without blocking every release.
 */
test.describe('Accessibility (WCAG 2 A/AA)', () => {
  const scan = async (
    page: import('@playwright/test').Page,
    testInfo: import('@playwright/test').TestInfo,
  ) => {
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    await testInfo.attach('axe-violations.json', {
      body: JSON.stringify(results.violations, null, 2),
      contentType: 'application/json',
    });
    return results.violations;
  };

  test('login page has no critical violations', async ({ page, loginPage }, testInfo) => {
    await loginPage.goto();
    const violations = await scan(page, testInfo);
    expect(violations.filter((v) => v.impact === 'critical')).toEqual([]);
  });

  test('inventory page has no critical violations', async ({ page, loggedInInventory }, testInfo) => {
    await expect(loggedInInventory.title).toBeVisible();
    const violations = await scan(page, testInfo);
    expect(violations.filter((v) => v.impact === 'critical')).toEqual([]);
  });
});
