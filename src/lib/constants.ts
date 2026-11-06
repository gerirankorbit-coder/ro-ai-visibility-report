import type { EntityParts, Engines, NapFields, SourceStatus, Work } from '@/types/schema';

export const AGENCY = 'Rank Orbit';

export const STATUS_LABEL: Record<SourceStatus, string> = {
  verified: 'Verified',
  synced: 'Updated',
  progress: 'In progress',
  queued: 'Queued',
};

export const PHASES: ReadonlyArray<readonly [string, string]> = [
  ['Profile Setup', 'Profiles created and completed'],
  ['Trust Building', 'Reputation and history growing'],
  ['Community Engagement', 'Active in relevant communities'],
  ['Brand Signals', 'Brand surfacing in discussions'],
];

export const ENGINES: ReadonlyArray<readonly [keyof Engines, string, string]> = [
  ['aio', 'Google AI Overviews', 'Likelihood of appearing in Google’s AI-generated summaries.'],
  ['chatgpt', 'ChatGPT Search', 'How ready your business is to be cited in ChatGPT answers.'],
  ['perplexity', 'Perplexity', 'Strength of the sources Perplexity draws on for your category.'],
  ['gemini', 'Gemini', 'Signals Gemini uses to recognise and recommend your business.'],
  ['copilot', 'Microsoft Copilot', 'Coverage across Bing data that powers Copilot answers.'],
];

export const ENTITY: ReadonlyArray<readonly [keyof EntityParts, string, string]> = [
  ['schema', 'Schema', 'Structured data (schema markup)'],
  ['sameAs', 'sameAs Links', 'sameAs profile links'],
  ['kg', 'Knowledge Graph', 'Knowledge graph presence'],
  ['reviews', 'Reviews', 'Review signals'],
  ['mentions', 'Mentions', 'Unlinked brand mentions'],
  ['topical', 'Topical Depth', 'Topical authority content'],
];

export const NAP_FIELDS: ReadonlyArray<readonly [keyof NapFields, string]> = [
  ['name', 'Business Name'],
  ['address', 'Address'],
  ['phone', 'Phone'],
  ['hours', 'Hours'],
  ['website', 'Website'],
];

export const WORK: ReadonlyArray<readonly [keyof Work, string, string]> = [
  ['nap', 'NAP corrections', 'Name, address and phone fixes across listings.'],
  ['entity', 'Entity building tasks', 'Profile links and signals that define your business.'],
  ['schema', 'Schema updates', 'Structured data added or improved on your site.'],
  ['content', 'Content signals', 'Topical content that AI engines can cite.'],
];

export const DIRECTORIES = [
  'Google Business Profile',
  'Bing Places',
  'Apple Business Connect',
  'Yelp',
  'Facebook',
  'BBB',
  'Yellow Pages',
  'Nextdoor',
  'Foursquare',
  'MapQuest',
  'Angi',
  'Chamber of Commerce',
] as const;

/** The 3 AI report pages. */
export type PageSlug = 'summary' | 'signals' | 'community';
/** Every capturable tab: the 3 AI pages plus the GBP Summary block. */
export type SectionSlug = PageSlug | 'gbp';
/** The report is 3 pages, each sized to fit one Word page (Letter, 6.5in content width). */
export const SECTIONS: ReadonlyArray<{ slug: PageSlug; nav: string; title: string; file: string }> = [
  { slug: 'summary', nav: 'Summary', title: 'AI Visibility Summary', file: '1-ai-visibility-summary' },
  { slug: 'signals', nav: 'AI Signals', title: 'AI Search Signals', file: '2-ai-search-signals' },
  { slug: 'community', nav: 'Community & Progress', title: 'Community & Monthly Progress', file: '3-community-progress' },
];
/** Stand-alone GBP Summary block (Summary chip + four status tiles), screenshotted on its own. */
export const GBP_TAB = { slug: 'gbp' as const, nav: 'GBP Summary', title: 'GBP Summary', file: 'gbp-summary' };
export const ALL_TABS: ReadonlyArray<{ slug: SectionSlug; nav: string; title: string; file: string }> = [GBP_TAB, ...SECTIONS];

export function sectionBySlug(s: string | undefined) {
  return ALL_TABS.find((x) => x.slug === s) ?? SECTIONS[0]!;
}
export const isPageSlug = (s: SectionSlug): s is PageSlug => s !== 'gbp';

/** Page size in CSS px. 960 x 1240 = 6.5in x 8.4in at the same ratio, so a page fits a Word page with header/footer. */
export const SHEET_W = 960;
export const SHEET_H = 1240;
/** GBP Summary block size (CSS px), same as the BrightLocal summary it reproduces. */
export const GBP_W = 683;
export const GBP_H = 196;
/** Height when the Views / Actions / Phone calls charts are shown under the tiles. */
export const GBP_H_FULL = 817;

/** Capture size of a tab (the GBP block is taller when its insight charts are shown). */
export const sizeOf = (s: SectionSlug, gbpFull = true) => (s === 'gbp' ? { w: GBP_W, h: gbpFull ? GBP_H_FULL : GBP_H } : { w: SHEET_W, h: SHEET_H });
