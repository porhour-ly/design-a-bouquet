"use client";

import { useRef } from "react";
import { motion, useMotionValue } from "framer-motion";
import { useGesture } from "@use-gesture/react";

interface DraggableFlowerProps {
  id: string;
  type: string;
  x: number;
  y: number;
  scale: number;
  zIndex: number;
  onDragEnd: (id: string, x: number, y: number) => void;
  onDragStart: (id: string) => void;
  onScaleEnd: (id: string, scale: number) => void;
}

export default function DraggableFlower({
  id,
  type,
  x,
  y,
  scale: baseScale,
  zIndex,
  onDragEnd,
  onDragStart,
  onScaleEnd,
}: DraggableFlowerProps) {
  const motionX = useMotionValue(x);
  const motionY = useMotionValue(y);
  const motionScale = useMotionValue(baseScale);
  const ref = useRef<HTMLDivElement>(null!);

  useGesture(
    {
      onDragStart: () => onDragStart(id),
      onDrag: ({ offset: [ox, oy] }) => {
        motionX.set(ox);
        motionY.set(oy);
      },
      onDragEnd: () => onDragEnd(id, motionX.get(), motionY.get()),
      onPinch: ({ offset: [s] }) => {
        const clamped = Math.min(3, Math.max(0.5, s));
        motionScale.set(clamped);
      },
      onPinchEnd: () => onScaleEnd(id, motionScale.get()),
    },
    {
      target: ref,
      drag: {
        from: () => [motionX.get(), motionY.get()],
      },
      pinch: {
        scaleBounds: { min: 0.5, max: 3 },
        from: () => [motionScale.get(), 0],
      },
    }
  );

  return (
    <motion.div
      ref={ref}
      style={{
        x: motionX,
        y: motionY,
        scale: motionScale,
        zIndex,
        position: "absolute",
        left: 0,
        top: 0,
        touchAction: "none",
        cursor: "grab",
      }}
      className="select-none"
    >
      <span className="text-5xl block">{type}</span>
    </motion.div>
  );
}
