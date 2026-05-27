"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { WRAPPER_REGISTRY, SvgWrapper } from "@/components/wrappers";
import type { WrapperType } from "@/components/wrappers/types";
import type { NormalizedFlower } from "@/lib/bouquetData";

export default function SharedBouquetPage() {
  const { id } = useParams<{ id: string }>();
  const [normalizedFlowers, setNormalizedFlowers] = useState<NormalizedFlower[]>([]);
  const [wrapperType, setWrapperType] = useState<WrapperType>("pink");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vpSize, setVpSize] = useState<{ w: number; h: number } | null>(null);

  // Shared view reserves: no top bar, ~70px for "Make your own" button at bottom
  const RESERVE_TOP = 16;
  const RESERVE_BOTTOM = 70;

  // Track viewport size for computing fitScale
  useEffect(() => {
    setVpSize({ w: window.innerWidth, h: window.innerHeight });
    const onResize = () => setVpSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/bouquets/${id}`);
        if (!res.ok) {
          throw new Error("Bouquet not found");
        }
        const data = await res.json();

        if (cancelled) return;

        setWrapperType(data.wrapper_type as WrapperType);
        setNormalizedFlowers(data.flowers as NormalizedFlower[]);
      } catch {
        if (!cancelled) setError("Bouquet not found");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id]);

  if (loading || !vpSize) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          color: "#8B6F4E",
          fontSize: 18,
        }}
      >
        Loading bouquet...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          gap: 16,
        }}
      >
        <div style={{ fontSize: 48 }}>:(</div>
        <div style={{ fontSize: 18, color: "#6b5c4c" }}>{error}</div>
        <a
          href="/"
          style={{
            marginTop: 8,
            padding: "10px 24px",
            borderRadius: 20,
            background: "#8B6F4E",
            color: "#fff",
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Make your own bouquet
        </a>
      </div>
    );
  }

  // --- Compute native-coordinate layout ---
  const entry = WRAPPER_REGISTRY[wrapperType];
  const nat = entry.native!;

  const nativeW = nat.width;
  const nativeBackH = nat.backHeight;
  const nativeFrontH = nat.frontHeight;

  // All current wrappers are aligned (front & back start at y=0)
  const nativeTotalH = Math.max(nativeBackH, nativeFrontH);

  // Composition zone at native scale
  const nativeCompH = Math.round(nativeBackH * nat.compositionHeightRatio);

  // Flower image height at native scale
  const FLOWER_HEIGHT_RATIO = 250 / 384;
  const flowerImageHeight = Math.round(nativeW * FLOWER_HEIGHT_RATIO);

  // --- Scale the whole container to fit the viewport ---
  const availW = vpSize.w;
  const availH = vpSize.h - RESERVE_TOP - RESERVE_BOTTOM;
  const fitScale = Math.min(availW / nativeW, availH / nativeTotalH);

  // Centering offsets
  const scaledW = nativeW * fitScale;
  const scaledH = nativeTotalH * fitScale;
  const offsetX = (vpSize.w - scaledW) / 2;
  const offsetY = RESERVE_TOP + (availH - scaledH) / 2;

  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden" }}>
      {/* Scaled bouquet container — everything inside uses native coordinates */}
      <div
        style={{
          position: "absolute",
          left: offsetX,
          top: offsetY,
          width: nativeW,
          height: nativeTotalH,
          transform: `scale(${fitScale})`,
          transformOrigin: "top left",
        }}
      >
        {/* Wrapper back layer */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            zIndex: 0,
          }}
        >
          <SvgWrapper src={nat.backSrc} width={nativeW} height={nativeBackH} />
        </div>

        {/* Flowers at native coordinates */}
        {normalizedFlowers.map((nf, i) => (
          <div
            key={`flower-${i}`}
            style={{
              position: "absolute",
              left: nf.nx * nativeW,
              top: nf.ny * nativeCompH,
              transform: `translate(-50%, -50%) scale(${nf.scale}) rotate(${nf.rotation}deg)`,
              fontSize: 48,
              zIndex: nf.zIndex,
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            {nf.type.startsWith("/") ? (
              <img
                src={nf.type}
                alt=""
                draggable={false}
                style={{ height: flowerImageHeight, width: "auto" }}
              />
            ) : (
              nf.type
            )}
          </div>
        ))}

        {/* Wrapper front layer */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            zIndex: 999999,
            pointerEvents: "none",
          }}
        >
          <SvgWrapper src={nat.frontSrc} width={nativeW} height={nativeFrontH} />
        </div>
      </div>

      {/* Make your own button — outside the scaled container */}
      <a
        href="/"
        style={{
          position: "fixed",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1000000,
          padding: "12px 28px",
          borderRadius: 24,
          background: "#8B6F4E",
          color: "#fff",
          textDecoration: "none",
          fontSize: 15,
          fontWeight: 600,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}
      >
        Make your own bouquet
      </a>
    </div>
  );
}
