import { z } from 'zod';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const createPatientSchema = z.object({
  body: z.object({
    fullName: z
      .string({ required_error: 'Full name is required' })
      .trim()
      .min(2, 'Full name must be at least 2 characters')
      .max(150, 'Full name must not exceed 150 characters'),
    cin: z
      .string({ required_error: 'CIN is required' })
      .trim()
      .min(2, 'CIN must be at least 2 characters')
      .max(50, 'CIN must not exceed 50 characters'),
    phone: z
      .string({ required_error: 'Phone number is required' })
      .trim()
      .min(5, 'Phone number is too short')
      .max(50, 'Phone number is too long'),
    birthDate: z
      .string({ required_error: 'Birth date is required' })
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Birth date must be in YYYY-MM-DD format'),
    address: z.string().trim().max(500, 'Address is too long').optional().nullable(),
  }),
});

export const updatePatientSchema = z.object({
  params: z.object({
    id: z.string().regex(uuidRegex, 'Invalid patient UUID format'),
  }),
  body: z.object({
    fullName: z
      .string({ required_error: 'Full name is required' })
      .trim()
      .min(2, 'Full name must be at least 2 characters')
      .max(150, 'Full name must not exceed 150 characters'),
    cin: z
      .string({ required_error: 'CIN is required' })
      .trim()
      .min(2, 'CIN must be at least 2 characters')
      .max(50, 'CIN must not exceed 50 characters'),
    phone: z
      .string({ required_error: 'Phone number is required' })
      .trim()
      .min(5, 'Phone number is too short')
      .max(50, 'Phone number is too long'),
    birthDate: z
      .string({ required_error: 'Birth date is required' })
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Birth date must be in YYYY-MM-DD format'),
    address: z.string().trim().max(500, 'Address is too long').optional().nullable(),
  }),
});

export const patientIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(uuidRegex, 'Invalid patient UUID format'),
  }),
});

export const listPatientsSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    page: z
      .string()
      .optional()
      .transform((val) => (val ? Math.max(1, parseInt(val, 10) || 1) : 1)),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10) || 10)) : 10)),
  }),
});
