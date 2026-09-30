import { z } from 'zod';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const createAppointmentSchema = z.object({
  body: z.object({
    patientId: z.string().regex(uuidRegex, 'Invalid patientId UUID format'),
    appointmentDate: z
      .string({ required_error: 'Appointment date and time is required' })
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid ISO date-time string for appointmentDate',
      }),
    reason: z
      .string({ required_error: 'Reason is required' })
      .trim()
      .min(2, 'Reason must be at least 2 characters')
      .max(500, 'Reason must not exceed 500 characters'),
    notes: z.string().trim().max(1000, 'Notes must not exceed 1000 characters').optional().nullable(),
    status: z.enum(['pending', 'confirmed', 'cancelled']).optional().default('pending'),
  }),
});

export const listAppointmentsSchema = z.object({
  query: z.object({
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date filter must be in YYYY-MM-DD format')
      .optional(),
    status: z.enum(['pending', 'confirmed', 'cancelled']).optional(),
  }),
});

export const updateAppointmentStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(uuidRegex, 'Invalid appointment UUID format'),
  }),
  body: z.object({
    status: z.enum(['pending', 'confirmed', 'cancelled'], {
      required_error: 'Status is required (pending, confirmed, or cancelled)',
    }),
  }),
});

export const appointmentIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(uuidRegex, 'Invalid appointment UUID format'),
  }),
});
