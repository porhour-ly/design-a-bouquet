import type { BouquetZoneConfig, WrapperAssets, WrapperType } from "./types";

export interface WrapperEntry {
  assets: WrapperAssets;
  zone: BouquetZoneConfig;
  label: string;
  icon: string;
}

// --- Zone configs (preserved from the old components) ---

const PAPER_WRAP_W = 340;
const PAPER_WRAP_H = 560;
const PAPER_WRAP_HANDLE_H = Math.round(PAPER_WRAP_H * 0.22);
const PAPER_WRAP_COMP_H = PAPER_WRAP_H - PAPER_WRAP_HANDLE_H;

const PAPER_WRAP_ZONE: BouquetZoneConfig = {
  width: PAPER_WRAP_W,
  height: PAPER_WRAP_H,
  compositionZone: { x: 0, y: 0, width: PAPER_WRAP_W, height: PAPER_WRAP_COMP_H },
  handleZone: { x: 0, y: PAPER_WRAP_COMP_H, width: PAPER_WRAP_W, height: PAPER_WRAP_HANDLE_H },
  anchorPoint: { x: PAPER_WRAP_W / 2, y: PAPER_WRAP_COMP_H * 0.45 },
};

const FLORAL_FRAME_W = 320;
const FLORAL_FRAME_H = 520;
const FLORAL_FRAME_BORDER = 24;

const FLORAL_FRAME_ZONE: BouquetZoneConfig = {
  width: FLORAL_FRAME_W,
  height: FLORAL_FRAME_H,
  compositionZone: {
    x: FLORAL_FRAME_BORDER,
    y: FLORAL_FRAME_BORDER,
    width: FLORAL_FRAME_W - FLORAL_FRAME_BORDER * 2,
    height: FLORAL_FRAME_H - FLORAL_FRAME_BORDER * 2,
  },
  handleZone: { x: 0, y: 0, width: 0, height: 0 },
  anchorPoint: { x: FLORAL_FRAME_W / 2, y: FLORAL_FRAME_H / 2 },
};

const FABRIC_RIBBON_W = 340;
const FABRIC_RIBBON_H = 560;
const FABRIC_RIBBON_Y = Math.round(FABRIC_RIBBON_H * 0.75);
const FABRIC_RIBBON_COMP_H = FABRIC_RIBBON_Y;
const FABRIC_RIBBON_HANDLE_H = FABRIC_RIBBON_H - FABRIC_RIBBON_Y;

const FABRIC_RIBBON_ZONE: BouquetZoneConfig = {
  width: FABRIC_RIBBON_W,
  height: FABRIC_RIBBON_H,
  compositionZone: { x: 0, y: 0, width: FABRIC_RIBBON_W, height: FABRIC_RIBBON_COMP_H },
  handleZone: { x: 0, y: FABRIC_RIBBON_Y, width: FABRIC_RIBBON_W, height: FABRIC_RIBBON_HANDLE_H },
  anchorPoint: { x: FABRIC_RIBBON_W / 2, y: FABRIC_RIBBON_COMP_H * 0.45 },
};

// --- Registry ---

export const WRAPPER_REGISTRY: Record<WrapperType, WrapperEntry> = {
  "paper-wrap": {
    assets: {
      backSvg: "/wrappers/paper-wrap-back.svg",
      frontSvg: "/wrappers/paper-wrap-front.svg",
    },
    zone: PAPER_WRAP_ZONE,
    label: "Paper",
    icon: "📜",
  },
  "floral-frame": {
    assets: {
      backSvg: "/wrappers/floral-frame-back.svg",
      frontSvg: "/wrappers/floral-frame-front.svg",
    },
    zone: FLORAL_FRAME_ZONE,
    label: "Frame",
    icon: "🌿",
  },
  "fabric-ribbon": {
    assets: {
      backSvg: "/wrappers/fabric-ribbon-back.svg",
      frontSvg: "/wrappers/fabric-ribbon-front.svg",
    },
    zone: FABRIC_RIBBON_ZONE,
    label: "Fabric",
    icon: "🎀",
  },
};

export { default as SvgWrapper } from "./SvgWrapper";
export type { WrapperType, BouquetZoneConfig, WrapperAssets, Rect, Point } from "./types";
