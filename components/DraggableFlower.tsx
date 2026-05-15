"use client";

import { useRef, useEffect } from "react";
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
  registerScaleHandler: (
    id: string,
    handler: { set: (s: number) => void; get: () => number }
  ) => () => void;
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
  registerScaleHandler,
}: DraggableFlowerProps) {
  const motionX = useMotionValue(x);
  const motionY = useMotionValue(y);
  const motionScale = useMotionValue(baseScale);
  const ref = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    return registerScaleHandler(id, {
      set: (s: number) => motionScale.set(s),
      get: () => motionScale.get(),
    });
  }, [id, registerScaleHandler, motionScale]);

  useGesture(
    {
      onDragStart: () => onDragStart(id),
      onDrag: ({ offset: [ox, oy] }) => {
        motionX.set(ox);
        motionY.set(oy);
      },
      onDragEnd: () => onDragEnd(id, motionX.get(), motionY.get()),
    },
    {
      target: ref,
      drag: {
        from: () => [motionX.get(), motionY.get()],
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
