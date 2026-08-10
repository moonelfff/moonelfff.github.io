import NextImage, { type StaticImageData } from "next/image";

type Props = {
  src: string | StaticImageData;
  alt: string;
  className?: string;
};

function Image({ src, alt, className }: Props) {
  return (
    <div className={className}>
      <div className="shadow-effect shadow-effect-offset mt-2 w-[clamp(16rem,88vw,32rem)]">
        <div className="image-glass w-full! overflow-hidden rounded-3xl">
          <NextImage
            src={src}
            alt={alt}
            width={640}
            height={800}
            sizes="(max-width: 640px) 88vw, 32rem"
            className="h-auto w-full object-cover"
            priority
          />
          <div className="image-shadow" />
        </div>
      </div>
    </div>
  );
}

export default Image;
