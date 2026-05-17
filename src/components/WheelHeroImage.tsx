import { useState } from "react";

interface WheelHeroImageProps {
  src?: string;
  alt: string;
  brand?: string;
  className?: string;
}

/**
 * WheelHero-specific image component.
 * WheelHero's image CDN is unreliable (returns noimage.gif or times out),
 * so we detect broken images and swap to a styled brand placeholder
 * featuring a wheel/rim icon instead of a generic "no image" message.
 */
const WheelHeroImage = ({ src, alt, brand, className }: WheelHeroImageProps) => {
  const [errored, setErrored] = useState(false);
  const isNoImage = !src || /noimage\.gif/i.test(src);

  if (errored || isNoImage) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 px-2 text-center">
        {/* Wheel / rim icon */}
        <svg
          viewBox="0 0 64 64"
          width="44"
          height="44"
          fill="none"
          stroke="#71717a"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="32" cy="32" r="26" />
          <circle cx="32" cy="32" r="6" />
          <line x1="32" y1="10" x2="32" y2="26" />
          <line x1="32" y1="38" x2="32" y2="54" />
          <line x1="10" y1="32" x2="26" y2="32" />
          <line x1="38" y1="32" x2="54" y2="32" />
          <line x1="16.5" y1="16.5" x2="27.5" y2="27.5" />
          <line x1="36.5" y1="36.5" x2="47.5" y2="47.5" />
          <line x1="47.5" y1="16.5" x2="36.5" y2="27.5" />
          <line x1="27.5" y1="36.5" x2="16.5" y2="47.5" />
        </svg>

        <div className="text-[10px] font-black text-zinc-300 uppercase tracking-wider truncate max-w-full">
          {brand || "Wheel"}
        </div>
        <div className="text-[9px] font-semibold tracking-wide" style={{ color: "#fbbf24" }}>
          View on WheelHero →
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={className}
      onError={() => setErrored(true)}
    />
  );
};

export default WheelHeroImage;
