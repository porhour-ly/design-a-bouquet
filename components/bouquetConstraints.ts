import type { Rect, Point, BouquetZoneConfig, WrapperAssets } from "./wrappers/types";
import type { WrapperEntry } from "./wrappers";

/** Convert a wrapper-relative rect to viewport coordinates */
export function getViewportZone(zone: Rect, wrapperPos: Point): Rect {
  return {
    x: zone.x + wrapperPos.x,
    y: zone.y + wrapperPos.y,
    width: zone.width,
    height: zone.height,
  };
}

/** Check if a point is inside a rect */
export function isInsideRect(px: number, py: number, rect: Rect): boolean {
  return (
    px >= rect.x &&
    px <= rect.x + rect.width &&
    py >= rect.y &&
    py <= rect.y + rect.height
  );
}

/** Clamp a point to the nearest position inside a rect */
export function clampToRect(px: number, py: number, rect: Rect): Point {
  return {
    x: Math.max(rect.x, Math.min(px, rect.x + rect.width)),
    y: Math.max(rect.y, Math.min(py, rect.y + rect.height)),
  };
}

/**
 * Apply soft rubber-band resistance when a point is outside the zone.
 * Inside the zone, returns the point unchanged.
 * Outside, the point moves at `factor` rate (0.3 = 30% speed).
 */
export function applySoftBoundary(
  px: number,
  py: number,
  rect: Rect,
  factor = 0.3
): Point {
  let x = px;
  let y = py;

  const left = rect.x;
  const right = rect.x + rect.width;
  const top = rect.y;
  const bottom = rect.y + rect.height;

  if (px < left) {
    x = left + (px - left) * factor;
  } else if (px > right) {
    x = right + (px - right) * factor;
  }

  if (py < top) {
    y = top + (py - top) * factor;
  } else if (py > bottom) {
    y = bottom + (py - bottom) * factor;
  }

  return { x, y };
}

/** Generate a spawn position biased toward the anchor point */
export function getSpawnPosition(
  zoneConfig: BouquetZoneConfig,
  wrapperPos: Point
): Point {
  const zone = getViewportZone(zoneConfig.compositionZone, wrapperPos);
  const anchor = {
    x: zoneConfig.anchorPoint.x + wrapperPos.x,
    y: zoneConfig.anchorPoint.y + wrapperPos.y,
  };

  // Random point within the composition zone
  const randX = zone.x + Math.random() * zone.width;
  const randY = zone.y + Math.random() * zone.height;

  // Average with anchor for clustering bias
  return {
    x: (randX + anchor.x) / 2,
    y: (randY + anchor.y) / 2,
  };
}

/** Center the wrapper on the viewport */
export function computeWrapperPosition(
  vpWidth: number,
  vpHeight: number,
  wrapperW: number,
  wrapperH: number
): Point {
  return {
    x: (vpWidth - wrapperW) / 2,
    y: (vpHeight - wrapperH) / 2,
  };
}

export interface ResponsiveWrapperResult {
  zone: BouquetZoneConfig;
  assets: WrapperAssets;
  wrapperPos: Point;
}

/**
 * Compute wrapper dimensions responsively for entries with `native` data.
 * Falls back to static dimensions + viewport centering for legacy wrappers.
 */
export function computeResponsiveWrapper(
  entry: WrapperEntry,
  vpWidth: number,
  vpHeight: number,
  reserveTop: number,
  reserveBottom: number,
): ResponsiveWrapperResult {
  const nat = entry.native;
  if (!nat) {
    // Legacy wrapper: use pre-computed static dimensions, center in full viewport
    const pos = computeWrapperPosition(vpWidth, vpHeight, entry.zone.width, entry.zone.height);
    return { zone: entry.zone, assets: entry.assets, wrapperPos: pos };
  }

  const availW = vpWidth;
  const availH = vpHeight - reserveTop - reserveBottom;
  // Total native height depends on layout type
  const nativeTotalH = nat.aligned
    ? Math.max(nat.backHeight, nat.frontHeight)
    : (() => {
        const frontY = Math.round(nat.backHeight * 0.5);
        return Math.max(nat.backHeight, frontY + nat.frontHeight);
      })();

  const scale = Math.min(availW / nat.width, availH / nativeTotalH);

  const w = Math.round(nat.width * scale);
  const backH = Math.round(nat.backHeight * scale);
  const frontH = Math.round(nat.frontHeight * scale);

  let frontY: number;
  let totalH: number;
  if (nat.aligned) {
    frontY = 0;
    totalH = Math.max(backH, frontH);
  } else {
    frontY = Math.round(backH * 0.5);
    totalH = Math.max(backH, frontY + frontH);
  }

  const compH = Math.round(backH * nat.compositionHeightRatio);

  const zone: BouquetZoneConfig = {
    width: w,
    height: totalH,
    compositionZone: { x: 0, y: 0, width: w, height: compH },
    handleZone: { x: 0, y: compH, width: w, height: totalH - compH },
    anchorPoint: { x: w / 2, y: Math.round(compH * nat.anchorYRatio) },
  };

  const assets: WrapperAssets = {
    back: { src: nat.backSrc, x: 0, y: 0, width: w, height: backH },
    front: { src: nat.frontSrc, x: 0, y: frontY, width: w, height: frontH },
  };

  // Center in available space (between reserveTop and vpHeight - reserveBottom)
  const wrapperPos: Point = {
    x: (vpWidth - w) / 2,
    y: reserveTop + (availH - totalH) / 2,
  };

  return { zone, assets, wrapperPos };
}
