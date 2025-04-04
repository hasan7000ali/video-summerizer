import { z } from 'zod';

// Update user schema
export const updateUserSchema = z.object({
  body: z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters long').optional(),
    lastName: z.string().min(2, 'Last name must be at least 2 characters long').optional(),
  }).refine(data => data.firstName !== undefined || data.lastName !== undefined, {
    message: 'At least one field must be provided for update',
  }),
}); 