import { memo } from "react";
import { cn } from "@/lib/utils";

type LazyImageProps = {
  src: string;
  alt: string;
  className?: string;
};

/** Aperçu léger : pas de state React au chargement → scroll plus fluide. */
export const LazyImage = memo(function LazyImage({ src, alt, className }: LazyImageProps) {
  return (
    <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        fetchPriority="low"
        width={480}
        height={270}
        className={cn("h-full w-full object-contain", className)}
      />
    </div>
  );
});
