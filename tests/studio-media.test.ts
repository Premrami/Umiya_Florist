import { describe, expect, it } from 'vitest';
import {
  approvedImageUrl,
  publicMediaAssetUrl,
  type StudioMediaAsset,
} from '../src/lib/studio-media';
import { findOccasionService } from '../src/lib/occasions';
const origin = 'https://preview.supabase.co';
const asset: StudioMediaAsset = {
  id: 'sample',
  name: 'Wedding.jpg',
  path: 'sample-photo.jpg',
  public: true,
  mime_type: 'image/jpeg',
  alt_text: 'Sample flowers',
};
describe('Studio image selection boundary', () => {
  it('builds a complete public image URL without exposing private assets', () => {
    expect(publicMediaAssetUrl(asset, origin)).toBe(
      origin + '/storage/v1/object/public/promotional/sample-photo.jpg',
    );
    expect(publicMediaAssetUrl({ ...asset, public: false }, origin)).toBeUndefined();
    expect(publicMediaAssetUrl({ ...asset, mime_type: 'application/pdf' }, origin)).toBeUndefined();
  });
  it('rejects traversal, missing configuration and non-project origins', () => {
    for (const path of [
      '../private/photo.jpg',
      '/sample.jpg',
      'folder//sample.jpg',
      'https://example.com/a.jpg',
    ])
      expect(publicMediaAssetUrl({ ...asset, path }, origin)).toBeUndefined();
    expect(publicMediaAssetUrl(asset, undefined)).toBeUndefined();
    expect(publicMediaAssetUrl(asset, 'https://example.com')).toBeUndefined();
  });
  it('retains the existing image URL rules', () => {
    expect(approvedImageUrl('/images/hero.jpg')).toBe(true);
    expect(approvedImageUrl(origin + '/storage/v1/object/public/promotional/sample.jpg')).toBe(
      true,
    );
    expect(approvedImageUrl('file-id-only')).toBe(false);
    expect(approvedImageUrl('https://unapproved.example/image.jpg')).toBe(false);
  });
});
describe('published occasion matching', () => {
  it('matches the existing singular lowercase wedding record to Weddings', () => {
    const wedding = { name: ' wedding ', image_url: '/images/hero.jpg' };
    expect(findOccasionService([wedding], 'Weddings')).toBe(wedding);
  });
  it('supports singular/plural names while preferring an exact canonical record', () => {
    for (const [name, tab] of [
      ['ANNIVERSARY', 'Anniversaries'],
      ['Religious ceremony', 'Religious Ceremonies'],
      ['Corporate event', 'Corporate Events'],
    ])
      expect(findOccasionService([{ name }], tab)?.name).toBe(name);
    const exact = { name: 'Weddings' };
    expect(findOccasionService([{ name: 'wedding' }, exact], 'Weddings')).toBe(exact);
  });
  it('does not use an unrelated service as the photo for another occasion', () => {
    expect(
      findOccasionService([{ name: 'Wedding photography' }, { name: 'Birthdays' }], 'Weddings'),
    ).toBeUndefined();
  });
});
