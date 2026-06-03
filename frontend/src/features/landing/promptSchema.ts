import { z } from 'zod'

/** Validation for the idea-prompt form (React Hook Form + Zod). */
export const promptSchema = z.object({
  idea: z
    .string()
    .trim()
    .min(12, 'Describe your idea in a little more detail (at least 12 characters).')
    .max(600, 'Keep it under 600 characters.'),
})

export type PromptValues = z.infer<typeof promptSchema>
