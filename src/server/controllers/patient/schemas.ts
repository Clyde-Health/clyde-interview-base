import { z } from 'zod'

/** Path params for GET /patients/:id. */
export const PatientIdParamsSchema = z.object({
  id: z.uuid({ message: 'id must be a UUID' }),
})

/**
 * Query for GET /patients. Everything arrives as a string off the query string, so numbers are coerced.
 */
export const ListPatientsQuerySchema = z.object({
  limit: z.coerce
    .number({ message: 'limit must be an integer between 1 and 100' })
    .int('limit must be an integer between 1 and 100')
    .min(1, 'limit must be an integer between 1 and 100')
    .max(100, 'limit must be an integer between 1 and 100')
    .default(50),
})

export type ListPatientsQuery = z.infer<typeof ListPatientsQuerySchema>

/** Body for POST /patients. */
export const CreatePatientBodySchema = z.object({
  first_name: z.string({ error: 'first_name is required' }).trim().min(1, 'first_name is required').max(100),
  last_name: z.string({ error: 'last_name is required' }).trim().min(1, 'last_name is required').max(100),
  date_of_birth: z.iso.date({ error: 'date_of_birth must be YYYY-MM-DD' }),
  phone_number: z
    .string()
    .trim()
    .regex(/^\+[1-9]\d{7,14}$/, 'phone_number must be E.164, e.g. +15555550123')
    .nullish()
    .transform((value) => value ?? null),
})

export type CreatePatientParams = z.infer<typeof CreatePatientBodySchema>

/** The shape every patient endpoint returns. The controller maps model rows through this. */
export const PatientResultSchema = z.object({
  id: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  date_of_birth: z.string(),
  phone_number: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type PatientResult = z.infer<typeof PatientResultSchema>
