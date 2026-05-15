"use client";

import { useState, useCallback, useRef } from "react";
import { useGesture } from "@use-gesture/react";
import dynamic from "next/dynamic";
import FlowerPicker from "./FlowerPicker";

const DraggableFlower = dynamic(() => import("./DraggableFlower"), {
  ssr: false,
});

interface Flower {
  id: string;
  type: string;
  x: number;
  y: number;
  scale: number;
  zIndex: number;
}

export default function FlowerCanvas() {
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const nextZIndex = useRef(1);
  const canvasRef = useRef<HTMLDivElement>(null!);
  const activeFlowerId = useRef<string | null>(null);
  const scaleHandlers = useRef(
    new Map<string, { set: (s: number) => void; get: () => number }>()
  );

  const registerScaleHandler = useCallback(
    (id: string, handler: { set: (s: number) => void; get: () => number }) => {
      scaleHandlers.current.set(id, handler);
      return () => {
        scaleHandlers.current.delete(id);
      };
    },
    []
  );

  const addFlower = useCallback((type: string) => {
    const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    const centerX = window.innerWidth / 2 - 24;
    const centerY = window.innerHeight / 2 - 24;
    const offsetX = (Math.random() - 0.5) * 60;
    const offsetY = (Math.random() - 0.5) * 60;

    setFlowers((prev) => [
      ...prev,
      {
        id,
        type,
        x: centerX + offsetX,
        y: centerY + offsetY,
        scale: 1,
        zIndex: nextZIndex.current++,
      },
    ]);
    activeFlowerId.current = id;
  }, []);

  const handleDragEnd = useCallback((id: string, x: number, y: number) => {
    setFlowers((prev) =>
      prev.map((f) => (f.id === id ? { ...f, x, y } : f))
    );
  }, []);

  const handleScaleEnd = useCallback((id: string, scale: number) => {
    setFlowers((prev) =>
      prev.map((f) => (f.id === id ? { ...f, scale } : f))
    );
  }, []);

  const handleDragStart = useCallback((id: string) => {
    activeFlowerId.current = id;
    const z = nextZIndex.current++;
    setFlowers((prev) =>
      prev.map((f) => (f.id === id ? { ...f, zIndex: z } : f))
    );
  }, []);

  useGesture(
    {
      onPinch: ({ offset: [s] }) => {
        const id = activeFlowerId.current;
        if (id) {
          const handler = scaleHandlers.current.get(id);
          if (handler) {
            handler.set(Math.min(3, Math.max(0.5, s)));
          }
        }
      },
      onPinchEnd: () => {
        const id = activeFlowerId.current;
        if (id) {
          const handler = scaleHandlers.current.get(id);
          if (handler) {
            handleScaleEnd(id, handler.get());
          }
        }
      },
    },
    {
      target: canvasRef,
      pinch: {
        scaleBounds: { min: 0.5, max: 3 },
        from: () => {
          const id = activeFlowerId.current;
          if (id) {
            const handler = scaleHandlers.current.get(id);
            if (handler) return [handler.get(), 0];
          }
          return [1, 0];
        },
      },
    }
  );

  return (
    <>
      <div
        ref={canvasRef}
        className="fixed inset-0 overflow-hidden"
        style={{ touchAction: "none" }}
      >
        {flowers.map((flower) => (
          <DraggableFlower
            key={flower.id}
            {...flower}
            onDragEnd={handleDragEnd}
            onDragStart={handleDragStart}
            registerScaleHandler={registerScaleHandler}
          />
        ))}
      </div>
      <FlowerPicker onSelect={addFlower} />
    </>
  );
}
