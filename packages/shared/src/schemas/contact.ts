import { z } from 'zod';

export const ContactSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  read: z.boolean().default(false),
  createdAt: z.string().datetime(),
});

export const CreateContactSchema = ContactSchema.omit({
  id: true,
  read: true,
  createdAt: true,
});

export type ContactSubmission = z.infer<typeof ContactSchema>;
export type CreateContact = z.infer<typeof CreateContactSchema>;
