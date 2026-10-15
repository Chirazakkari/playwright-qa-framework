import type { APIRequestContext, APIResponse } from '@playwright/test';
import {
  bookingSchema,
  createdBookingSchema,
  tokenSchema,
  type Booking,
  type CreatedBooking,
} from './schemas';

const JSON_HEADERS = { 'Content-Type': 'application/json', Accept: 'application/json' };

/**
 * Thin typed client over Restful-Booker.
 * Methods that parse a body validate it against the zod contract, so a silent
 * API change fails the test at the boundary instead of deep inside an assertion.
 */
export class BookingClient {
  constructor(private readonly request: APIRequestContext) {}

  async createToken(username = 'admin', password = 'password123'): Promise<string> {
    const res = await this.request.post('/auth', { headers: JSON_HEADERS, data: { username, password } });
    return tokenSchema.parse(await res.json()).token;
  }

  async create(booking: Booking): Promise<CreatedBooking> {
    const res = await this.request.post('/booking', { headers: JSON_HEADERS, data: booking });
    if (!res.ok()) throw new Error(`create failed: ${res.status()}`);
    return createdBookingSchema.parse(await res.json());
  }

  getRaw(id: number): Promise<APIResponse> {
    return this.request.get(`/booking/${id}`, { headers: { Accept: 'application/json' } });
  }

  async get(id: number): Promise<Booking> {
    const res = await this.getRaw(id);
    if (!res.ok()) throw new Error(`get failed: ${res.status()}`);
    return bookingSchema.parse(await res.json());
  }

  async update(id: number, booking: Booking, token: string): Promise<Booking> {
    const res = await this.request.put(`/booking/${id}`, {
      headers: { ...JSON_HEADERS, Cookie: `token=${token}` },
      data: booking,
    });
    if (!res.ok()) throw new Error(`update failed: ${res.status()}`);
    return bookingSchema.parse(await res.json());
  }

  async patch(id: number, partial: Partial<Booking>, token: string): Promise<Booking> {
    const res = await this.request.patch(`/booking/${id}`, {
      headers: { ...JSON_HEADERS, Cookie: `token=${token}` },
      data: partial,
    });
    if (!res.ok()) throw new Error(`patch failed: ${res.status()}`);
    return bookingSchema.parse(await res.json());
  }

  deleteRaw(id: number, token?: string): Promise<APIResponse> {
    return this.request.delete(`/booking/${id}`, {
      headers: token ? { Cookie: `token=${token}` } : {},
    });
  }
}
