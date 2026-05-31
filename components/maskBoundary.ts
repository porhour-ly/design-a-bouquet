export interface MaskAnchor {
  x: number;
  y: number;
}

/**
 * Loads a mask PNG and provides pixel-accurate boundary checking.
 * Opaque pixels (alpha > 128) are "inside", transparent pixels are "outside".
 */
export class MaskBoundary {
  private imageData: ImageData | null = null;
  private _ready = false;
  readonly nativeWidth: number;
  readonly nativeHeight: number;
  readonly anchor: MaskAnchor;

  constructor(
    maskSrc: string,
    nativeWidth: number,
    nativeHeight: number,
    anchor: MaskAnchor,
  ) {
    this.nativeWidth = nativeWidth;
    this.nativeHeight = nativeHeight;
    this.anchor = anchor;
    this.load(maskSrc);
  }

  get ready() {
    return this._ready;
  }

  private load(src: string) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = this.nativeWidth;
      canvas.height = this.nativeHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, this.nativeWidth, this.nativeHeight);
      this.imageData = ctx.getImageData(0, 0, this.nativeWidth, this.nativeHeight);
      this._ready = true;
    };
    img.onerror = () => {
      // Mask not available — boundary methods will use fast-path fallback
    };
    img.src = src;
  }

  /** Sample a single pixel's alpha */
  private sampleAlpha(nx: number, ny: number): boolean {
    if (!this.imageData) return true;
    const px = Math.round(nx);
    const py = Math.round(ny);
    if (px < 0 || py < 0 || px >= this.nativeWidth || py >= this.nativeHeight) {
      return false;
    }
    const idx = (py * this.nativeWidth + px) * 4;
    return this.imageData.data[idx + 3] > 128;
  }

  /**
   * Check if a point (with optional insets) is inside the opaque region.
   * When insets are provided, checks 5 points (center + 4 cardinal offsets)
   * to ensure a rectangle of that size fits within the mask.
   */
  isInside(nx: number, ny: number, insetX = 0, insetY = 0): boolean {
    if (!this.imageData) return true; // fast-path: no mask loaded yet
    if (insetX <= 0 && insetY <= 0) return this.sampleAlpha(nx, ny);
    return (
      this.sampleAlpha(nx, ny) &&
      this.sampleAlpha(nx - insetX, ny) &&
      this.sampleAlpha(nx + insetX, ny) &&
      this.sampleAlpha(nx, ny - insetY) &&
      this.sampleAlpha(nx, ny + insetY)
    );
  }

  /**
   * If inside, return as-is. Otherwise ray-march from the point toward the
   * anchor in 2px steps until finding a valid position.
   */
  clamp(nx: number, ny: number, insetX = 0, insetY = 0): MaskAnchor {
    if (this.isInside(nx, ny, insetX, insetY)) return { x: nx, y: ny };

    const dx = this.anchor.x - nx;
    const dy = this.anchor.y - ny;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) return { x: this.anchor.x, y: this.anchor.y };

    const stepX = (dx / dist) * 2;
    const stepY = (dy / dist) * 2;
    const maxSteps = Math.ceil(dist / 2);

    let cx = nx;
    let cy = ny;
    for (let i = 0; i < maxSteps; i++) {
      cx += stepX;
      cy += stepY;
      if (this.isInside(cx, cy, insetX, insetY)) {
        return { x: cx, y: cy };
      }
    }

    return { x: this.anchor.x, y: this.anchor.y };
  }

  /**
   * Soft rubber-band resistance. If inside, return as-is.
   * Otherwise binary-search the ray to anchor to find the boundary crossing,
   * then allow limited overflow beyond it.
   */
  applySoftBoundary(nx: number, ny: number, factor = 0.3, insetX = 0, insetY = 0): MaskAnchor {
    if (this.isInside(nx, ny, insetX, insetY)) return { x: nx, y: ny };

    // Binary search for boundary crossing between point and anchor
    let lo = 0; // at anchor (inside)
    let hi = 1; // at point (outside)
    const ax = this.anchor.x;
    const ay = this.anchor.y;

    for (let i = 0; i < 12; i++) {
      const mid = (lo + hi) / 2;
      const mx = ax + (nx - ax) * mid;
      const my = ay + (ny - ay) * mid;
      if (this.isInside(mx, my, insetX, insetY)) {
        lo = mid;
      } else {
        hi = mid;
      }
    }

    // Boundary point
    const bx = ax + (nx - ax) * lo;
    const by = ay + (ny - ay) * lo;

    // Allow limited overflow beyond boundary
    return {
      x: bx + (nx - bx) * factor,
      y: by + (ny - by) * factor,
    };
  }

  /**
   * Find a random spawn position within the mask's opaque region.
   * Tries random points within the bounding rect, averaged with anchor for clustering.
   */
  getSpawnPosition(
    boundingRect: { x: number; y: number; width: number; height: number },
  ): MaskAnchor {
    for (let i = 0; i < 20; i++) {
      const rx = boundingRect.x + Math.random() * boundingRect.width;
      const ry = boundingRect.y + Math.random() * boundingRect.height;
      // Average with anchor for clustering bias
      const cx = (rx + this.anchor.x) / 2;
      const cy = (ry + this.anchor.y) / 2;
      if (this.isInside(cx, cy)) {
        return { x: cx, y: cy };
      }
    }
    return { x: this.anchor.x, y: this.anchor.y };
  }

  dispose() {
    this.imageData = null;
    this._ready = false;
  }
}
