export function compressImage(file: File, maxSizeKB = 200): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 800;
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const ratio = maxDim / Math.max(width, height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      compressCanvas(canvas, maxSizeKB).then(resolve, reject);
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

export function compressCanvas(canvas: HTMLCanvasElement, maxSizeKB = 200): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const tryCompress = (quality: number) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Compression failed"));
          if (blob.size / 1024 <= maxSizeKB || quality <= 0.1) {
            resolve(blob);
          } else {
            tryCompress(quality - 0.1);
          }
        },
        "image/jpeg",
        quality
      );
    };
    tryCompress(0.8);
  });
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read blob"));
    reader.readAsDataURL(blob);
  });
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

/** Crop rect expressed as fractions (0-1) of the source canvas dimensions. */
export interface FractionalRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function cropCanvas(source: HTMLCanvasElement, rect: FractionalRect): HTMLCanvasElement {
  const sx = Math.round(rect.x * source.width);
  const sy = Math.round(rect.y * source.height);
  const sw = Math.max(1, Math.round(rect.w * source.width));
  const sh = Math.max(1, Math.round(rect.h * source.height));

  const out = document.createElement("canvas");
  out.width = sw;
  out.height = sh;
  out.getContext("2d")!.drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh);
  return out;
}

export function applyBlurRegion(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number = 30
) {
  const r = Math.max(radius, 10);
  const sx = Math.max(0, x - r);
  const sy = Math.max(0, y - r);
  const sw = Math.min(ctx.canvas.width - sx, r * 2);
  const sh = Math.min(ctx.canvas.height - sy, r * 2);
  if (sw <= 0 || sh <= 0) return;

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();

  const blockSize = Math.max(4, Math.round(r / 5));
  const tinyW = Math.max(1, Math.round(sw / blockSize));
  const tinyH = Math.max(1, Math.round(sh / blockSize));

  const tiny = document.createElement("canvas");
  tiny.width = tinyW;
  tiny.height = tinyH;
  const tinyCtx = tiny.getContext("2d")!;
  tinyCtx.drawImage(ctx.canvas, sx, sy, sw, sh, 0, 0, tinyW, tinyH);

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(tiny, 0, 0, tinyW, tinyH, sx, sy, sw, sh);
  ctx.imageSmoothingEnabled = true;

  ctx.restore();
}

export { compressImage as default };
