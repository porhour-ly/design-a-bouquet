"use client";

interface SvgWrapperProps {
  src: string;
  width: number;
  height: number;
}

export default function SvgWrapper({ src, width, height }: SvgWrapperProps) {
  return (
    <img
      src={src}
      alt=""
      draggable={false}
      style={{
        width,
        height,
        pointerEvents: "none",
        userSelect: "none",
      }}
    />
  );
}
