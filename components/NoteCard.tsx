"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";

interface NoteCardProps {
  note: string;
  type: string;
  style: React.CSSProperties;
  flowerImageHeight: number;
}

export default function NoteCard({ note, type, style, flowerImageHeight }: NoteCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasBeenTapped, setHasBeenTapped] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && !hasBeenTapped) {
      setHasBeenTapped(true);
    }
  }, [isOpen, hasBeenTapped]);

  const cardHeight = flowerImageHeight * 0.6;

  return (
    <>
      <style>{`
        @keyframes noteGlow {
          0%, 100% { box-shadow: 0 2px 8px rgba(0,0,0,0.12), 0 0 12px rgba(196,168,130,0.3); }
          50% { box-shadow: 0 2px 8px rgba(0,0,0,0.12), 0 0 20px rgba(196,168,130,0.6); }
        }
        @keyframes envelopeWiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-3deg); }
          50% { transform: rotate(3deg); }
          75% { transform: rotate(-2deg); }
        }
      `}</style>

      {/* Closed state: card image at its saved position */}
      <div
        onClick={() => setIsOpen(true)}
        style={{
          ...style,
          cursor: "pointer",
          pointerEvents: "auto",
        }}
      >
        <div style={{ position: "relative", display: "inline-block" }}>
          <img
            src={type}
            alt="Note card"
            draggable={false}
            style={{
              height: cardHeight,
              width: "auto",
              display: "block",
              animation: hasBeenTapped ? "none" : "noteGlow 2s ease-in-out infinite, envelopeWiggle 1.2s ease-in-out 1s both",
              borderRadius: 6,
            }}
          />
        </div>
      </div>

      {/* Portal: expanded card centered on bouquet */}
      {mounted && isOpen && createPortal(
        <>
          {/* Full-screen flex container for centering */}
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1000004,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
          {/* Expanded card */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 22, stiffness: 260 }}
            onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
            style={{
              width: "min(260px, calc(100vw - 64px))",
              background: "#faf5ed",
              borderRadius: 14,
              padding: "24px 22px",
              boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
              cursor: "pointer",
              textAlign: "center",
            }}
          >
            {/* Top flourish */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginBottom: 20,
              }}
            >
              <div style={{ width: 40, height: 1, background: "#c4a882" }} />
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#c4a882",
                }}
              />
              <div style={{ width: 40, height: 1, background: "#c4a882" }} />
            </div>

            {/* Note text */}
            <p
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "clamp(16px, 4vw, 22px)",
                lineHeight: 1.5,
                color: "#5a4a3a",
                margin: 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {note}
            </p>

            {/* Bottom flourish */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginTop: 20,
              }}
            >
              <div style={{ width: 40, height: 1, background: "#c4a882" }} />
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#c4a882",
                }}
              />
              <div style={{ width: 40, height: 1, background: "#c4a882" }} />
            </div>
          </motion.div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
