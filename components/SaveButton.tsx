"use client";

import { useState, useCallback } from "react";
import type { Rect } from "./wrappers/types";
import type { WrapperType } from "./wrappers/types";
import type { Flower } from "@/lib/bouquetData";
import { normalizeFlowers } from "@/lib/bouquetData";
import NoteCardModal from "./NoteCardModal";

interface SaveButtonProps {
  flowers: Flower[];
  activeWrapper: WrapperType;
  compositionZoneVP: Rect;
  hasNoteCard: boolean;
}

export default function SaveButton({
  flowers,
  activeWrapper,
  compositionZoneVP,
  hasNoteCard,
}: SaveButtonProps) {
  const [saving, setSaving] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);

  const performSave = useCallback(async (note: string | null) => {
    if (saving || flowers.length === 0) return;

    setSaving(true);
    setError(null);

    try {
      const normalized = normalizeFlowers(flowers, compositionZoneVP);

      const res = await fetch("/api/bouquets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wrapper_type: activeWrapper,
          flowers: normalized,
          ...(note ? { note } : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      const { id } = await res.json();
      const url = `${window.location.origin}/b/${id}`;
      setShareUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save bouquet");
    } finally {
      setSaving(false);
    }
  }, [saving, flowers, compositionZoneVP, activeWrapper]);

  const handleSave = useCallback(() => {
    if (saving || flowers.length === 0) return;
    if (hasNoteCard) {
      setShowNoteModal(true);
    } else {
      performSave(null);
    }
  }, [saving, flowers, hasNoteCard, performSave]);

  const handleCopy = useCallback(async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement("input");
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareUrl]);

  const handleClose = useCallback(() => {
    setShareUrl(null);
    setCopied(false);
    setError(null);
  }, []);

  const isEmpty = flowers.length === 0;

  return (
    <>
      {/* Note-writing modal */}
      <NoteCardModal
        open={showNoteModal}
        onAttach={(note) => {
          setShowNoteModal(false);
          performSave(note);
        }}
      />

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving || isEmpty}
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          zIndex: 1000001,
          touchAction: "manipulation",
          padding: "10px 20px",
          borderRadius: 24,
          border: "none",
          background: isEmpty ? "#ccc" : saving ? "#b8a690" : "#8B6F4E",
          color: "#fff",
          fontSize: 15,
          fontWeight: 600,
          cursor: isEmpty || saving ? "default" : "pointer",
          opacity: isEmpty ? 0.6 : 1,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          transition: "background 0.2s, opacity 0.2s",
        }}
      >
        {saving ? "Saving..." : isEmpty ? "Add flowers first" : "Save & Share"}
      </button>

      {/* Error toast */}
      {error && (
        <div
          style={{
            position: "fixed",
            top: 70,
            right: 16,
            zIndex: 1000002,
            padding: "10px 16px",
            borderRadius: 12,
            background: "#f44336",
            color: "#fff",
            fontSize: 14,
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          }}
        >
          {error}
          <button
            onClick={() => setError(null)}
            style={{
              marginLeft: 8,
              background: "none",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            x
          </button>
        </div>
      )}

      {/* Share modal */}
      {shareUrl && (
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
          onClick={handleClose}
        >
          <div
            style={{
              background: "#fdf6ee",
              borderRadius: 20,
              padding: "28px 24px",
              maxWidth: 360,
              width: "calc(100% - 48px)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>
              Bouquet saved!
            </div>
            <p style={{ fontSize: 14, color: "#6b5c4c", marginBottom: 16 }}>
              Share this link with anyone:
            </p>
            <div
              style={{
                background: "#fff",
                border: "1px solid #d4c4b0",
                borderRadius: 12,
                padding: "10px 12px",
                fontSize: 13,
                wordBreak: "break-all",
                color: "#5a4a3a",
                marginBottom: 16,
              }}
            >
              {shareUrl}
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                onClick={handleCopy}
                style={{
                  padding: "10px 24px",
                  borderRadius: 20,
                  border: "none",
                  background: copied ? "#6b9e6b" : "#8B6F4E",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
              >
                {copied ? "Copied!" : "Copy Link"}
              </button>
              <button
                onClick={handleClose}
                style={{
                  padding: "10px 24px",
                  borderRadius: 20,
                  border: "1px solid #d4c4b0",
                  background: "transparent",
                  color: "#6b5c4c",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
