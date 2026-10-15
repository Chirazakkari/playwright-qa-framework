import { z } from 'zod';

/** Contract of the Restful-Booker API, expressed once and reused by every test. */
export const bookingDatesSchema = z.object({
  checkin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkout: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const bookingSchema = z.object({
  firstname: z.string(),
  lastname: z.string(),
  totalprice: z.number(),
  depositpaid: z.boolean(),
  bookingdates: bookingDatesSchema,
  additionalneeds: z.string().optional(),
});

export const createdBookingSchema = z.object({
  bookingid: z.number().int().positive(),
  booking: bookingSchema,
});

export const tokenSchema = z.object({ token: z.string().min(1) });

export type Booking = z.infer<typeof bookingSchema>;
export type CreatedBooking = z.infer<typeof createdBookingSchema>;
