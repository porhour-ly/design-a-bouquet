"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface NoteCardModalProps {
  open: boolean;
  onAttach: (note: string) => void;
}

const MAX_CHARS = 150;
const WARN_THRESHOLD = 130;

const DEFAULT_MESSAGES = [
  "Thinking of you",
  "With love",
  "Just because",
  "You're wonderful",
  "Made with care",
  "For you",
  "XOXO",
  "Sending sunshine",
];

function getRandomDefault() {
  return DEFAULT_MESSAGES[Math.floor(Math.random() * DEFAULT_MESSAGES.length)];
}

export default function NoteCardModal({ open, onAttach }: NoteCardModalProps) {
  const [text, setText] = useState("");

  const charCount = text.length;
  const counterColor =
    charCount >= MAX_CHARS ? "#d32f2f" : charCount >= WARN_THRESHOLD ? "#c57f1b" : "#a89880";

  return (
    <AnimatePresence>
      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000003,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.4)",
          }}
          onClick={() => onAttach(getRandomDefault())}
        >
          <motion.div
            initial={{ y: 80, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.97 }}
            transition={{ type: "spring", damping: 22, stiffness: 260 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#faf5ed",
              borderRadius: 16,
              padding: "28px 24px 20px",
              maxWidth: 320,
              width: "calc(100% - 48px)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            }}
          >
            {/* Decorative flourish divider */}
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

            <p
              style={{
                textAlign: "center",
                fontFamily: "Georgia, serif",
                fontSize: 16,
                color: "#5a4a3a",
                margin: "0 0 16px",
              }}
            >
              Add a note to your bouquet?
            </p>

            <textarea
              value={text}
              onChange={(e) => {
                if (e.target.value.length <= MAX_CHARS) {
                  setText(e.target.value);
                }
              }}
              placeholder="Write a short note..."
              rows={3}
              style={{
                width: "100%",
                boxSizing: "border-box",
                resize: "none",
                border: "none",
                outline: "none",
                background: "transparent",
                fontFamily: "Georgia, serif",
                fontSize: 16,
                lineHeight: 1.5,
                color: "#5a4a3a",
                padding: "8px 4px",
                borderBottom: "1px solid #ddd2c4",
              }}
            />

            <div
              style={{
                textAlign: "right",
                fontSize: 12,
                color: counterColor,
                marginTop: 4,
                marginBottom: 16,
                transition: "color 0.2s",
              }}
            >
              {charCount}/{MAX_CHARS}
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                onClick={() => onAttach(getRandomDefault())}
                style={{
                  padding: "10px 22px",
                  borderRadius: 20,
                  border: "1px solid #d4c4b0",
                  background: "transparent",
                  color: "#6b5c4c",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Use default
              </button>
              <button
                onClick={() => onAttach(text.trim())}
                disabled={text.trim().length === 0}
                style={{
                  padding: "10px 22px",
                  borderRadius: 20,
                  border: "none",
                  background: text.trim().length === 0 ? "#c4b8a8" : "#8B6F4E",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: text.trim().length === 0 ? "default" : "pointer",
                  opacity: text.trim().length === 0 ? 0.7 : 1,
                  transition: "background 0.2s, opacity 0.2s",
                }}
              >
                Attach note
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
