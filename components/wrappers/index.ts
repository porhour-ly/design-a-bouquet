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
}

export interface WrapperEntry {
  assets: WrapperAssets;
  zone: BouquetZoneConfig;
  label: string;
  icon: string;
  native?: WrapperNative;
}

// ---------------------------------------------------------------------------
// Template convention (see public/wrappers/template-above.svg & template-below.svg)
//
// Both SVGs share the same native width. They compose as follows:
//
//   ┌─────────────────┐  ← back (below) at y=0
//   │                 │
//   │     below       │
//   │        ┌────────┤──┐  ← front (above) at y = backH × 0.5
//   │        │overlap │  │
//   └────────┤────────┘  │
//            │  above    │
//            └───────────┘
//
// - back sits at y=0
// - front is offset down by 50% of the back's rendered height
// - total height = max(backH, frontY + frontH)
// - composition zone: upper 50% of total (where flowers live)
// - handle zone: lower 50% of total (no flowers)
//
// To add a new wrapper: provide two SVGs following this layout, then call
// createWrapper() with the SVG paths, native dimensions, and scale.
// ---------------------------------------------------------------------------

function createWrapper(
  backSvg: string,
  frontSvg: string,
  nativeWidth: number,
  nativeBackHeight: number,
  nativeFrontHeight: number,
  scale: number,
): { assets: WrapperAssets; zone: BouquetZoneConfig } {
  const w = Math.round(nativeWidth * scale);
  const backH = Math.round(nativeBackHeight * scale);
  const frontH = Math.round(nativeFrontHeight * scale);
  const frontY = Math.round(backH * 0.5);
  const totalH = Math.max(backH, frontY + frontH);
  const compH = Math.round(totalH * 0.5);

  return {
    assets: {
      back: { src: backSvg, x: 0, y: 0, width: w, height: backH },
      front: { src: frontSvg, x: 0, y: frontY, width: w, height: frontH },
    },
    zone: {
      width: w,
      height: totalH,
      compositionZone: { x: 0, y: 0, width: w, height: compH },
      handleZone: { x: 0, y: compH, width: w, height: totalH - compH },
      anchorPoint: { x: w / 2, y: Math.round(compH * 0.5) },
    },
  };
}

// --- Wrapper definitions ---

const paperWrap = createWrapper(
  "/wrappers/paper-wrap-back.svg",
  "/wrappers/paper-wrap-front.svg",
  181, 149, 162, 2.5,
);

const floralFrame = createWrapper(
  "/wrappers/floral-frame-back.svg",
  "/wrappers/floral-frame-front.svg",
  320, 520, 520, 1,
);

const fabricRibbon = createWrapper(
  "/wrappers/fabric-ribbon-back.svg",
  "/wrappers/fabric-ribbon-front.svg",
  340, 560, 560, 1,
);

const template = createWrapper(
  "/wrappers/template-below.svg",
  "/wrappers/template-above.svg",
  160, 100, 100, 3,
);

// --- Aligned-layer wrappers (back and front both at y=0) ---

const pinkBouquet: { assets: WrapperAssets; zone: BouquetZoneConfig } = (() => {
  const scale = 0.2;
  const w = Math.round(1920 * scale);
  const backH = Math.round(1639 * scale);
  const frontH = Math.round(2762 * scale);
  const totalH = Math.max(backH, frontH);
  const compH = Math.round(backH * 0.6);

  return {
    assets: {
      back: { src: "/wrappers/pink bouquet 1/back.png", x: 0, y: 0, width: w, height: backH },
      front: { src: "/wrappers/pink bouquet 1/front.png", x: 0, y: 0, width: w, height: frontH },
    },
    zone: {
      width: w,
      height: totalH,
      compositionZone: { x: 0, y: 0, width: w, height: compH },
      handleZone: { x: 0, y: compH, width: w, height: totalH - compH },
      anchorPoint: { x: w / 2, y: Math.round(compH * 0.45) },
    },
  };
})();

// --- Registry ---

export const WRAPPER_REGISTRY: Record<WrapperType, WrapperEntry> = {
  "paper-wrap": {
    ...paperWrap,
    label: "Paper",
    icon: "📜",
  },
  "floral-frame": {
    ...floralFrame,
    label: "Frame",
    icon: "🌿",
  },
  "fabric-ribbon": {
    ...fabricRibbon,
    label: "Fabric",
    icon: "🎀",
  },
  "template": {
    ...template,
    label: "Template",
    icon: "📐",
  },
  "pink-bouquet": {
    ...pinkBouquet,
    label: "Pink",
    icon: "🌷",
    native: {
      width: 1920,
      backHeight: 1639,
      frontHeight: 2762,
      compositionHeightRatio: 0.6,
      anchorYRatio: 0.45,
      aligned: true,
      backSrc: "/wrappers/pink bouquet 1/back.png",
      frontSrc: "/wrappers/pink bouquet 1/front.png",
    },
  },
};

export { default as SvgWrapper } from "./SvgWrapper";
export type { WrapperType, BouquetZoneConfig, WrapperAssets, WrapperLayer, Rect, Point } from "./types";
