"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { WRAPPER_REGISTRY, SvgWrapper } from "@/components/wrappers";
import type { WrapperType } from "@/components/wrappers/types";
import { computeWrapperPosition, getViewportZone } from "@/components/bouquetConstraints";
import { denormalizeFlowers } from "@/lib/bouquetData";
import type { NormalizedFlower, Flower } from "@/lib/bouquetData";

export default function SharedBouquetPage() {
  const { id } = useParams<{ id: string }>();
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [wrapperType, setWrapperType] = useState<WrapperType>("paper-wrap");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        const wt = data.wrapper_type as WrapperType;
        setWrapperType(wt);

        const { zone } = WRAPPER_REGISTRY[wt];
        const wrapperPos = computeWrapperPosition(
          window.innerWidth,
          window.innerHeight,
          zone.width,
          zone.height,
        );
        const compositionZoneVP = getViewportZone(zone.compositionZone, wrapperPos);
        const loaded = denormalizeFlowers(data.flowers as NormalizedFlower[], compositionZoneVP);
        setFlowers(loaded);
      } catch {
        if (!cancelled) setError("Bouquet not found");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id]);

  // Recompute flower positions on resize
  useEffect(() => {
    if (flowers.length === 0) return;

    const handleResize = () => {
      // Re-fetch to recompute positions for new viewport
      fetch(`/api/bouquets/${id}`)
        .then((res) => res.json())
        .then((data) => {
          const wt = data.wrapper_type as WrapperType;
          const { zone } = WRAPPER_REGISTRY[wt];
          const wrapperPos = computeWrapperPosition(
            window.innerWidth,
            window.innerHeight,
            zone.width,
            zone.height,
          );
          const compositionZoneVP = getViewportZone(zone.compositionZone, wrapperPos);
          setFlowers(denormalizeFlowers(data.flowers as NormalizedFlower[], compositionZoneVP));
        })
        .catch(() => {});
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [id, flowers.length]);

  if (loading) {
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

  const { zone, assets } = WRAPPER_REGISTRY[wrapperType];
  const wrapperPos = computeWrapperPosition(
    typeof window !== "undefined" ? window.innerWidth : 0,
    typeof window !== "undefined" ? window.innerHeight : 0,
    zone.width,
    zone.height,
  );

  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden" }}>
      {/* Wrapper back layer */}
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

      {/* Static flowers */}
      {flowers.map((flower) => (
        <div
          key={flower.id}
          style={{
            position: "absolute",
            left: flower.x,
            top: flower.y,
            transform: `translate(-50%, -50%) scale(${flower.scale}) rotate(${flower.rotation}deg)`,
            fontSize: 48,
            zIndex: flower.zIndex,
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          {flower.type}
        </div>
      ))}

      {/* Wrapper front layer */}
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

      {/* Make your own button */}
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
