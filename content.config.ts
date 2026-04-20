import { defineCollection, defineContentConfig, z } from '@nuxt/content'

const CATEGORIES = ['symptomes', 'alimentation', 'mouvement', 'bien-etre'] as const

export default defineContentConfig({
  collections: {
    articles: defineCollection({
      type: 'page',
      source: 'articles/*.md',
      schema: z.object({
        title: z.string().min(1).max(120),
        description: z.string().min(1).max(200),
        publishedAt: z.string(),
        updatedAt: z.string().optional(),
        category: z.enum(CATEGORIES),
        tags: z.array(z.string()).default([]),
        readingTime: z.number().int().positive(),
        image: z.string().min(1),
        author: z.string().default('Sophie Jouan'),
        authorRole: z.string().default('Spécialiste accompagnement ménopause'),
        authorPhoto: z.string().default('/images/sophie_jouan.jpeg'),
        authorUrl: z.string().default('/coach/sophie-jouan'),
        relatedCoachSlug: z.string().default('sophie-jouan'),
        sources: z.array(z.object({
          label: z.string(),
          url: z.string().url()
        })).default([]),
        draft: z.boolean().default(false)
      })
    })
  }
})
