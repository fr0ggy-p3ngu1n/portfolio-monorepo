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
}).extend({
  // Honeypot: a field real users never see or fill in (hidden off-screen in
  // the form), so anything non-empty here means a bot filled every input it
  // could find. No length constraint here deliberately — rejecting it with a
  // validation error would both reveal the anti-bot mechanism to the bot and
  // risk a false positive from aggressive autofill. The route handler checks
  // this value and silently discards (fakes a normal success) instead.
  website: z.string().optional(),
});

export type ContactSubmission = z.infer<typeof ContactSchema>;
export type CreateContact = z.infer<typeof CreateContactSchema>;
