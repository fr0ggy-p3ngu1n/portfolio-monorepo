import { z } from 'zod';

export const LeaderboardEntrySchema = z.object({
  id:        z.string(),
  name:      z.string().length(3),
  score:     z.number().int(),
  createdAt: z.string(),
});

export const SubmitScoreSchema = z.object({
  name:  z.string().regex(/^[A-Z0-9]{3}$/, 'Name must be 3 uppercase alphanumeric characters'),
  score: z.number().int().min(1).max(99999),
});

export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;
export type SubmitScore      = z.infer<typeof SubmitScoreSchema>;
