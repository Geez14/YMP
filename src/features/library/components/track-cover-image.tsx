"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type TrackCoverImageProps = {
  src: string | null;
  alt: string;
};

export function TrackCoverImage({ src, alt }: TrackCoverImageProps) {
  const [hasError, setHasError] = useState(false);

  const fallbackLetter = useMemo(() => {
    const first = alt.trim().charAt(0);
    return first ? first.toUpperCase() : "?";
  }, [alt]);

  const fallbackStyles = useMemo(
    () => ({
      backgroundImage:
        "linear-gradient(135deg, var(--ymp-cover-fallback-from, #cbd5e1), var(--ymp-cover-fallback-to, #64748b))",
      color: "var(--ymp-cover-fallback-text, #0f172a)",
    }),
    [],
  );

  if (hasError || !src) {
    return (
      <div className="absolute inset-0">
        <div
          className="flex h-full w-full items-center justify-center text-xl font-bold"
          style={fallbackStyles}
        >
          {fallbackLetter}
        </div>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      unoptimized={src.startsWith("/api/")}
      className="absolute inset-0 object-cover"
      onError={() => setHasError(true)}
      sizes="(max-width: 768px) 100vw, 320px"
    />
  );
}