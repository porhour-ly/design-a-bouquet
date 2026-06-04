"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useGesture } from "@use-gesture/react";
import dynamic from "next/dynamic";
import AssetPicker from "./AssetPicker";
import SaveButton from "./SaveButton";
import { WRAPPER_REGISTRY, SvgWrapper } from "./wrappers";
import type { WrapperType, Rect } from "./wrappers";
import {
  computeResponsiveWrapper,
  getViewportZone,
  getSpawnPosition,
  clampToRect,
} from "./bouquetConstraints";
import type { ResponsiveWrapperResult } from "./bouquetConstraints";
import { useMaskBoundary } from "./useMaskBoundary";
import { useUndoHistory } from "./useUndoHistory";
import type { Flower } from "@/lib/bouquetData";

const DraggableFlower = dynamic(() => import("./DraggableFlower"), {
  ssr: false,
});

function isNoteCard(type: string) {
  return type.startsWith("/notes/");
}

export default function FlowerCanvas() {
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const { pushSnapshot, popSnapshot } = useUndoHistory();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeWrapper, setActiveWrapper] = useState<WrapperType>("pink");
  const nextZIndex = useRef(1);
  const canvasRef = useRef<HTMLDivElement>(null!);
  const activeFlowerId = useRef<string | null>(null);
  const draggingIdRef = useRef<string | null>(null);
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

  // Reserve space: ~50px top (save button), ~160px bottom (picker + safe area)
  const RESERVE_TOP = 50;
  const RESERVE_BOTTOM = 160;

  const [responsive, setResponsive] = useState<ResponsiveWrapperResult>(() => {
    const entry = WRAPPER_REGISTRY[activeWrapper];
    return computeResponsiveWrapper(entry, 0, 0, RESERVE_TOP, RESERVE_BOTTOM);
  });
  const { zone, assets } = responsive;
  const wrapperPos = responsive.wrapperPos;

  // Compute responsive wrapper on mount and resize
  useEffect(() => {
    const update = () => {
      const entry = WRAPPER_REGISTRY[activeWrapper];
      setResponsive(
        computeResponsiveWrapper(entry, window.innerWidth, window.innerHeight, RESERVE_TOP, RESERVE_BOTTOM)
      );
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [activeWrapper]);

  // Compute the composition zone in viewport coordinates
  const compositionZoneVP: Rect = getViewportZone(zone.compositionZone, wrapperPos);

  const entry = WRAPPER_REGISTRY[activeWrapper];
  const maskBoundary = useMaskBoundary(entry.native, compositionZoneVP, wrapperPos, responsive.scale);

  // Flower image height scales proportionally with wrapper width
  const FLOWER_HEIGHT_RATIO = 250 / 384;
  const flowerImageHeight = Math.round(zone.width * FLOWER_HEIGHT_RATIO);

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

  const hasNoteCard = flowers.some((f) => isNoteCard(f.type));

  const addFlower = useCallback(
    (type: string) => {
      // Only allow one note card at a time
      if (isNoteCard(type)) {
        const alreadyHasNote = flowers.some((f) => isNoteCard(f.type));
        if (alreadyHasNote) return;
      }

      const id =
        Math.random().toString(36).slice(2) + Date.now().toString(36);
      const spawnPos = maskBoundary.isReady
        ? maskBoundary.getSpawnPosition(zone, wrapperPos)
        : getSpawnPosition(zone, wrapperPos);

      pushSnapshot(flowers);
      setFlowers((prev) => [
        ...prev,
        {
          id,
          type,
          x: spawnPos.x,
          y: spawnPos.y,
          scale: 1,
          rotation: 0,
          zIndex: nextZIndex.current++,
        },
      ]);
      activeFlowerId.current = id;
      setSelectedId(id);
    },
    [zone, wrapperPos, flowers, maskBoundary, pushSnapshot]
  );

  const handleDragEnd = useCallback((id: string, x: number, y: number) => {
    setFlowers((prev) => {
      pushSnapshot(prev);
      return prev.map((f) => (f.id === id ? { ...f, x, y } : f));
    });
  }, [pushSnapshot]);

  const handlePinchEnd = useCallback(
    (id: string, scale: number, rotation: number) => {
      setFlowers((prev) => {
        pushSnapshot(prev);
        return prev.map((f) => (f.id === id ? { ...f, scale, rotation } : f));
      });
    },
    [pushSnapshot]
  );

  const handleRotateEnd = useCallback((id: string, rotation: number) => {
    setFlowers((prev) => {
      pushSnapshot(prev);
      return prev.map((f) => (f.id === id ? { ...f, rotation } : f));
    });
  }, [pushSnapshot]);

  const handleDelete = useCallback((id: string) => {
    setFlowers((prev) => {
      pushSnapshot(prev);
      return prev.filter((f) => f.id !== id);
    });
    setSelectedId(null);
    activeFlowerId.current = null;
  }, [pushSnapshot]);

  const handleDragStart = useCallback((id: string) => {
    activeFlowerId.current = id;
    setSelectedId(id);
  }, []);

  const handleLayerChange = useCallback(
    (id: string, action: "front" | "back" | "forward" | "backward") => {
      setFlowers((prev) => {
        const target = prev.find((f) => f.id === id);
        if (!target) return prev;

        if (action === "front") {
          pushSnapshot(prev);
          const z = nextZIndex.current++;
          return prev.map((f) => (f.id === id ? { ...f, zIndex: z } : f));
        }

        if (action === "back") {
          const minZ = Math.min(...prev.map((f) => f.zIndex));
          if (target.zIndex === minZ) return prev; // already at back
          pushSnapshot(prev);
          // Keep z-index >= 1 so flowers stay above the back wrapper (z-index 0)
          const newZ = Math.max(minZ - 1, 1);
          if (newZ === minZ) {
            // Can't go lower without hitting the wrapper; shift others up instead
            nextZIndex.current++;
            return prev.map((f) =>
              f.id === id ? { ...f, zIndex: 1 } : { ...f, zIndex: f.zIndex + 1 }
            );
          }
          return prev.map((f) =>
            f.id === id ? { ...f, zIndex: newZ } : f
          );
        }

        if (action === "forward") {
          // Find flower with smallest zIndex that is still > target's zIndex
          const above = prev
            .filter((f) => f.zIndex > target.zIndex)
            .sort((a, b) => a.zIndex - b.zIndex);
          if (above.length === 0) return prev; // already at front
          pushSnapshot(prev);
          const swap = above[0];
          return prev.map((f) => {
            if (f.id === id) return { ...f, zIndex: swap.zIndex };
            if (f.id === swap.id) return { ...f, zIndex: target.zIndex };
            return f;
          });
        }

        // backward
        const below = prev
          .filter((f) => f.zIndex < target.zIndex)
          .sort((a, b) => b.zIndex - a.zIndex);
        if (below.length === 0) return prev; // already at back
        pushSnapshot(prev);
        const swap = below[0];
        return prev.map((f) => {
          if (f.id === id) return { ...f, zIndex: swap.zIndex };
          if (f.id === swap.id) return { ...f, zIndex: target.zIndex };
          return f;
        });
      });
      // Deselect so the +1000000 visual z-index boost drops and the
      // new layer position is immediately visible
      setSelectedId(null);
    },
    [pushSnapshot]
  );

  const handleCanvasPointerDown = useCallback((e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest("[data-flower]")) {
      setSelectedId(null);
    }
  }, []);

  const handleWrapperSelect = useCallback(
    (type: WrapperType) => {
      setActiveWrapper(type);
      // Re-clamp flowers to new composition zone
      const entry = WRAPPER_REGISTRY[type];
      const result = computeResponsiveWrapper(
        entry,
        window.innerWidth,
        window.innerHeight,
        RESERVE_TOP,
        RESERVE_BOTTOM,
      );
      setResponsive(result);
      const newCompZone = getViewportZone(result.zone.compositionZone, result.wrapperPos);
      setFlowers((prev) =>
        prev.map((f) => {
          const clamped = clampToRect(f.x, f.y, newCompZone);
          return { ...f, x: clamped.x, y: clamped.y };
        })
      );
    },
    []
  );

  // --- Undo ---
  const handleUndo = useCallback(() => {
    const prev = popSnapshot();
    if (prev) {
      setFlowers(prev);
      setSelectedId(null);
    }
  }, [popSnapshot]);

  // Desktop: Cmd/Ctrl+Z
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleUndo]);

  // Mobile: Two-finger double-tap detected via pinch gesture lifecycle
  const pinchStartTime = useRef(0);
  const lastTwoFingerTap = useRef(0);
  const pinchMoved = useRef(false);

  useGesture(
    {
      onPinchStart: () => {
        pinchStartTime.current = Date.now();
        pinchMoved.current = false;
        const id = activeFlowerId.current;
        if (id) {
          const handler = transformHandlers.current.get(id);
          if (handler) {
            pinchBaseRotation.current = handler.getRotation();
          }
        }
      },
      onPinch: ({ offset: [s], movement: [, angleDelta], first }) => {
        if (first) return;
        pinchMoved.current = true;
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
        const elapsed = Date.now() - pinchStartTime.current;
        if (!pinchMoved.current && elapsed < 300) {
          const now = Date.now();
          if (now - lastTwoFingerTap.current < 400) {
            handleUndo();
            lastTwoFingerTap.current = 0;
          } else {
            lastTwoFingerTap.current = now;
          }
          return; // Don't commit pinch state for a tap
        }

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
        style={{ touchAction: "none", zIndex: 0 }}
        onPointerDown={handleCanvasPointerDown}
      >
        {/* Wrapper back layer (behind flowers) */}
        <div
          style={{
            position: "absolute",
            left: wrapperPos.x + assets.back.x,
            top: wrapperPos.y + assets.back.y,
            zIndex: 0,
          }}
        >
          <SvgWrapper src={assets.back.src} width={assets.back.width} height={assets.back.height} />
        </div>

        {/* Flowers */}
        {flowers.map((flower) => (
          <DraggableFlower
            key={flower.id}
            {...flower}
            isSelected={flower.id === selectedId}
            compositionZone={compositionZoneVP}
            maskBoundary={maskBoundary}
            draggingIdRef={draggingIdRef}
            flowerImageHeight={flowerImageHeight}
            onDragEnd={handleDragEnd}
            onDragStart={handleDragStart}
            onRotateEnd={handleRotateEnd}
            onDelete={handleDelete}
            onLayerChange={handleLayerChange}
            registerTransformHandler={registerTransformHandler}
          />
        ))}

        {/* Wrapper front layer (in front of flowers) */}
        <div
          style={{
            position: "absolute",
            left: wrapperPos.x + assets.front.x,
            top: wrapperPos.y + assets.front.y,
            zIndex: 999999,
            pointerEvents: "none",
          }}
        >
          <SvgWrapper src={assets.front.src} width={assets.front.width} height={assets.front.height} />
        </div>
      </div>
      <SaveButton
        flowers={flowers}
        activeWrapper={activeWrapper}
        compositionZoneVP={compositionZoneVP}
        hasNoteCard={hasNoteCard}
      />
      <AssetPicker
        onSelect={addFlower}
        onWrapperSelect={handleWrapperSelect}
        activeWrapper={activeWrapper}
      />
    </>
  );
}
