import { z } from 'zod';

// http(s) only: z.string().url() also accepts javascript: and data: URLs,
// and these end up in hrefs and img srcs on the site
const httpUrl = z.string().url().refine((v) => /^https?:\/\//i.test(v), 'Must be an http(s) URL');

export const ProjectSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  url: httpUrl.optional().nullable(),
  repoUrl: httpUrl.optional().nullable(),
  imageUrl: httpUrl.optional().nullable(),
  demoUrl: httpUrl.optional().nullable(),
  demoLabel: z.string().max(40).optional().nullable(),
  tags: z.array(z.string()),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
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
