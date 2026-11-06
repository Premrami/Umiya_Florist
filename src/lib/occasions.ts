import { approvedImageUrl } from './studio-media';
export const occasions = [
  'Weddings',
  'Engagements',
  'Birthdays',
  'Anniversaries',
  'Corporate Events',
  'Religious Ceremonies',
  'Home Decorations',
  'Artificial Flowers',
  'Balloon Decorations',
  'Custom Events',
] as const;
const aliases: Record<string, string> = {
  wedding: 'weddings',
  engagement: 'engagements',
  birthday: 'birthdays',
  anniversary: 'anniversaries',
  'corporate event': 'corporate events',
  'religious ceremony': 'religious ceremonies',
  'home decoration': 'home decorations',
  'artificial flower': 'artificial flowers',
  'balloon decoration': 'balloon decorations',
  'custom event': 'custom events',
};
function normalized(name: unknown) {
  return (typeof name === 'string' ? name : '').trim().toLowerCase().replace(/\s+/g, ' ');
}
export function findOccasionService<T extends Record<string, unknown>>(
  services: readonly T[],
  occasion: string,
): T | undefined {
  const target = normalized(occasion);
  return (
    services.find((entry) => normalized(entry.name) === target) ??
    services.find(
      (entry) =>
        (aliases[normalized(entry.name)] ?? normalized(entry.name)) === (aliases[target] ?? target),
    )
  );
}

/** Gallery entries use existing occasion-photo records and inherit their publishing rules. */
export function occasionPhotos(services: readonly Record<string, unknown>[], occasion: string) {
  const key = (value: unknown) => aliases[normalized(value)] ?? normalized(value);
  return [
    ...new Set(
      services
        .filter(
          (entry) =>
            key(entry.name) === key(occasion) &&
            (entry.status === undefined || entry.status === 'published') &&
            typeof entry.image_url === 'string' &&
            approvedImageUrl(entry.image_url),
        )
        .map((entry) => entry.image_url as string),
    ),
  ];
}
export function occasionGalleryLabel(occasion: string) {
  const names: Record<string, string> = {
    Weddings: 'wedding',
    Engagements: 'engagement',
    Birthdays: 'birthday',
    Anniversaries: 'anniversary',
    'Corporate Events': 'corporate event',
    'Religious Ceremonies': 'religious ceremony',
    'Home Decorations': 'home decoration',
    'Artificial Flowers': 'artificial flower',
    'Balloon Decorations': 'balloon decoration',
    'Custom Events': 'custom event',
  };
  return 'View ' + (names[occasion] ?? occasion.toLowerCase()) + ' gallery';
}

/** Reserved CMS section for an occasion's independently selected front image. */
export function occasionCoverKey(occasion: string) {
  return 'occasion_' + normalized(occasion).replace(/ /g, '_');
}
