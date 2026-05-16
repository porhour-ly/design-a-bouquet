"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { useGesture } from "@use-gesture/react";

interface DraggableFlowerProps {
  id: string;
  type: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  zIndex: number;
  isSelected: boolean;
  onDragEnd: (id: string, x: number, y: number) => void;
  onDragStart: (id: string) => void;
  onRotateEnd: (id: string, rotation: number) => void;
  registerTransformHandler: (
    id: string,
    handler: {
      getScale: () => number;
      setScale: (s: number) => void;
      getRotation: () => number;
      setRotation: (r: number) => void;
    }
  ) => () => void;
}

export default function DraggableFlower({
  id,
  type,
  x,
  y,
  scale: baseScale,
  rotation: baseRotation,
  zIndex,
  isSelected,
  onDragEnd,
  onDragStart,
  onRotateEnd,
  registerTransformHandler,
}: DraggableFlowerProps) {
  const motionX = useMotionValue(x);
  const motionY = useMotionValue(y);
  const motionScale = useMotionValue(baseScale);
  const motionRotate = useMotionValue(baseRotation);
  const ref = useRef<HTMLDivElement>(null!);
  const handleRef = useRef<HTMLDivElement>(null);
  const rotateState = useRef<{ startAngle: number; baseRotation: number } | null>(null);
  // Counter-scale so the handle stays a fixed visual size regardless of flower zoom
  const inverseScale = useTransform(motionScale, (s) => 1 / s);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    setIsDesktop(!window.matchMedia("(pointer: coarse)").matches);
  }, []);

  useEffect(() => {
    return registerTransformHandler(id, {
      getScale: () => motionScale.get(),
      setScale: (s: number) => motionScale.set(s),
      getRotation: () => motionRotate.get(),
      setRotation: (r: number) => motionRotate.set(r),
    });
  }, [id, registerTransformHandler, motionScale, motionRotate]);

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

  const getFlowerCenter = useCallback(() => {
    const el = ref.current;
    if (!el) return { cx: 0, cy: 0 };
    const rect = el.getBoundingClientRect();
    return { cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2 };
  }, []);

  // Re-attach raw DOM pointerdown when isSelected changes so the listener
  // exists whenever the handle element is in the DOM
  useEffect(() => {
    const handle = handleRef.current;
    if (!handle) return;

    const onPointerDown = (e: PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();

      // Active style
      handle.style.background = "#7c3aed";
      handle.style.color = "white";
      handle.style.borderColor = "white";
      handle.style.boxShadow = "0 2px 8px rgba(124,58,237,0.4)";

      const { cx, cy } = getFlowerCenter();
      const startAngle =
        Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);
      rotateState.current = {
        startAngle,
        baseRotation: motionRotate.get(),
      };

      const onMove = (ev: PointerEvent) => {
        if (!rotateState.current) return;
        const { cx: curCx, cy: curCy } = getFlowerCenter();
        const currentAngle =
          Math.atan2(ev.clientY - curCy, ev.clientX - curCx) * (180 / Math.PI);
        const delta = currentAngle - rotateState.current.startAngle;
        motionRotate.set(rotateState.current.baseRotation + delta);
      };

      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        // Reset to idle style
        handle.style.background = "white";
        handle.style.color = "#6b7280";
        handle.style.borderColor = "#9ca3af";
        handle.style.boxShadow = "0 1px 4px rgba(0,0,0,0.12)";
        onRotateEnd(id, motionRotate.get());
        rotateState.current = null;
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    };

    handle.addEventListener("pointerdown", onPointerDown);
    return () => {
      handle.removeEventListener("pointerdown", onPointerDown);
    };
  }, [isSelected, id, getFlowerCenter, motionRotate, onRotateEnd]);

  return (
    <motion.div
      ref={ref}
      style={{
        x: motionX,
        y: motionY,
        scale: motionScale,
        rotate: motionRotate,
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
      {isSelected && isDesktop && (
        <motion.div
          ref={handleRef}
          style={{
            position: "absolute",
            left: "50%",
            bottom: -44,
            x: "-50%",
            scale: inverseScale,
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "white",
            border: "2.5px solid #9ca3af",
            boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            color: "#6b7280",
            transition: "background 0.15s, color 0.15s, border-color 0.15s, box-shadow 0.15s",
            cursor: "grab",
            userSelect: "none",
          }}
        >
          ↻
        </motion.div>
      )}
    </motion.div>
  );
}
