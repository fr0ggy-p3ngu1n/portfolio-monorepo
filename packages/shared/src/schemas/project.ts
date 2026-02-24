import { z } from 'zod';

export const ProjectSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  url: z.string().url().optional().nullable(),
  repoUrl: z.string().url().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  tags: z.array(z.string()),
  featured: z.boolean().default(false),
  order: z.number().int().default(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateProjectSchema = ProjectSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateProjectSchema = CreateProjectSchema.partial();

export type Project = z.infer<typeof ProjectSchema>;
export type CreateProject = z.infer<typeof CreateProjectSchema>;
export type UpdateProject = z.infer<typeof UpdateProjectSchema>;
