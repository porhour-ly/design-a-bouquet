import { useEffect, useRef, useState, useCallback } from "react";
import { MaskBoundary } from "./maskBoundary";
import type { WrapperNative } from "./wrappers";
import type { Rect, Point } from "./wrappers/types";
import {
  applySoftBoundary as rectSoftBoundary,
  clampToRect,
  isInsideRect,
  getSpawnPosition as rectGetSpawnPosition,
} from "./bouquetConstraints";
import type { BouquetZoneConfig } from "./wrappers/types";

export interface MaskBoundaryHandle {
  /** Check if a point (with optional half-extents) is inside the mask */
  isInside: (vpX: number, vpY: number, vpInsetX?: number, vpInsetY?: number) => boolean;
  /** Clamp a point (with optional half-extents) to the nearest valid position */
  clamp: (vpX: number, vpY: number, vpInsetX?: number, vpInsetY?: number) => Point;
  /** Apply soft rubber-band resistance (with optional half-extents) */
  applySoftBoundary: (vpX: number, vpY: number, vpInsetX?: number, vpInsetY?: number) => Point;
  getSpawnPosition: (zone: BouquetZoneConfig, wrapperPos: Point) => Point;
  isReady: boolean;
}

/**
 * Manages MaskBoundary lifecycle and converts between viewport and native coords.
 * Falls back to rect-based boundary functions when mask is unavailable.
 */
export function useMaskBoundary(
  native: WrapperNative | undefined,
  compositionZoneVP: Rect,
  wrapperPos: Point,
  scale: number,
): MaskBoundaryHandle {
  const maskRef = useRef<MaskBoundary | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Store latest values in refs for stable callbacks
  const compositionZoneRef = useRef(compositionZoneVP);
  compositionZoneRef.current = compositionZoneVP;
  const wrapperPosRef = useRef(wrapperPos);
  wrapperPosRef.current = wrapperPos;
  const scaleRef = useRef(scale);
  scaleRef.current = scale;
  const nativeRef = useRef(native);
  nativeRef.current = native;

  useEffect(() => {
    // Dispose previous mask
    if (maskRef.current) {
      maskRef.current.dispose();
      maskRef.current = null;
      setIsReady(false);
    }

    if (!native?.maskSrc) return;

    // Compute native anchor from ratios
    const nativeCompH = native.backHeight * native.compositionHeightRatio;
    const nativeAnchor = {
      x: native.width / 2,
      y: nativeCompH * native.anchorYRatio,
    };

    const mask = new MaskBoundary(
      native.maskSrc,
      native.width,
      native.backHeight,
      nativeAnchor,
    );
    maskRef.current = mask;

    // Poll for ready state (image load is async)
    const interval = setInterval(() => {
      if (mask.ready) {
        setIsReady(true);
        clearInterval(interval);
      }
    }, 50);

    return () => {
      clearInterval(interval);
      mask.dispose();
      if (maskRef.current === mask) {
        maskRef.current = null;
        setIsReady(false);
      }
    };
  }, [native?.maskSrc, native?.width, native?.backHeight, native?.compositionHeightRatio, native?.anchorYRatio]);

  const vpToNative = useCallback((vpX: number, vpY: number) => {
    const wp = wrapperPosRef.current;
    const s = scaleRef.current;
    return {
      nx: (vpX - wp.x) / s,
      ny: (vpY - wp.y) / s,
    };
  }, []);

  const nativeToVp = useCallback((nx: number, ny: number) => {
    const wp = wrapperPosRef.current;
    const s = scaleRef.current;
    return {
      x: nx * s + wp.x,
      y: ny * s + wp.y,
    };
  }, []);

  const toNativeInsets = useCallback((vpInsetX = 0, vpInsetY = 0) => {
    const s = scaleRef.current;
    return { nInsetX: vpInsetX / s, nInsetY: vpInsetY / s };
  }, []);

  const isInsideMask = useCallback((vpX: number, vpY: number, vpInsetX = 0, vpInsetY = 0): boolean => {
    const mask = maskRef.current;
    if (!mask?.ready) return isInsideRect(vpX, vpY, compositionZoneRef.current);
    const { nx, ny } = vpToNative(vpX, vpY);
    const { nInsetX, nInsetY } = toNativeInsets(vpInsetX, vpInsetY);
    return mask.isInside(nx, ny, nInsetX, nInsetY);
  }, [vpToNative, toNativeInsets]);

  const clampMask = useCallback((vpX: number, vpY: number, vpInsetX = 0, vpInsetY = 0): Point => {
    const mask = maskRef.current;
    if (!mask?.ready) return clampToRect(vpX, vpY, compositionZoneRef.current);
    const { nx, ny } = vpToNative(vpX, vpY);
    const { nInsetX, nInsetY } = toNativeInsets(vpInsetX, vpInsetY);
    const clamped = mask.clamp(nx, ny, nInsetX, nInsetY);
    return nativeToVp(clamped.x, clamped.y);
  }, [vpToNative, nativeToVp, toNativeInsets]);

  const applySoftBoundaryMask = useCallback((vpX: number, vpY: number, vpInsetX = 0, vpInsetY = 0): Point => {
    const mask = maskRef.current;
    if (!mask?.ready) return rectSoftBoundary(vpX, vpY, compositionZoneRef.current);
    const { nx, ny } = vpToNative(vpX, vpY);
    const { nInsetX, nInsetY } = toNativeInsets(vpInsetX, vpInsetY);
    const result = mask.applySoftBoundary(nx, ny, 0.3, nInsetX, nInsetY);
    return nativeToVp(result.x, result.y);
  }, [vpToNative, nativeToVp, toNativeInsets]);

  const getSpawnPositionMask = useCallback((zone: BouquetZoneConfig, wp: Point): Point => {
    const mask = maskRef.current;
    if (!mask?.ready) return rectGetSpawnPosition(zone, wp);
    // Composition zone in native coords
    const nat = nativeRef.current;
    if (!nat) return rectGetSpawnPosition(zone, wp);
    const nativeCompH = nat.backHeight * nat.compositionHeightRatio;
    const nativeRect = { x: 0, y: 0, width: nat.width, height: nativeCompH };
    const nativeSpawn = mask.getSpawnPosition(nativeRect);
    const s = scaleRef.current;
    return {
      x: nativeSpawn.x * s + wp.x,
      y: nativeSpawn.y * s + wp.y,
    };
  }, []);

  return {
    isInside: isInsideMask,
    clamp: clampMask,
    applySoftBoundary: applySoftBoundaryMask,
    getSpawnPosition: getSpawnPositionMask,
    isReady,
  };
}
