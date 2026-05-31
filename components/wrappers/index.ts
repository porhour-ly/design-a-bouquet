import type { BouquetZoneConfig, WrapperAssets, WrapperType } from "./types";

export interface WrapperNative {
  width: number;
  backHeight: number;
  frontHeight: number;
  compositionHeightRatio: number;
  anchorYRatio: number;
  /** true when back & front layers both start at y=0 (no overlap offset) */
  aligned?: boolean;
  backSrc: string;
  frontSrc: string;
  maskSrc?: string;
}

export interface WrapperEntry {
  assets: WrapperAssets;
  zone: BouquetZoneConfig;
  label: string;
  icon: string;
  native?: WrapperNative;
}

// ---------------------------------------------------------------------------
// Helper for aligned wrappers (back and front both start at y=0).
// Computes static fallback assets/zone at a fixed scale of 0.2.
// ---------------------------------------------------------------------------

function createAlignedWrapper(
  backSrc: string,
  frontSrc: string,
  nativeWidth: number,
  nativeBackHeight: number,
  nativeFrontHeight: number,
): { assets: WrapperAssets; zone: BouquetZoneConfig } {
  const scale = 0.2;
  const w = Math.round(nativeWidth * scale);
  const backH = Math.round(nativeBackHeight * scale);
  const frontH = Math.round(nativeFrontHeight * scale);
  const totalH = Math.max(backH, frontH);
  const compH = Math.round(backH * 0.6);

  return {
    assets: {
      back: { src: backSrc, x: 0, y: 0, width: w, height: backH },
      front: { src: frontSrc, x: 0, y: 0, width: w, height: frontH },
    },
    zone: {
      width: w,
      height: totalH,
      compositionZone: { x: 0, y: 0, width: w, height: compH },
      handleZone: { x: 0, y: compH, width: w, height: totalH - compH },
      anchorPoint: { x: w / 2, y: Math.round(compH * 0.45) },
    },
  };
}

// --- Registry ---

export const WRAPPER_REGISTRY: Record<WrapperType, WrapperEntry> = {
  "pink": {
    ...createAlignedWrapper("/wrappers/pink/back.png", "/wrappers/pink/front.png", 1920, 1639, 2762),
    label: "Pink",
    icon: "/wrappers/pink/icon.png",
    native: {
      width: 1920,
      backHeight: 1639,
      frontHeight: 2762,
      compositionHeightRatio: 0.6,
      anchorYRatio: 0.45,
      aligned: true,
      backSrc: "/wrappers/pink/back.png",
      frontSrc: "/wrappers/pink/front.png",
      maskSrc: "/wrappers/pink/mask.png",
    },
  },
  "blue": {
    ...createAlignedWrapper("/wrappers/blue/back.png", "/wrappers/blue/front.png", 1920, 1700, 2762),
    label: "Blue",
    icon: "/wrappers/blue/icon.png",
    native: {
      width: 1920,
      backHeight: 1700,
      frontHeight: 2762,
      compositionHeightRatio: 0.6,
      anchorYRatio: 0.45,
      aligned: true,
      backSrc: "/wrappers/blue/back.png",
      frontSrc: "/wrappers/blue/front.png",
      maskSrc: "/wrappers/blue/mask.png",
    },
  },
  "red": {
    ...createAlignedWrapper("/wrappers/red/back.png", "/wrappers/red/front.png", 1920, 1756, 2560),
    label: "Red",
    icon: "/wrappers/red/icon.png",
    native: {
      width: 1920,
      backHeight: 1756,
      frontHeight: 2560,
      compositionHeightRatio: 0.6,
      anchorYRatio: 0.45,
      aligned: true,
      backSrc: "/wrappers/red/back.png",
      frontSrc: "/wrappers/red/front.png",
      maskSrc: "/wrappers/red/mask.png",
    },
  },
  "purple": {
    ...createAlignedWrapper("/wrappers/purple/back.png", "/wrappers/purple/front.png", 1182, 1412, 2560),
    label: "Purple",
    icon: "/wrappers/purple/icon.png",
    native: {
      width: 1182,
      backHeight: 1412,
      frontHeight: 2560,
      compositionHeightRatio: 0.6,
      anchorYRatio: 0.45,
      aligned: true,
      backSrc: "/wrappers/purple/back.png",
      frontSrc: "/wrappers/purple/front.png",
      maskSrc: "/wrappers/purple/mask.png",
    },
  },
  "foral": {
    ...createAlignedWrapper("/wrappers/foral/back.png", "/wrappers/foral/front.png", 1182, 1460, 2288),
    label: "Floral",
    icon: "/wrappers/foral/icon.png",
    native: {
      width: 1182,
      backHeight: 1460,
      frontHeight: 2288,
      compositionHeightRatio: 0.6,
      anchorYRatio: 0.45,
      aligned: true,
      backSrc: "/wrappers/foral/back.png",
      frontSrc: "/wrappers/foral/front.png",
      maskSrc: "/wrappers/foral/mask.png",
    },
  },
};

export { default as SvgWrapper } from "./SvgWrapper";
export type { WrapperType, BouquetZoneConfig, WrapperAssets, WrapperLayer, Rect, Point } from "./types";
