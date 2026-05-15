"use client";

import { useState, useCallback, useRef } from "react";
import DraggableFlower from "./DraggableFlower";
import FlowerPicker from "./FlowerPicker";

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

  const addFlower = useCallback((type: string) => {
    const id = crypto.randomUUID();
    const centerX = window.innerWidth / 2 - 24;
    const centerY = window.innerHeight / 2 - 24;
    // Add a small random offset so stacked flowers don't perfectly overlap
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
    const z = nextZIndex.current++;
    setFlowers((prev) =>
      prev.map((f) => (f.id === id ? { ...f, zIndex: z } : f))
    );
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ touchAction: "none" }}>
      {flowers.map((flower) => (
        <DraggableFlower
          key={flower.id}
          {...flower}
          onDragEnd={handleDragEnd}
          onDragStart={handleDragStart}
          onScaleEnd={handleScaleEnd}
        />
      ))}
      <FlowerPicker onSelect={addFlower} />
    </div>
  );
}
