"use client";

import { useEffect, useRef } from "react";
import Typography from "./Typography";

type Props = {
  children: string;
  className?: string;
};

export default function GlassText({ children, className = "" }: Props) {
  const surfaceRef = useRef<HTMLSpanElement>(null);
  const blurRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const surface = surfaceRef.current;
    const blur = blurRef.current;
    if (!surface || !blur) return;
    let disposed = false;

    const updateMask = () => {
      if (disposed) return;
      const { width, height } = surface.getBoundingClientRect();
      if (!width || !height) return;
      const style = getComputedStyle(surface);
      const canvas = document.createElement("canvas");
      const scale = window.devicePixelRatio || 1;
      canvas.width = Math.ceil(width * scale);
      canvas.height = Math.ceil(height * scale);
      const context = canvas.getContext("2d");
      if (!context) return;
      context.scale(scale, scale);
      context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      context.textAlign = "center";
      const metrics = context.measureText(children);
      const baseline = (height + metrics.fontBoundingBoxAscent - metrics.fontBoundingBoxDescent) / 2;
      context.fillStyle = "white";
      context.fillText(children, width / 2, baseline);
      // Clip the backdrop effect to the loaded font's glyphs, not its rectangular box.
      blur.style.maskImage = `url("${canvas.toDataURL()}")`;
    };

    const observer = new ResizeObserver(updateMask);
    observer.observe(surface);
    const style = getComputedStyle(surface);
    void document.fonts.load(`${style.fontWeight} ${style.fontSize} ${style.fontFamily}`, children)
      .then(updateMask);
    return () => {
      disposed = true;
      observer.disconnect();
    };
  }, [children]);

  return (
    <Typography component="span" className={`glass-text ${className}`}>
      <span aria-hidden className="glass-text__backing">
        {children}
      </span>
      <span aria-hidden ref={blurRef} className="glass-text__blur" />
      <span ref={surfaceRef} className="glass-text__surface" data-text={children}>
        {children}
      </span>
    </Typography>
  );
}
