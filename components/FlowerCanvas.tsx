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
  rotation: number;
  zIndex: number;
}

export default function FlowerCanvas() {
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const nextZIndex = useRef(1);
  const canvasRef = useRef<HTMLDivElement>(null!);
  const activeFlowerId = useRef<string | null>(null);
  const pinchBaseRotation = useRef(0);
  const transformHandlers = useRef(
    new Map<
      string,
      {
        getScale: () => number;
        setScale: (s: number) => void;
        getRotation: () => number;
        setRotation: (r: number) => void;
      }
    >()
  );

  const registerTransformHandler = useCallback(
    (
      id: string,
      handler: {
        getScale: () => number;
        setScale: (s: number) => void;
        getRotation: () => number;
        setRotation: (r: number) => void;
      }
    ) => {
      transformHandlers.current.set(id, handler);
      return () => {
        transformHandlers.current.delete(id);
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
        rotation: 0,
        zIndex: nextZIndex.current++,
      },
    ]);
    activeFlowerId.current = id;
    setSelectedId(id);
  }, []);

  const handleDragEnd = useCallback((id: string, x: number, y: number) => {
    setFlowers((prev) =>
      prev.map((f) => (f.id === id ? { ...f, x, y } : f))
    );
  }, []);

  const handlePinchEnd = useCallback(
    (id: string, scale: number, rotation: number) => {
      setFlowers((prev) =>
        prev.map((f) => (f.id === id ? { ...f, scale, rotation } : f))
      );
    },
    []
  );

  const handleRotateEnd = useCallback((id: string, rotation: number) => {
    setFlowers((prev) =>
      prev.map((f) => (f.id === id ? { ...f, rotation } : f))
    );
  }, []);

  const handleDragStart = useCallback((id: string) => {
    activeFlowerId.current = id;
    setSelectedId(id);
    const z = nextZIndex.current++;
    setFlowers((prev) =>
      prev.map((f) => (f.id === id ? { ...f, zIndex: z } : f))
    );
  }, []);

  const handleCanvasPointerDown = useCallback((e: React.PointerEvent) => {
    // Only deselect if clicking directly on the canvas background
    if (e.target === e.currentTarget) {
      setSelectedId(null);
    }
  }, []);

  useGesture(
    {
      onPinchStart: () => {
        const id = activeFlowerId.current;
        if (id) {
          const handler = transformHandlers.current.get(id);
          if (handler) {
            pinchBaseRotation.current = handler.getRotation();
          }
        }
      },
      onPinch: ({ offset: [s], movement: [, angleDelta] }) => {
        const id = activeFlowerId.current;
        if (id) {
          const handler = transformHandlers.current.get(id);
          if (handler) {
            handler.setScale(Math.min(3, Math.max(0.5, s)));
            handler.setRotation(pinchBaseRotation.current + angleDelta);
          }
        }
      },
      onPinchEnd: () => {
        const id = activeFlowerId.current;
        if (id) {
          const handler = transformHandlers.current.get(id);
          if (handler) {
            handlePinchEnd(id, handler.getScale(), handler.getRotation());
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
            const handler = transformHandlers.current.get(id);
            if (handler) return [handler.getScale(), 0];
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
        onPointerDown={handleCanvasPointerDown}
      >
        {flowers.map((flower) => (
          <DraggableFlower
            key={flower.id}
            {...flower}
            isSelected={flower.id === selectedId}
            onDragEnd={handleDragEnd}
            onDragStart={handleDragStart}
            onRotateEnd={handleRotateEnd}
            registerTransformHandler={registerTransformHandler}
          />
        ))}
      </div>
      <FlowerPicker onSelect={addFlower} />
    </>
  );
}
