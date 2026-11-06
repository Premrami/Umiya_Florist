'use client';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
export function OccasionGallery({ occasion, photos }: { occasion: string; photos: string[] }) {
  const [selected, setSelected] = useState<number | null>(null);
  const backButton = useRef<HTMLButtonElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const lastSelected = useRef<number | null>(null);
  useEffect(() => {
    if (selected !== null) {
      lastSelected.current = selected;
      backButton.current?.focus();
    } else if (lastSelected.current !== null)
      grid.current?.querySelectorAll('button')[lastSelected.current]?.focus();
  }, [selected]);
  const move = (direction: number) =>
    setSelected((current) =>
      current === null ? null : (current + direction + photos.length) % photos.length,
    );
  return (
    <div
      className="occasion-gallery-content"
      onKeyDown={(event) => {
        if (selected === null) return;
        if (event.key === 'ArrowRight') {
          event.preventDefault();
          move(1);
        }
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          move(-1);
        }
      }}
    >
      <span className="eyebrow">THE OCCASION EDIT</span>
      <h2>{occasion} gallery</h2>
      {selected === null ? (
        <>
          <p>
            {photos.length
              ? 'A closer look at the details. Select a photo to explore.'
              : 'Photos for this occasion are being gathered. We would love to hear your ideas.'}
          </p>
          <div ref={grid} className="occasion-gallery-grid">
            {photos.map((src, index) => (
              <button
                type="button"
                key={src}
                onClick={() => setSelected(index)}
                aria-label={'Open ' + occasion.toLowerCase() + ' photo ' + (index + 1)}
              >
                <Image
                  src={src}
                  width={650}
                  height={800}
                  alt={occasion + ' floral decoration ' + (index + 1)}
                  sizes="(max-width:600px) 45vw, 30vw"
                />
                <span>View photo {index + 1}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <button className="occasion-back" type="button" onClick={() => setSelected(null)}>
            <ArrowLeft size={16} />
            Back to gallery
          </button>
          <div className="occasion-gallery-full">
            <Image
              key={photos[selected]}
              src={photos[selected]}
              width={1400}
              height={1100}
              alt={occasion + ' floral decoration ' + (selected + 1)}
              sizes="(max-width:600px) 90vw, 1000px"
            />
          </div>
          <div className="occasion-gallery-controls">
            <button
              type="button"
              aria-label="Previous occasion photo"
              disabled={photos.length < 2}
              onClick={() => move(-1)}
            >
              <ChevronLeft size={20} />
            </button>
            <span role="status" aria-live="polite">
              Photo {selected + 1} of {photos.length}
            </span>
            <button
              type="button"
              aria-label="Next occasion photo"
              disabled={photos.length < 2}
              onClick={() => move(1)}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
