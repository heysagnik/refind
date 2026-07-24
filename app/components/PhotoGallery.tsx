'use client';

import { useRef, useState } from 'react';

interface Props {
  images: string[];
  alt: string;
  className?: string;
}

export function PhotoGallery({ images, alt, className = '' }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el || el.clientWidth === 0) return;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  }

  function goTo(index: number) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' });
  }

  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <div className={`bg-bg overflow-hidden ${className}`}>
        <img src={images[0]} alt={alt} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div className={`relative bg-bg overflow-hidden ${className}`}>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex w-full h-full overflow-x-auto snap-x snap-mandatory no-scrollbar"
      >
        {images.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`${alt} — photo ${i + 1} of ${images.length}`}
            className="w-full h-full object-cover shrink-0 snap-center"
          />
        ))}
      </div>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
        {images.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Go to photo ${i + 1}`}
            className={`h-1.5 rounded-full transition-all duration-150 cursor-pointer ${
              active === i ? 'bg-white w-5' : 'bg-white/60 w-1.5'
            }`}
          />
        ))}
      </div>

      <span className="absolute bottom-3 right-3 rounded-pill px-2.5 py-1 text-[11px] font-bold bg-surface/90 backdrop-blur-md text-ink shadow-floating">
        {active + 1}/{images.length}
      </span>
    </div>
  );
}
