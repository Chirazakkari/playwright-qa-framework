import { expect, sampleBooking, test } from '../../src/fixtures/api';

test.describe('Restful-Booker API', () => {
  test('creates a booking that respects the contract', async ({ bookingClient, token }) => {
    const payload = sampleBooking({ firstname: 'Contract', totalprice: 321 });
    const created = await bookingClient.create(payload); // zod validates the response shape

    expect(created.booking).toMatchObject(payload);
    await bookingClient.deleteRaw(created.bookingid, token);
  });

  test('full lifecycle: read, update, partial update, delete', async ({
    bookingClient,
    token,
    createdBooking,
  }) => {
    const id = createdBooking.bookingid;

    await test.step('read returns what was created', async () => {
      expect(await bookingClient.get(id)).toMatchObject(createdBooking.booking);
    });

    await test.step('PUT replaces the whole resource', async () => {
      const updated = await bookingClient.update(
        id,
        sampleBooking({ firstname: 'Updated', totalprice: 999 }),
        token,
      );
      expect(updated).toMatchObject({ firstname: 'Updated', totalprice: 999 });
    });

    await test.step('PATCH changes only the given fields', async () => {
      const patched = await bookingClient.patch(id, { lastname: 'Patched' }, token);
      expect(patched.lastname).toBe('Patched');
      expect(patched.firstname).toBe('Updated'); // untouched by the patch
    });

    await test.step('DELETE removes it, a later GET is 404', async () => {
      const del = await bookingClient.deleteRaw(id, token);
      expect(del.status()).toBe(201); // Restful-Booker answers 201 "Created" on delete (documented quirk)
      expect((await bookingClient.getRaw(id)).status()).toBe(404);
    });
  });

  test.describe('authorization and negative paths', () => {
    test('delete without a token is rejected', async ({ bookingClient, createdBooking }) => {
      const res = await bookingClient.deleteRaw(createdBooking.bookingid);
      expect(res.status()).toBe(403);
      expect((await bookingClient.getRaw(createdBooking.bookingid)).ok()).toBe(true); // still there
    });

    test('delete with a bad token is rejected', async ({ bookingClient, createdBooking }) => {
      const res = await bookingClient.deleteRaw(createdBooking.bookingid, 'not-a-real-token');
      expect(res.status()).toBe(403);
    });

    test('unknown booking id returns 404', async ({ bookingClient }) => {
      expect((await bookingClient.getRaw(999_999_999)).status()).toBe(404);
    });

    test('invalid credentials do not return a token', async ({ request }) => {
      const res = await request.post('/auth', { data: { username: 'admin', password: 'wrong' } });
      // The API answers 200 with a "Bad credentials" reason instead of an HTTP error.
      expect(await res.json()).toEqual({ reason: 'Bad credentials' });
    });
  });
});
