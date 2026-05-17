import type { Rect, Point, BouquetZoneConfig } from "./wrappers/types";

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
