import { ResponsiveImage } from "@responsive-image/react";
import type { ImageData } from "@responsive-image/core";

type Props = {
  src: ImageData;
  alt: string;
  className?: string;
};

function Image({ src, alt, className }: Props) {
  return (
    <div className={` ${className}`}>
      <div className="shadow-effect shadow-effect-offset mt-2 w-fit!">
        <div className="image-glass rounded-3xl">
          <ResponsiveImage
            src={src}
            alt={alt}
            className="w-full lg:max-w-160 lg:min-w-120"
            fetchPriority="high"
          />
          <div className="image-shadow" />
        </div>
      </div>
    </div>
  );
}

export default Image;
