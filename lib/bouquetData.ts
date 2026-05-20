import type { Rect } from "@/components/wrappers/types";

export interface NormalizedFlower {
  type: string;
  nx: number;
  ny: number;
  scale: number;
  rotation: number;
  zIndex: number;
}

export interface SavedBouquet {
  id: string;
  wrapper_type: string;
  flowers: NormalizedFlower[];
  created_at: string;
}

export interface Flower {
  id: string;
  type: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  zIndex: number;
}

export function normalizeFlowers(
  flowers: Flower[],
  compositionZoneVP: Rect,
): NormalizedFlower[] {
  return flowers.map((f) => ({
    type: f.type,
    nx: (f.x - compositionZoneVP.x) / compositionZoneVP.width,
    ny: (f.y - compositionZoneVP.y) / compositionZoneVP.height,
    scale: f.scale,
    rotation: f.rotation,
    zIndex: f.zIndex,
  }));
}

export function denormalizeFlowers(
  normalized: NormalizedFlower[],
  compositionZoneVP: Rect,
): Flower[] {
  return normalized.map((nf, i) => ({
    id: `loaded-${i}-${Date.now().toString(36)}`,
    type: nf.type,
    x: compositionZoneVP.x + nf.nx * compositionZoneVP.width,
    y: compositionZoneVP.y + nf.ny * compositionZoneVP.height,
    scale: nf.scale,
    rotation: nf.rotation,
    zIndex: nf.zIndex,
  }));
}
