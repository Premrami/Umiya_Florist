'use client';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { approvedImageUrl } from '@/lib/studio-media';
import { StudioImageField } from './studio-image-field';
import { occasions } from '@/lib/occasions';
export function StudioOccasionGallery({
  onSave,
  onDone,
}: {
  onSave: (data: {
    occasion: string;
    placement: string;
    description: string;
    status: string;
    photos: string[];
  }) => Promise<void>;
  onDone: () => void;
}) {
  const [occasion, setOccasion] = useState<string>('Weddings');
  const [placement, setPlacement] = useState('gallery');
  const [overview, setOverview] = useState<
    { occasion: string; cover_url: string; draft_cover_url: string; gallery_count: number }[]
  >([]);
  const [overviewError, setOverviewError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/admin/occasion-gallery', { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !Array.isArray(result.data))
          throw new Error('Current occasion photos could not be loaded.');
        if (!controller.signal.aborted) setOverview(result.data);
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setOverviewError(
            'Current occasion photos could not be loaded. You can still choose where to save your photos.',
          );
      });
    return () => controller.abort();
  }, []);
  const current = overview.find((item) => item.occasion === occasion);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || uploading) return;
    const data = new FormData(event.currentTarget);
    const photos =
      placement === 'cover'
        ? [String(data.get('photos') || '')].filter(Boolean)
        : (JSON.parse(String(data.get('photos') || '[]')) as string[]);
    if (!photos.length) {
      setError(
        placement === 'cover'
          ? 'Choose one main section image.'
          : 'Upload or select at least one gallery photo.',
      );
      return;
    }
    submitting.current = true;
    setSaving(true);
    setError('');
    try {
      await onSave({
        occasion,
        placement,
        description: String(data.get('description')),
        status: String(data.get('status')),
        photos,
      });
      onDone();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Could not save gallery photos. Please try again.',
      );
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }
  return (
    <form className="admin-form" onSubmit={submit} aria-busy={saving || uploading}>
      <p className="studio-gallery-guide">
        Choose the occasion and where the photo should appear. Gallery photos and the main section
        image can be managed separately.
      </p>
      <fieldset className="studio-gallery-details" disabled={saving || uploading}>
        <label>
          Occasion
          <select
            name="occasion"
            aria-label="Occasion"
            required
            value={occasion}
            onChange={(event) => setOccasion(event.target.value)}
          >
            {occasions.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
        <label>
          Photo use
          <select
            aria-label="Photo use"
            name="placement"
            value={placement}
            onChange={(event) => setPlacement(event.target.value)}
          >
            <option value="gallery">Gallery photos only</option>
            <option value="cover">Main section image only</option>
          </select>
        </label>
        <label>
          Photo description
          <textarea
            name="description"
            maxLength={5000}
            rows={2}
            placeholder="Optional details about these decorations"
          />
        </label>
        <label>
          Publishing
          <select name="status" aria-label="Publishing" defaultValue="draft">
            <option value="draft">Draft — keep in Studio</option>
            <option value="published">Published — show on website</option>
          </select>
        </label>
      </fieldset>
      <div className="studio-occasion-target" aria-live="polite">
        <strong>
          {placement === 'cover' ? 'Main image for ' : 'Photo gallery for '}
          {occasion}
        </strong>
        <p>
          {placement === 'cover'
            ? 'One photo will appear at the front of this occasion’s section. It will not be added to the gallery.'
            : 'Selected photos will appear only in this occasion’s gallery. The main section image will stay the same.'}
        </p>
        {current && (
          <>
            <span>
              {current.gallery_count} published gallery{' '}
              {current.gallery_count === 1 ? 'photo' : 'photos'}
            </span>
            {approvedImageUrl(current.cover_url) && (
              <figure>
                <Image
                  src={current.cover_url}
                  width={160}
                  height={110}
                  alt={occasion + ' current main image'}
                />
                <figcaption>Current main section image</figcaption>
              </figure>
            )}
            {current.draft_cover_url &&
              current.draft_cover_url !== current.cover_url &&
              approvedImageUrl(current.draft_cover_url) && (
                <figure>
                  <Image
                    src={current.draft_cover_url}
                    width={160}
                    height={110}
                    alt={occasion + ' draft main image'}
                  />
                  <figcaption>Draft main image — not live yet</figcaption>
                </figure>
              )}
          </>
        )}
        {overviewError && <p>{overviewError}</p>}
      </div>
      <fieldset className="studio-gallery-picker" disabled={saving}>
        <StudioImageField
          key={placement}
          name="photos"
          label={placement === 'cover' ? 'Main section image' : 'Gallery photos'}
          initialValue=""
          multiple={placement === 'gallery'}
          onBusyChange={setUploading}
        />
      </fieldset>
      <p className="studio-gallery-guide">
        {placement === 'cover'
          ? 'Choose one photo. Save as a draft to review it later, or publish to update the main section image.'
          : 'Add up to 20 photos per batch. Each gallery photo remains editable in Decoration services.'}{' '}
        Publish only photos approved for your website.
      </p>
      {error && (
        <p className="admin-alert" role="alert">
          {error}
        </p>
      )}
      <button className="admin-btn" disabled={saving || uploading}>
        {uploading
          ? 'Uploading photos…'
          : saving
            ? 'Saving photos…'
            : placement === 'cover'
              ? 'Save main section image'
              : 'Save gallery photos'}
      </button>
    </form>
  );
}
