import { z } from 'zod';

const pct = z.number().min(0).max(100);
const count = z.number().int().min(0);

export const SOURCE_STATUSES = ['verified', 'synced', 'progress', 'queued'] as const;
export const SourceStatusSchema = z.enum(SOURCE_STATUSES);
export type SourceStatus = z.infer<typeof SourceStatusSchema>;

export const SourceSchema = z.object({
  name: z.string(),
  status: SourceStatusSchema,
  updated_at: z.string().nullable().default(null),
});
export type Source = z.infer<typeof SourceSchema>;

export const NapFieldsSchema = z.object({
  name: pct,
  address: pct,
  phone: pct,
  hours: pct,
  website: pct,
});
export type NapFields = z.infer<typeof NapFieldsSchema>;

export const EntityPartsSchema = z.object({
  schema: pct,
  sameAs: pct,
  kg: pct,
  reviews: pct,
  mentions: pct,
  topical: pct,
});
export type EntityParts = z.infer<typeof EntityPartsSchema>;

export const EnginesSchema = z.object({
  aio: pct,
  chatgpt: pct,
  perplexity: pct,
  gemini: pct,
  copilot: pct,
});
export type Engines = z.infer<typeof EnginesSchema>;

export const WorkSchema = z.object({
  nap: count,
  entity: count,
  schema: count,
  content: count,
});
export type Work = z.infer<typeof WorkSchema>;

export const ForumSchema = z.object({
  rCreated: count,
  rWarming: count,
  rActive: count,
  rKarma: count,
  rCommunities: count,
  qProfiles: count,
  qActive: count,
  fProfiles: count,
  fActive: count,
  weekly: z.tuple([count, count, count, count]),
  phase: z.number().int().min(1).max(4),
  authority: pct,
});
export type Forum = z.infer<typeof ForumSchema>;

export const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export const HoursDaySchema = z.object({
  day: z.enum(DAY_NAMES),
  open: z.string(),
  close: z.string(),
  closed: z.boolean(),
});
export type HoursDay = z.infer<typeof HoursDaySchema>;

/** Colour scheme of a GBP Summary tile (sampled from the BrightLocal summary). */
export const TILE_TONES = ['red', 'orange', 'green', 'grey'] as const;
export const TileToneSchema = z.enum(TILE_TONES);
export type TileTone = z.infer<typeof TileToneSchema>;

/** Tile status options; the colour follows the status (OK = orange, Good = green, Poor = red). */
export const TILE_STATUSES = [
  { status: 'OK', tone: 'orange' },
  { status: 'Good', tone: 'green' },
  { status: 'Poor', tone: 'red' },
] as const satisfies ReadonlyArray<{ status: string; tone: TileTone }>;

/** Colour for a status; unknown/legacy statuses keep their stored colour. */
export function toneForStatus(status: string, fallback: TileTone = 'orange'): TileTone {
  return TILE_STATUSES.find((s) => s.status.toLowerCase() === status.trim().toLowerCase())?.tone ?? fallback;
}

const TileSchema = () => z.object({ status: z.string().max(24).default('OK'), tone: TileToneSchema.default('orange') }).default({});

/** GBP Summary block: location, website and four status tiles, filled in manually each month. */
export const GbpSummarySchema = z.object({
  location: z.string().max(120).default(''),
  website: z.string().max(300).default(''),
  links: TileSchema(),
  rank: TileSchema(),
  gbp: TileSchema(),
  onsite: TileSchema(),
});
export type GbpSummary = z.infer<typeof GbpSummarySchema>;
export type GbpTileKey = 'links' | 'rank' | 'gbp' | 'onsite';

export const MonthSchema = z.object({
  id: z.string(),
  client_id: z.string(),
  /** First day of the month, `YYYY-MM-01`. */
  period: z.string().regex(/^\d{4}-\d{2}-01$/),
  published: z.boolean(),
  nap: pct,
  entity: pct,
  schema_cov: pct,
  knowledge: pct,
  mentions: count,
  nap_fields: NapFieldsSchema,
  entity_parts: EntityPartsSchema,
  engines: EnginesSchema,
  work: WorkSchema,
  sources: z.array(SourceSchema),
  forum: ForumSchema,
  note: z.string().nullable().transform((v) => v ?? ''),
  /** GBP Summary tiles for this month. */
  gbp_summary: GbpSummarySchema.default({}),
  updated_at: z.string().nullable().optional(),
});
export type Month = z.infer<typeof MonthSchema>;
/** Editable payload of a month (everything staff can change). */
export type MonthInput = Omit<Month, 'id' | 'client_id' | 'updated_at'>;

export const ClientSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string().nullable().transform((v) => v ?? ''),
  address: z.string().nullable().transform((v) => v ?? ''),
  locality: z.string().nullable().transform((v) => v ?? ''),
  phone: z.string().nullable().transform((v) => v ?? ''),
  website: z.string().nullable().transform((v) => v ?? ''),
  services: z.array(z.string()).nullable().transform((v) => v ?? []),
  brand_color: z.string().nullable().transform((v) => v ?? '#0A0A0A'),
  logo_path: z.string().nullable().optional().transform((v) => v ?? null),
  client_since: z.string().nullable().optional().transform((v) => v ?? null),
  hours: z.array(HoursDaySchema),
  created_at: z.string().nullable().optional(),
});
export type Client = z.infer<typeof ClientSchema>;
export type ClientInput = Omit<Client, 'id' | 'created_at'>;

export const ReportClientSchema = ClientSchema.extend({
  logo_url: z.string().nullable().optional().transform((v) => v ?? null),
});
export type ReportClient = z.infer<typeof ReportClientSchema>;

export const ReportSchema = z.object({
  client: ReportClientSchema,
  months: z.array(MonthSchema),
});
export type Report = z.infer<typeof ReportSchema>;
