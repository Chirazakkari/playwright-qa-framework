import { expect, test } from '@playwright/test';

/** UI layer of the assistant: what a user sees, and how the page treats untrusted replies. */
test.describe('Chat widget', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?delay=500'); // latency makes the "typing" state observable
  });

  test('shows a typing indicator, then the assistant answer', async ({ page }) => {
    await page.getByTestId('chat-input').fill('What time is check-in?');
    await page.getByTestId('chat-send').click();

    await expect(page.getByTestId('msg-user')).toHaveText('What time is check-in?');
    await expect(page.getByTestId('msg-typing')).toBeVisible();
    await expect(page.getByTestId('msg-bot')).toContainText('15:00');
    await expect(page.getByTestId('msg-typing')).toHaveCount(0);
  });

  test('Enter sends the message', async ({ page }) => {
    await page.getByTestId('chat-input').fill('Hello');
    await page.getByTestId('chat-input').press('Enter');
    await expect(page.getByTestId('msg-bot')).toBeVisible();
  });

  test('cannot double-submit while an answer is pending', async ({ page }) => {
    const send = page.getByTestId('chat-send');
    await page.getByTestId('chat-input').fill('When is breakfast?');
    await send.click();
    await expect(send).toBeDisabled();

    await expect(page.getByTestId('msg-bot')).toBeVisible();
    await expect(send).toBeEnabled();
    await expect(page.getByTestId('msg-user')).toHaveCount(1);
  });

  test('user input is rendered as text, never executed (XSS)', async ({ page }) => {
    const payload = '<img src=x onerror="window.__pwned=true">';
    await page.getByTestId('chat-input').fill(payload);
    await page.getByTestId('chat-send').click();

    await expect(page.getByTestId('msg-bot')).toBeVisible();
    await expect(page.getByTestId('msg-user')).toHaveText(payload); // shown literally
    expect(await page.evaluate(() => (window as unknown as { __pwned?: boolean }).__pwned)).toBeUndefined();
    await expect(page.locator('#log img')).toHaveCount(0);
  });

  test('a backend failure shows a friendly message, not a crash', async ({ page }) => {
    await page.route('**/chat', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"boom"}' }),
    );
    await page.getByTestId('chat-input').fill('Hello');
    await page.getByTestId('chat-send').click();

    await expect(page.getByTestId('msg-bot')).toHaveText('Sorry, something went wrong.');
    await expect(page.getByTestId('chat-send')).toBeEnabled();
  });
});
