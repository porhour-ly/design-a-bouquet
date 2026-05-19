"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useGesture } from "@use-gesture/react";
import type { Rect } from "./wrappers/types";
import { applySoftBoundary, clampToRect, isInsideRect } from "./bouquetConstraints";

interface DraggableFlowerProps {
  id: string;
  type: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  zIndex: number;
  isSelected: boolean;
  compositionZone?: Rect;
  onDragEnd: (id: string, x: number, y: number) => void;
  onDragStart: (id: string) => void;
  onRotateEnd: (id: string, rotation: number) => void;
  onDelete: (id: string) => void;
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
  compositionZone,
  onDragEnd,
  onDragStart,
  onRotateEnd,
  onDelete,
  registerTransformHandler,
}: DraggableFlowerProps) {
  const motionX = useMotionValue(x);
  const motionY = useMotionValue(y);
  const motionScale = useMotionValue(baseScale);
  const motionRotate = useMotionValue(baseRotation);
  const ref = useRef<HTMLDivElement>(null!);
  const handleRef = useRef<HTMLDivElement>(null);
  const deleteRef = useRef<HTMLDivElement>(null);
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

  // Store compositionZone in a ref so the gesture handler always sees the latest value
  const zoneRef = useRef(compositionZone);
  useEffect(() => {
    zoneRef.current = compositionZone;
  }, [compositionZone]);

  useGesture(
    {
      onDragStart: () => onDragStart(id),
      onDrag: ({ offset: [ox, oy] }) => {
        const zone = zoneRef.current;
        if (zone) {
          const bounded = applySoftBoundary(ox, oy, zone);
          motionX.set(bounded.x);
          motionY.set(bounded.y);
        } else {
          motionX.set(ox);
          motionY.set(oy);
        }
      },
      onDragEnd: () => {
        const zone = zoneRef.current;
        const currentX = motionX.get();
        const currentY = motionY.get();

        if (zone && !isInsideRect(currentX, currentY, zone)) {
          const clamped = clampToRect(currentX, currentY, zone);
          // Spring-animate back to nearest valid position
          animate(motionX, clamped.x, {
            type: "spring",
            stiffness: 300,
            damping: 25,
          });
          animate(motionY, clamped.y, {
            type: "spring",
            stiffness: 300,
            damping: 25,
            onComplete: () => {
              onDragEnd(id, clamped.x, clamped.y);
            },
          });
        } else {
          onDragEnd(id, currentX, currentY);
        }
      },
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

  // Raw DOM listener for delete button to bypass @use-gesture drag
  useEffect(() => {
    const btn = deleteRef.current;
    if (!btn) return;

    const onPointerDown = (e: PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      onDelete(id);
    };

    btn.addEventListener("pointerdown", onPointerDown);
    return () => {
      btn.removeEventListener("pointerdown", onPointerDown);
    };
  }, [isSelected, id, onDelete]);

  return (
    <motion.div
      ref={ref}
      style={{
        x: motionX,
        y: motionY,
        scale: motionScale,
        rotate: motionRotate,
        zIndex: isSelected ? zIndex + 1000000 : zIndex,
        position: "absolute",
        left: 0,
        top: 0,
        touchAction: "none",
        cursor: "grab",
      }}
      className="select-none"
    >
      <span className="text-5xl block">{type}</span>
      {isSelected && (
        <motion.div
          ref={deleteRef}
          style={{
            position: "absolute",
            right: -14,
            top: -14,
            scale: inverseScale,
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: "#ef4444",
            border: "2px solid white",
            boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 700,
            lineHeight: 1,
            color: "white",
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          ✕
        </motion.div>
      )}
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
            cursor: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23333' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4.5 8.3a8 8 0 0 1 11.6-3'/%3E%3Cpath d='M19.5 15.7a8 8 0 0 1-11.6 3'/%3E%3Cpolyline points='2 5.5 4.5 8.3 7.5 6'/%3E%3Cpolyline points='22 18.5 19.5 15.7 16.5 18'/%3E%3C/svg%3E") 12 12, grab`,
            userSelect: "none",
          }}
        >
          ↻
        </motion.div>
      )}
    </motion.div>
  );
}
