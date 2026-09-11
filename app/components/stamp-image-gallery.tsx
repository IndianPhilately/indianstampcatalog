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
    if (activeIndex === null) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveIndex(null);
      }
    }

    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [activeIndex]);

  function showPreviousImage() {
    setActiveIndex((currentIndex) =>
      currentIndex === null ? null : (currentIndex - 1 + images.length) % images.length
    );
  }

  function showNextImage() {
    setActiveIndex((currentIndex) =>
      currentIndex === null ? null : (currentIndex + 1) % images.length
    );
  }

  function renderImage(image: GalleryImage, imageIndex: number, className: string) {
    return (
      <button
        type="button"
        className="image-lightbox-trigger"
        onClick={() => setActiveIndex(imageIndex)}
        aria-label={`View larger image: ${image.alt}`}
      >
        <img src={image.src} alt={image.alt} className={className} />
      </button>
    );
  }

  const primaryIndex = primaryImage ? images.indexOf(primaryImage) : -1;
  const firstDayCoverIndex = firstDayCover ? images.indexOf(firstDayCover) : -1;
  const brochureStartIndex = firstDayCover ? 2 : 1;

  return (
    <>
      {primaryImage ? (
        <div className="stamp-image-frame">
          {renderImage(primaryImage, primaryIndex, "stamp-image-large")}
        </div>
      ) : null}

      {children}

      {firstDayCover || brochures.length ? <hr className="thin-separator" /> : null}

      {firstDayCover ? (
        <div className="extra-section">
          <h3>First Day Cover</h3>
          <div className="extra-gallery">
            {renderImage(firstDayCover, firstDayCoverIndex, "extra-image")}
          </div>
        </div>
      ) : null}

      {brochures.length ? (
        <div className="extra-section">
          <h3>Brochure</h3>
          <div className="extra-gallery">
            {brochures.map((image, index) =>
              renderImage(image, brochureStartIndex + index, "extra-image")
            )}
          </div>
        </div>
      ) : null}

      {activeIndex !== null ? (
        <div
          className="image-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Stamp image viewer"
          onClick={() => setActiveIndex(null)}
        >
          <button
            type="button"
            className="image-lightbox-close"
            onClick={() => setActiveIndex(null)}
            aria-label="Close image viewer"
          >
            &times;
          </button>
          <button
            type="button"
            className="image-lightbox-control image-lightbox-previous"
            onClick={(event) => {
              event.stopPropagation();
              showPreviousImage();
            }}
            aria-label="Previous image"
          >
            &larr;
          </button>
          <img
            src={images[activeIndex].src}
            alt={images[activeIndex].alt}
            className="image-lightbox-image"
            onClick={(event) => event.stopPropagation()}
          />
          <button
            type="button"
            className="image-lightbox-control image-lightbox-next"
            onClick={(event) => {
              event.stopPropagation();
              showNextImage();
            }}
            aria-label="Next image"
          >
            &rarr;
          </button>
        </div>
      ) : null}
    </>
  );
}
