"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AssetPickerProps {
  onSelect: (type: string) => void;
}

interface Category {
  id: string;
  label: string;
  icon: string;
  items: string[];
}

const CATEGORIES: Category[] = [
  {
    id: "flowers",
    label: "Flowers",
    icon: "🌸",
    items: ["🌸", "🌷", "🌹", "🌻", "🌺", "💐", "🪷", "🌼", "💮", "🏵️"],
  },
  {
    id: "greenery",
    label: "Greenery",
    icon: "🌿",
    items: ["🌿", "🍃", "🌱", "🍀", "☘️", "🪴", "🌾", "🎋", "🎍", "🪻"],
  },
  {
    id: "wrapper",
    label: "Wrapper",
    icon: "🎀",
    items: ["🎀", "🧻", "📜", "🎁", "🪭", "🏷️"],
  },
];

export default function AssetPicker({ onSelect }: AssetPickerProps) {
  const [activeCategory, setActiveCategory] = useState("flowers");
  const scrollRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  const currentItems =
    CATEGORIES.find((c) => c.id === activeCategory)?.items ?? [];

  // Measure the active tab and position the indicator
  useEffect(() => {
    const tab = tabRefs.current.get(activeCategory);
    if (tab) {
      const parent = tab.parentElement;
      if (parent) {
        const parentRect = parent.getBoundingClientRect();
        const tabRect = tab.getBoundingClientRect();
        setIndicator({
          left: tabRect.left - parentRect.left,
          width: tabRect.width,
        });
      }
    }
  }, [activeCategory]);

  // Reset scroll position when category changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
    }
  }, [activeCategory]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div
        style={{
          margin: "0 8px 10px",
          borderRadius: 20,
          background: "rgba(255, 252, 247, 0.88)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow:
            "0 -1px 24px rgba(180, 140, 100, 0.10), 0 2px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.7)",
          border: "1px solid rgba(220, 200, 170, 0.35)",
          overflow: "hidden",
        }}
      >
        {/* Category tabs */}
        <div
          style={{
            position: "relative",
            display: "flex",
            padding: "10px 6px 0",
            gap: 2,
          }}
        >
          {/* Sliding indicator */}
          <motion.div
            layout
            animate={{ left: indicator.left, width: indicator.width }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
            style={{
              position: "absolute",
              bottom: 0,
              height: "100%",
              borderRadius: 14,
              background: "rgba(168, 130, 90, 0.10)",
              pointerEvents: "none",
            }}
          />

          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                ref={(el) => {
                  if (el) tabRefs.current.set(cat.id, el);
                }}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 5,
                  padding: "8px 0",
                  borderRadius: 14,
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  transition: "opacity 0.15s",
                  opacity: isActive ? 1 : 0.5,
                  position: "relative",
                  zIndex: 1,
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <span style={{ fontSize: 15 }}>{cat.icon}</span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? "#6b4c2a" : "#9c8b7a",
                    letterSpacing: "0.01em",
                    fontFamily:
                      '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
                  }}
                >
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div
          style={{
            height: 1,
            margin: "0 14px",
            background:
              "linear-gradient(90deg, transparent, rgba(180, 150, 110, 0.2), transparent)",
          }}
        />

        {/* Items tray */}
        <div
          ref={scrollRef}
          style={{
            display: "flex",
            gap: 4,
            padding: "10px 10px 12px",
            overflowX: "auto",
            overflowY: "hidden",
            scrollbarWidth: "none",
            WebkitOverflowScrolling: "touch",
            msOverflowStyle: "none",
          }}
        >
          <AnimatePresence mode="popLayout">
            {currentItems.map((item, i) => (
              <motion.button
                key={`${activeCategory}-${item}-${i}`}
                initial={{ opacity: 0, scale: 0.7, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.7, y: 8 }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 28,
                  delay: i * 0.03,
                }}
                onClick={() => onSelect(item)}
                whileTap={{ scale: 0.85 }}
                style={{
                  flexShrink: 0,
                  width: 52,
                  height: 52,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 30,
                  borderRadius: 14,
                  border: "1px solid rgba(200, 180, 150, 0.25)",
                  background: "rgba(255, 255, 255, 0.55)",
                  cursor: "pointer",
                  WebkitTapHighlightColor: "transparent",
                  transition: "background 0.15s, border-color 0.15s",
                }}
                onPointerEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.background = "rgba(255, 255, 255, 0.9)";
                  el.style.borderColor = "rgba(180, 150, 110, 0.4)";
                }}
                onPointerLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.background = "rgba(255, 255, 255, 0.55)";
                  el.style.borderColor = "rgba(200, 180, 150, 0.25)";
                }}
              >
                {item}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
