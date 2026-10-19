export const photos = {
  hero: '/images/hero.jpg',
  roses: '/images/roses.jpg',
  bouquet: '/images/bouquet.jpg',
  petals: '/images/petals.jpg',
  wedding: '/images/wedding.jpg',
};
export type CatalogItem = {
  id: string;
  name: string;
  category: string;
  description: string;
  image_url: string;
  price: number | null;
  status: string;
};
export const referenceCatalog: CatalogItem[] = [
  {
    id: 'ref-1',
    name: 'The velvet rose',
    category: 'Rose Bouquets',
    description: 'Deep red roses, gathered with an effortless touch.',
    image_url: photos.roses,
    price: null,
    status: 'published',
  },
  {
    id: 'ref-2',
    name: 'A little tenderness',
    category: 'Mixed Flower Bouquets',
    description: 'Soft seasonal blooms, for thoughtful moments.',
    image_url: photos.bouquet,
    price: null,
    status: 'published',
  },
  {
    id: 'ref-3',
    name: 'Wildly yours',
    category: 'Seasonal Flowers',
    description: 'An expressive gathering of seasonal stems.',
    image_url: photos.petals,
    price: null,
    status: 'published',
  },
];
export type PublicContent = {
  preview: boolean;
  previewLabel?: string;
  catalog: CatalogItem[];
  sections: Record<string, Record<string, string>>;
  settings: Record<string, string>;
  portfolio: Record<string, string>[];
  testimonials: Record<string, string>[];
  services: Record<string, string>[];
  social: Record<string, string>[];
  faqs: Record<string, string>[];
};
