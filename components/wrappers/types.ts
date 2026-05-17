export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface BouquetZoneConfig {
  width: number;
  height: number;
  /** Where flowers can live (relative to wrapper top-left) */
  compositionZone: Rect;
  /** Stem/wrap area, no flowers (relative to wrapper top-left) */
  handleZone: Rect;
  /** Clustering center for flower spawning (relative to wrapper top-left) */
  anchorPoint: Point;
}

export interface WrapperAssets {
  backSvg: string;
  frontSvg: string;
}

export type WrapperType = "paper-wrap" | "floral-frame" | "fabric-ribbon";
