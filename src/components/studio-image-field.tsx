'use client';
import Image from 'next/image';
import { useEffect, useId, useRef, useState } from 'react';
import { Upload, Images, X, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  approvedImageUrl,
  publicMediaAssetUrl,
  studioImageTypes,
  type StudioMediaAsset,
} from '@/lib/studio-media';

export function StudioImageField({
  name,
  label,
  initialValue,
  required,
  onBusyChange,
  multiple = false,
}: {
  name: string;
  label: string;
  initialValue: string;
  required?: boolean;
  multiple?: boolean;
  onBusyChange: (busy: boolean) => void;
}) {
  const [value, setValue] = useState(initialValue);
  const [selected, setSelected] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [photos, setPhotos] = useState<StudioMediaAsset[]>([]);
  const [page, setPage] = useState(0);
  const [count, setCount] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const uploadRequest = useRef<AbortController | null>(null);
  const helpId = useId();
  const descriptionId = useId();
  useEffect(() => () => uploadRequest.current?.abort(), []);
  useEffect(() => {
    if (!libraryOpen) return;
    const controller = new AbortController();
    fetch(`/api/admin/media?page=${page}`, { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Could not load your photos.');
        if (controller.signal.aborted) return;
        setPhotos(
          (Array.isArray(result.data) ? result.data : []).filter(
            (asset: StudioMediaAsset) =>
              asset &&
              typeof asset.id === 'string' &&
              publicMediaAssetUrl(asset, process.env.NEXT_PUBLIC_SUPABASE_URL),
          ),
        );
        setCount(Number(result.count) || 0);
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted)
          setError(reason instanceof Error ? reason.message : 'Could not load your photos.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [libraryOpen, page]);

  function selectPhoto(url: string) {
    if (multiple)
      setSelected((current) => (current.includes(url) ? current : [...current, url].slice(0, 20)));
    else setValue(url);
  }
  async function upload(files: File[]) {
    setError('');
    if (multiple && selected.length + files.length > 20) {
      setError('Choose up to 20 photos per batch.');
      return;
    }
    if (
      files.some(
        (file) =>
          !studioImageTypes.includes(file.type) || file.size === 0 || file.size > 10 * 1024 * 1024,
      )
    ) {
      setError('Choose a JPEG, PNG or WebP photo up to 10 MB.');
      return;
    }
    const controller = new AbortController();
    uploadRequest.current = controller;
    setUploading(true);
    onBusyChange(true);
    setLibraryOpen(false);
    try {
      for (const file of files) {
        if (controller.signal.aborted) break;
        const data = new FormData();
        data.set('file', file);
        data.set(
          'alt',
          description.trim() ||
            file.name
              .replace(/\.[^.]+$/, '')
              .replace(/[_-]+/g, ' ')
              .slice(0, 500) ||
            label,
        );
        const response = await fetch('/api/admin/media', {
          method: 'POST',
          body: data,
          signal: controller.signal,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Could not upload your photo.');
        if (typeof result.url !== 'string' || !approvedImageUrl(result.url))
          throw new Error('The upload did not return a usable photo. Please try again.');
        if (!controller.signal.aborted) selectPhoto(result.url);
      }
    } catch (reason) {
      if (!controller.signal.aborted)
        setError(reason instanceof Error ? reason.message : 'Could not upload your photo.');
    } finally {
      if (!controller.signal.aborted) {
        setUploading(false);
        onBusyChange(false);
      }
    }
  }
  const preview = value && approvedImageUrl(value);
  return (
    <fieldset className="studio-image-field" aria-busy={uploading || loading}>
      <legend>
        {label}
        {required ? ' *' : ''}
      </legend>
      <input type="hidden" name={name} value={multiple ? JSON.stringify(selected) : value} />
      {multiple && (
        <div className="studio-gallery-selection">
          <p>{selected.length} / 20 photos selected</p>
          <div className="studio-media-grid">
            {selected.map((url, index) => (
              <div className="studio-selected-photo" key={url}>
                <Image
                  src={url}
                  alt={'Selected gallery photo ' + (index + 1)}
                  width={180}
                  height={130}
                />
                <button
                  type="button"
                  className="admin-btn secondary"
                  disabled={uploading}
                  aria-label={'Remove selected photo ' + (index + 1)}
                  onClick={() => setSelected((current) => current.filter((photo) => photo !== url))}
                >
                  Remove photo {index + 1}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {!multiple &&
        (preview ? (
          <div className="studio-image-preview">
            <Image
              src={value}
              alt={label + ' preview'}
              width={560}
              height={320}
              sizes="(max-width: 600px) 90vw, 560px"
            />
          </div>
        ) : (
          <div className="studio-image-empty">
            <Images size={28} aria-hidden="true" />
            <span>
              {value ? 'Choose a photo to replace the unavailable image.' : 'No photo selected yet'}
            </span>
          </div>
        ))}
      <div className="studio-image-actions">
        <button
          type="button"
          className="admin-btn"
          data-image-trigger
          disabled={uploading}
          aria-describedby={helpId}
          onClick={() => input.current?.click()}
        >
          <Upload size={16} aria-hidden="true" />
          {uploading ? 'Uploading…' : multiple ? 'Upload photos' : 'Upload photo'}
        </button>
        <button
          type="button"
          className="admin-btn secondary"
          disabled={uploading}
          aria-expanded={libraryOpen}
          onClick={() => {
            if (!libraryOpen) {
              setLoading(true);
              setError('');
              setPage(0);
            }
            setLibraryOpen(!libraryOpen);
          }}
        >
          <Images size={16} aria-hidden="true" />
          {libraryOpen ? 'Hide library' : 'Choose from Media library'}
        </button>
        {value && !required && (
          <button
            type="button"
            className="admin-btn secondary"
            disabled={uploading}
            onClick={() => setValue('')}
          >
            <X size={14} aria-hidden="true" />
            Clear photo
          </button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        className="studio-image-file"
        tabIndex={-1}
        aria-label={'Upload ' + label.toLowerCase()}
        multiple={multiple}
        accept="image/jpeg,image/png,image/webp"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = '';
          if (files.length) void upload(multiple ? files : files.slice(0, 1));
        }}
      />
      <label htmlFor={descriptionId} className="studio-image-description">
        Photo description (optional)
        <input
          id={descriptionId}
          type="text"
          value={description}
          maxLength={500}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Describe a new photo before uploading"
        />
      </label>
      <p id={helpId} className="studio-image-help">
        JPEG, PNG or WebP · up to 10 MB. Uploaded photos are also saved in your public Media
        library.
      </p>
      {uploading && (
        <p role="status" className="studio-image-help">
          Uploading your photo. Please wait before saving.
        </p>
      )}
      {error && (
        <p className="admin-alert" role="alert">
          {error}
        </p>
      )}
      {libraryOpen && (
        <div className="studio-media-library" aria-label="Choose a photo from Media library">
          {loading ? (
            <p role="status">Loading photos…</p>
          ) : (
            <>
              {photos.length ? (
                <div className="studio-media-grid">
                  {photos.map((photo) => {
                    const url = publicMediaAssetUrl(photo, process.env.NEXT_PUBLIC_SUPABASE_URL)!;
                    return (
                      <button
                        type="button"
                        key={photo.id}
                        aria-label={'Use photo: ' + photo.name}
                        className={
                          (multiple ? selected.includes(url) : value === url) ? 'selected' : ''
                        }
                        aria-pressed={multiple ? selected.includes(url) : value === url}
                        disabled={multiple && selected.includes(url)}
                        onClick={() => {
                          if (multiple && selected.length >= 20) {
                            setError('Choose up to 20 photos per batch.');
                            return;
                          }
                          selectPhoto(url);
                          setError('');
                          if (!multiple) setLibraryOpen(false);
                        }}
                      >
                        <Image
                          src={url}
                          alt={photo.alt_text || photo.name}
                          width={180}
                          height={130}
                          sizes="(max-width:600px) 40vw, 180px"
                        />
                        <span>{photo.name}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p>No public photos on this page. Upload a photo or try another page.</p>
              )}
              <div className="studio-media-pages">
                <button
                  type="button"
                  className="admin-btn secondary"
                  disabled={page === 0}
                  aria-label="Previous photo page"
                  onClick={() => {
                    setLoading(true);
                    setError('');
                    setPage(page - 1);
                  }}
                >
                  <ChevronLeft size={16} />
                </button>
                <span>Page {page + 1}</span>
                <button
                  type="button"
                  className="admin-btn secondary"
                  disabled={(page + 1) * 25 >= count}
                  aria-label="Next photo page"
                  onClick={() => {
                    setLoading(true);
                    setError('');
                    setPage(page + 1);
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              {error && (
                <button
                  type="button"
                  className="admin-btn secondary"
                  onClick={() => {
                    setLibraryOpen(false);
                  }}
                >
                  Close library
                </button>
              )}
            </>
          )}
        </div>
      )}
    </fieldset>
  );
}
