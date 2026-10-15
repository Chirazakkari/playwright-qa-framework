import { test as base } from '@playwright/test';
import { BookingClient } from '../api/BookingClient';
import type { Booking, CreatedBooking } from '../api/schemas';

export const sampleBooking = (overrides: Partial<Booking> = {}): Booking => ({
  firstname: 'Chiraz',
  lastname: 'Automation',
  totalprice: 150,
  depositpaid: true,
  bookingdates: { checkin: '2026-11-01', checkout: '2026-11-05' },
  additionalneeds: 'Breakfast',
  ...overrides,
});

type ApiFixtures = {
  bookingClient: BookingClient;
  token: string;
  /** A fresh booking that is always deleted after the test, pass or fail. */
  createdBooking: CreatedBooking;
};

export const test = base.extend<ApiFixtures>({
  bookingClient: async ({ request }, use) => use(new BookingClient(request)),
  token: async ({ bookingClient }, use) => use(await bookingClient.createToken()),
  createdBooking: async ({ bookingClient, token }, use) => {
    const created = await bookingClient.create(sampleBooking());
    await use(created);
    // Teardown: leave the shared demo API clean even when the test failed.
    await bookingClient.deleteRaw(created.bookingid, token);
  },
});

export { expect } from '@playwright/test';
