import { z } from "zod";

export const createArticleSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  categoryIds: z.array(z.number()).default([]),
});

export type CreateArticleFormData = z.input<typeof createArticleSchema>;
