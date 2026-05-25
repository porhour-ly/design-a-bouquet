"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useGesture } from "@use-gesture/react";
import type { Rect } from "./wrappers/types";
import { applySoftBoundary, clampToRect, isInsideRect } from "./bouquetConstraints";

type LayerAction = "front" | "back" | "forward" | "backward";

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
  flowerImageHeight?: number;
  onDragEnd: (id: string, x: number, y: number) => void;
  onDragStart: (id: string) => void;
  onRotateEnd: (id: string, rotation: number) => void;
  onDelete: (id: string) => void;
  onLayerChange: (id: string, action: LayerAction) => void;
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
  flowerImageHeight = 250,
  onDragEnd,
  onDragStart,
  onRotateEnd,
  onDelete,
  onLayerChange,
  registerTransformHandler,
}: DraggableFlowerProps) {
  const motionX = useMotionValue(x);
  const motionY = useMotionValue(y);
  const motionScale = useMotionValue(baseScale);
  const motionRotate = useMotionValue(baseRotation);
  const ref = useRef<HTMLDivElement>(null!);
  const handleRef = useRef<HTMLDivElement>(null);
  const deleteRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLDivElement>(null);
  const menuContainerRef = useRef<HTMLDivElement>(null);
  const rotateState = useRef<{ startAngle: number; baseRotation: number } | null>(null);
  // Counter-scale so the handle stays a fixed visual size regardless of flower zoom
  const inverseScale = useTransform(motionScale, (s) => 1 / s);
  const inverseRotate = useTransform(motionRotate, (r) => -r);
  const [isDesktop, setIsDesktop] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Long press refs for mobile
  const longPressFired = useRef(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setIsDesktop(!window.matchMedia("(pointer: coarse)").matches);
  }, []);

  // Auto-close menu when flower is deselected
  useEffect(() => {
    if (!isSelected) setMenuOpen(false);
  }, [isSelected]);

  // Close menu when clicking outside of it
  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (
        menuContainerRef.current?.contains(target) ||
        menuBtnRef.current?.contains(target)
      ) return;
      setMenuOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => window.removeEventListener("pointerdown", onPointerDown, true);
  }, [menuOpen]);

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
      onDragStart: () => {
        if (longPressFired.current) return;
        setMenuOpen(false);
        onDragStart(id);
      },
      onDrag: ({ offset: [ox, oy] }) => {
        if (longPressFired.current) return;
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
        if (longPressFired.current) {
          longPressFired.current = false;
          return;
        }
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
  }, [isSelected, isDesktop, id, getFlowerCenter, motionRotate, onRotateEnd]);

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
  }, [isSelected, menuOpen, id, onDelete]);

  // Raw DOM listener for menu button (desktop) to bypass @use-gesture drag
  useEffect(() => {
    const btn = menuBtnRef.current;
    if (!btn) return;

    const onPointerDown = (e: PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setMenuOpen((prev) => !prev);
    };

    btn.addEventListener("pointerdown", onPointerDown);
    return () => {
      btn.removeEventListener("pointerdown", onPointerDown);
    };
  }, [isSelected, isDesktop]);

  // Raw DOM listener for menu container to prevent drag and dispatch layer actions
  useEffect(() => {
    const container = menuContainerRef.current;
    if (!container) return;

    const onPointerDown = (e: PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const target = e.target as HTMLElement;
      const actionEl = target.closest("[data-layer-action]") as HTMLElement | null;
      if (actionEl) {
        const action = actionEl.dataset.layerAction as LayerAction;
        onLayerChange(id, action);
        setMenuOpen(false);
      }
    };

    container.addEventListener("pointerdown", onPointerDown);
    return () => {
      container.removeEventListener("pointerdown", onPointerDown);
    };
  }, [menuOpen, id, onLayerChange]);

  // Mobile long press to open layer menu
  useEffect(() => {
    if (isDesktop) return;
    const el = ref.current;
    if (!el) return;

    let activePointers = 0;

    const cancelLongPress = () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      longPressStart.current = null;
    };

    const onPointerDown = (e: PointerEvent) => {
      activePointers++;
      // Cancel long press if a second finger touches (pinch gesture)
      if (activePointers > 1) {
        cancelLongPress();
        return;
      }
      // Don't start long press on control elements
      const target = e.target as HTMLElement;
      if (target.closest("[data-layer-action]") || target.closest("[data-control]")) return;

      longPressStart.current = { x: e.clientX, y: e.clientY };
      longPressTimer.current = setTimeout(() => {
        longPressFired.current = true;
        onDragStart(id);
        setMenuOpen(true);
      }, 400);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!longPressStart.current || !longPressTimer.current) return;
      const dx = e.clientX - longPressStart.current.x;
      const dy = e.clientY - longPressStart.current.y;
      if (Math.sqrt(dx * dx + dy * dy) > 8) {
        cancelLongPress();
      }
    };

    const onPointerUp = () => {
      activePointers = Math.max(0, activePointers - 1);
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      longPressStart.current = null;
    };

    // Use capture=false so gesture system sees events first for normal interactions
    el.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };
  }, [isDesktop, id, onDragStart]);

  return (
    <motion.div
      ref={ref}
      data-flower
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
        display: "inline-block",
      }}
      className="select-none"
    >
      {type.startsWith("/") ? (
        <img
          src={type}
          alt=""
          draggable={false}
          style={{ height: flowerImageHeight, width: "auto", display: "block", pointerEvents: "none" }}
        />
      ) : (
        <span className="text-5xl block">{type}</span>
      )}
      {isSelected && !menuOpen && (
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
          ref={menuBtnRef}
          data-control
          style={{
            position: "absolute",
            left: -14,
            top: -14,
            scale: inverseScale,
            width: 26,
            height: 26,
            borderRadius: "50%",
            background: "rgba(255,252,247,0.92)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: "1.5px solid rgba(168,130,90,0.35)",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="5.5" y="1.5" width="3" height="3" rx="1.5" fill="#8B6F4E" />
            <rect x="5.5" y="5.5" width="3" height="3" rx="1.5" fill="#8B6F4E" />
            <rect x="5.5" y="9.5" width="3" height="3" rx="1.5" fill="#8B6F4E" />
          </svg>
        </motion.div>
      )}
      {menuOpen && (
        <motion.div
          ref={menuContainerRef}
          data-control
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.12, ease: "easeOut" }}
          style={{
            position: "absolute",
            left: -16,
            top: 18,
            scale: inverseScale,
            rotate: inverseRotate,
            transformOrigin: "top left",
            background: "rgba(255, 252, 247, 0.92)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(200,180,150,0.35)",
            borderRadius: 14,
            boxShadow:
              "0 6px 24px rgba(100,70,30,0.10), 0 1px 4px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.6)",
            padding: "5px",
            minWidth: 168,
            zIndex: 10,
            userSelect: "none",
          }}
        >
          <div
            style={{
              padding: "5px 10px 4px",
              fontSize: 10,
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "#9c8b7a",
              userSelect: "none",
            }}
          >
            Ordering
          </div>
          {(
            [
              {
                action: "front",
                label: "Move to the front",
                icon: (
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M7.5 3L11 7H4L7.5 3Z" fill="currentColor" />
                    <path d="M7.5 3L11 7H4L7.5 3Z" fill="currentColor" opacity="0.3" transform="translate(0,-2.5)" />
                    <line x1="4" y1="11" x2="11" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                ),
              },
              {
                action: "forward",
                label: "Move forward",
                icon: (
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M7.5 4L10.5 7.5H4.5L7.5 4Z" fill="currentColor" />
                    <line x1="4.5" y1="10.5" x2="10.5" y2="10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                ),
              },
              {
                action: "backward",
                label: "Move backward",
                icon: (
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M7.5 11L4.5 7.5H10.5L7.5 11Z" fill="currentColor" />
                    <line x1="4.5" y1="4.5" x2="10.5" y2="4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                ),
              },
              {
                action: "back",
                label: "Move to the back",
                icon: (
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M7.5 12L4 8H11L7.5 12Z" fill="currentColor" />
                    <path d="M7.5 12L4 8H11L7.5 12Z" fill="currentColor" opacity="0.3" transform="translate(0,2.5)" />
                    <line x1="4" y1="4" x2="11" y2="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                ),
              },
            ] as const
          ).map(({ action, label, icon }) => (
            <div
              key={action}
              data-layer-action={action}
              style={{
                padding: "7px 10px",
                fontSize: 13,
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
                fontWeight: 500,
                letterSpacing: "0.01em",
                color: "#6b4c2a",
                cursor: "pointer",
                whiteSpace: "nowrap",
                borderRadius: 9,
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "background 0.12s, color 0.12s",
              }}
              onPointerEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "rgba(168,130,90,0.12)";
                el.style.color = "#4a3520";
              }}
              onPointerLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "transparent";
                el.style.color = "#6b4c2a";
              }}
            >
              {icon}
              {label}
            </div>
          ))}
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
