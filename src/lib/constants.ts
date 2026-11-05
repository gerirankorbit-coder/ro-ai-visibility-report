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

export const TRACKED_ON = [
  'Google Business Profile',
  'Bing Places',
  'Apple Business Connect',
  'Yelp',
  'Google AI Overviews',
  'ChatGPT',
  'Perplexity',
  'Reddit',
  'Quora',
] as const;

export type SectionSlug = 'overview' | 'signals' | 'community' | 'progress' | 'profile';
export const SECTIONS: ReadonlyArray<{ slug: SectionSlug; nav: string; title: string; file: string }> = [
  { slug: 'overview', nav: 'Overview', title: 'Overview', file: 'overview' },
  { slug: 'signals', nav: 'AI Signals', title: 'AI Search Signals', file: 'ai-search-signals' },
  { slug: 'community', nav: 'Community', title: 'Community Signals', file: 'community-signals' },
  { slug: 'progress', nav: 'Progress', title: 'Monthly Progress', file: 'monthly-progress' },
  { slug: 'profile', nav: 'Profile', title: 'Business Profile', file: 'business-profile' },
];
export function sectionBySlug(s: string | undefined) {
  return SECTIONS.find((x) => x.slug === s) ?? SECTIONS[0];
}
