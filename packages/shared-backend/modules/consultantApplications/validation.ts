import { z } from 'zod';

export const applicationStatusSchema = z.enum(['pending', 'approved', 'rejected']);

const jsonStringArray = z.preprocess((value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : value;
  } catch {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
}, z.array(z.string().trim().min(1)).max(20));

export const createConsultantApplicationSchema = z.object({
  email: z.string().trim().email().max(255),
  full_name: z.string().trim().min(2).max(255),
  phone: z.string().trim().max(40).optional().nullable(),
  bio: z.string().trim().max(5000).optional().nullable(),
  expertise: jsonStringArray.default([]),
  languages: jsonStringArray.default(['tr']),
  experience_years: z.coerce.number().int().min(0).max(80).optional().nullable(),
  certifications: z.string().trim().max(5000).optional().nullable(),
  cv_url: z.string().trim().url().max(500).optional().nullable(),
  sample_chart_url: z.string().trim().url().max(500).optional().nullable(),
});

export const listConsultantApplicationsSchema = z.object({
  status: applicationStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const rejectConsultantApplicationSchema = z.object({
  rejection_reason: z.string().trim().min(10).max(2000),
});

export type CreateConsultantApplicationInput = z.infer<typeof createConsultantApplicationSchema>;
export type ListConsultantApplicationsInput = z.infer<typeof listConsultantApplicationsSchema>;
export type RejectConsultantApplicationInput = z.infer<typeof rejectConsultantApplicationSchema>;
