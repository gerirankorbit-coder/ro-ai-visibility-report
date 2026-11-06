import { z } from 'zod';

/** Status shown on the Summary tiles and the Rankings badge. */
export const TileStatusSchema = z.enum(['ok', 'attention']);
export type TileStatus = z.infer<typeof TileStatusSchema>;

const path = z.string().max(300);
const str = (max = 4000) => z.string().max(max).default('');
const count = z.number().int().min(0).default(0);

/** Sections of the full GMB + AI report, in report order. */
export const SECTION_KEYS = ['note', 'summary', 'insights', 'reviews', 'videos', 'rankings', 'posting', 'localSeo', 'backlinks', 'quora', 'ai'] as const;
export type ReportSectionKey = (typeof SECTION_KEYS)[number];

export const SECTION_TITLES: Record<ReportSectionKey, string> = {
  note: 'Google Update',
  summary: 'Summary',
  insights: 'Insights',
  reviews: 'Reviews',
  videos: 'Business Videos',
  rankings: 'Rankings',
  posting: 'Posting',
  localSeo: 'Local SEO Working',
  backlinks: 'Local Backlink Acquisitions',
  quora: 'Quora',
  ai: 'AI Optimization',
};

export const SectionsSchema = z.object(Object.fromEntries(SECTION_KEYS.map((k) => [k, z.boolean().default(true)])) as Record<ReportSectionKey, z.ZodDefault<z.ZodBoolean>>);

export const ViewsRowSchema = z.object({ date: z.string().max(40), sd: count, sm: count, md: count, mm: count });
export const ActionsRowSchema = z.object({ date: z.string().max(40), web: count, dir: count, call: count });

export const ReviewItemSchema = z.object({
  text: str(1500),
  stars: z.number().int().min(1).max(5).default(5),
  date: str(40),
  url: str(600),
});

export const LinkGroupSchema = z.object({ title: str(80), links: z.array(z.string().max(600)).max(80).default([]) });

export const GmbSchema = z.object({
  coverTitle: str(80).transform((v) => v || 'AI Optimization Report For:'),
  sections: SectionsSchema.default({}),
  summary: z
    .object({
      links: TileStatusSchema.default('ok'),
      rank: TileStatusSchema.default('ok'),
      gbp: TileStatusSchema.default('ok'),
      onsite: TileStatusSchema.default('ok'),
    })
    .default({}),
  insights: z
    .object({
      mode: z.enum(['data', 'image']).default('data'),
      images: z.array(path).max(6).default([]),
      range: str(60),
      views: z.array(ViewsRowSchema).max(62).default([]),
      actions: z.array(ActionsRowSchema).max(62).default([]),
      calls: z.array(count).length(7).default([0, 0, 0, 0, 0, 0, 0]),
    })
    .default({}),
  reviews: z
    .object({
      mode: z.enum(['data', 'image']).default('data'),
      image: path.nullable().default(null),
      total: count,
      rating: z.number().min(0).max(5).default(5),
      items: z.array(ReviewItemSchema).max(5).default([]),
    })
    .default({}),
  videos: z.object({ images: z.array(path).max(2).default([]), links: z.array(z.string().max(600)).max(6).default([]) }).default({}),
  rankings: z
    .object({
      location: str(120),
      showRanks: z.boolean().default(true),
      status: TileStatusSchema.default('ok'),
      keywords: z.array(z.object({ keyword: str(200), rank: str(20) })).max(60).default([]),
    })
    .default({}),
  posting: z.object({ images: z.array(path).max(24).default([]) }).default({}),
  localSeo: z
    .object({
      groups: z
        .array(LinkGroupSchema)
        .max(10)
        .default([
          { title: 'Video Submission', links: [] },
          { title: 'Articles Submission', links: [] },
          { title: 'Web 2.0', links: [] },
          { title: 'GMB Posting', links: [] },
        ]),
    })
    .default({}),
  backlinks: z.object({ images: z.array(path).max(24).default([]) }).default({}),
  quora: z.object({ images: z.array(path).max(3).default([]), link: str(600), linkLabel: str(200) }).default({}),
});
export type Gmb = z.infer<typeof GmbSchema>;
export type GmbInput = z.input<typeof GmbSchema>;

export const defaultGmb = (): Gmb => GmbSchema.parse({});

/**
 * Starting point for next month: keep setup (sections, keywords and ranks, statuses, Quora,
 * videos, link-group titles) and clear what is new every month (screenshots, links, insights).
 */
export function carryOverGmb(prev: Gmb): Gmb {
  return {
    ...prev,
    insights: { ...prev.insights, images: [], views: [], actions: [], calls: [0, 0, 0, 0, 0, 0, 0], range: '' },
    reviews: { ...prev.reviews, image: null },
    posting: { images: [] },
    backlinks: { images: [] },
    localSeo: { groups: prev.localSeo.groups.map((g) => ({ title: g.title, links: [] })) },
  };
}

/** Shared monthly Google update note (one per month, used by every client's report). */
export const NoteSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}-01$/),
  title: z.string().max(120).default('Google Core Update'),
  image_path: z.string().max(300).nullable().default(null),
  body: z.string().max(6000).default(''),
  link: z.string().max(600).default(''),
});
export type Note = z.infer<typeof NoteSchema>;
