"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

type GalleryImage = {
  src: string;
  alt: string;
};

type StampImageGalleryProps = {
  primaryImage: GalleryImage | null;
  firstDayCover: GalleryImage | null;
  brochures: GalleryImage[];
  children?: ReactNode;
};

export default function StampImageGallery({
  primaryImage,
  firstDayCover,
  brochures,
  children,
}: StampImageGalleryProps) {
  const images = [primaryImage, firstDayCover, ...brochures].filter(
    (image): image is GalleryImage => image !== null
  );

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    if (activeIndex === null) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setActiveIndex(null);
    }

    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [activeIndex]);

  function showPreviousImage() {
    setActiveIndex((curr) => (curr === null ? null : (curr - 1 + images.length) % images.length));
  }

  function showNextImage() {
    setActiveIndex((curr) => (curr === null ? null : (curr + 1) % images.length));
  }

  const firstDayCoverIndex = primaryImage ? 1 : 0;
  const brochureStartIndex = (primaryImage ? 1 : 0) + (firstDayCover ? 1 : 0);

  return (
    <>
      {/* Primary Hero Stamp Showcase Frame */}
      {primaryImage ? (
        <div className="w-full flex justify-center items-center py-2.5 sm:py-3 px-3 bg-[#F1F4F7] rounded-xl border border-slate-200/70 overflow-hidden">
          <button
            type="button"
            className="group cursor-zoom-in inline-flex items-center justify-center p-0 outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
            onClick={() => setActiveIndex(0)}
            aria-label={`View larger image: ${primaryImage.alt}`}
          >
            <img
              src={primaryImage.src}
              alt={primaryImage.alt}
              loading="eager"
              decoding="sync"
              className="max-w-[540px] w-auto max-h-[400px] object-contain drop-shadow-md rounded-sm block"
            />
          </button>
        </div>
      ) : null}

      {children}

      {/* Extra Images (First Day Cover & Brochures) */}
      {(firstDayCover || brochures.length > 0) && (
        <div className="pt-5 border-t border-slate-100 space-y-5">
          {firstDayCover ? (
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-2.5">First Day Cover</h3>
              <button
                type="button"
                className="bg-[#F1F4F7] p-2 rounded-xl border border-slate-200/70 hover:border-blue-400 transition"
                onClick={() => setActiveIndex(firstDayCoverIndex)}
              >
                <img
                  src={firstDayCover.src}
                  alt={firstDayCover.alt}
                  className="max-w-[240px] max-h-[160px] object-contain rounded shadow-xs"
                />
              </button>
            </div>
          ) : null}

          {brochures.length ? (
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-2.5">Brochure</h3>
              <div className="flex flex-wrap gap-3">
                {brochures.map((image, index) => (
                  <button
                    key={image.src}
                    type="button"
                    className="bg-[#F1F4F7] p-2 rounded-xl border border-slate-200/70 hover:border-blue-400 transition"
                    onClick={() => setActiveIndex(brochureStartIndex + index)}
                  >
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="max-w-[200px] max-h-[160px] object-contain rounded shadow-xs"
                    />
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Fullscreen Lightbox */}
      {activeIndex !== null ? (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          onClick={() => setActiveIndex(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-white hover:text-slate-300 p-2 text-2xl font-bold transition cursor-pointer"
            onClick={() => setActiveIndex(null)}
            aria-label="Close image viewer"
          >
            &times;
          </button>

          <button
            type="button"
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              showPreviousImage();
            }}
            aria-label="Previous image"
          >
            &#8592;
          </button>

          <img
            src={images[activeIndex].src}
            alt={images[activeIndex].alt}
            className="max-w-full max-h-[85vh] object-contain rounded shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              showNextImage();
            }}
            aria-label="Next image"
          >
            &#8594;
          </button>
        </div>
      ) : null}
    </>
  );
}