import { expect, type Locator, type Page } from '@playwright/test';

export class CheckoutPage {
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly postalCode: Locator;
  readonly continueButton: Locator;
  readonly finishButton: Locator;
  readonly error: Locator;
  readonly subtotal: Locator;
  readonly tax: Locator;
  readonly total: Locator;
  readonly confirmation: Locator;

  constructor(private readonly page: Page) {
    this.firstName = page.getByTestId('firstName');
    this.lastName = page.getByTestId('lastName');
    this.postalCode = page.getByTestId('postalCode');
    this.continueButton = page.getByTestId('continue');
    this.finishButton = page.getByTestId('finish');
    this.error = page.getByTestId('error');
    this.subtotal = page.getByTestId('subtotal-label');
    this.tax = page.getByTestId('tax-label');
    this.total = page.getByTestId('total-label');
    this.confirmation = page.getByTestId('complete-header');
  }

  async fillInformation(info: { firstName: string; lastName: string; postalCode: string }): Promise<void> {
    await this.firstName.fill(info.firstName);
    await this.lastName.fill(info.lastName);
    await this.postalCode.fill(info.postalCode);
    await this.continueButton.click();
  }

  /** Reads "Item total: $39.98" style labels as numbers. */
  private async amount(label: Locator): Promise<number> {
    const text = await label.innerText();
    const match = /\$(\d+(?:\.\d+)?)/.exec(text);
    if (!match?.[1]) throw new Error(`No amount found in "${text}"`);
    return Number(match[1]);
  }

  async amounts(): Promise<{ subtotal: number; tax: number; total: number }> {
    return {
      subtotal: await this.amount(this.subtotal),
      tax: await this.amount(this.tax),
      total: await this.amount(this.total),
    };
  }

  async finish(): Promise<void> {
    await this.finishButton.click();
    await expect(this.confirmation).toHaveText('Thank you for your order!');
  }
}
