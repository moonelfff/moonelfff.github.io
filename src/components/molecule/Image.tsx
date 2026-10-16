import NextImage, { type StaticImageData } from "next/image";
import { Skeleton } from "../atom/Skeleton";

type Props = {
  src: string | StaticImageData;
  alt: string;
  className?: string;
};

function Image({ src, alt, className }: Props) {
  return (
    <div className={className}>
      <div className="shadow-effect shadow-effect-offset mt-2 w-[clamp(16rem,88vw,32rem)]">
        <div className="image-glass relative aspect-4/5 w-full! overflow-hidden rounded-3xl">
          {/* Sits behind the photo, so it is only visible until the image has loaded. */}
          <Skeleton className="absolute inset-0 rounded-none" />
          <NextImage
            src={src}
            alt={alt}
            width={640}
            height={800}
            sizes="(max-width: 767px) calc(100vw - 24px), (max-width: 1023px) calc(100vw - 96px), 32rem"
            quality={90}
            className="relative h-full w-full object-cover"
            loading="eager"
            fetchPriority="high"
          />
          <div className="image-shadow" />
        </div>
      </div>
    </div>
  );
}

export default Image;
