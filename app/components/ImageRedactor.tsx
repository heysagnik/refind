'use client';

import { useEffect, useRef, useState } from 'react';
import { compressImage, applyBlurRegion } from '@/lib/image-redaction';
import { CameraIcon } from '@/app/components/icons';

interface Props {
  value: string;
  onChange: (base64: string) => void;
  onRemove?: () => void;
}

const BRUSH_SIZES = [
  { label: 'Small', radius: 10 },
  { label: 'Medium', radius: 18 },
  { label: 'Large', radius: 30 },
] as const;

interface Point {
  x: number;
  y: number;
  radius: number;
}

export function ImageRedactor({ value, onChange, onRemove }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const baseImageRef = useRef<HTMLImageElement | null>(null);
  const currentStrokeRef = useRef<Point[]>([]);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const [drawing, setDrawing] = useState(false);
  const [brushRadius, setBrushRadius] = useState<number>(BRUSH_SIZES[1].radius);
  const [cursor, setCursor] = useState<{ x: number; y: number; size: number } | null>(null);

  useEffect(() => {
    if (!value) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d')!.drawImage(img, 0, 0);
      baseImageRef.current = img;
    };
    img.src = value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const compressed = await compressImage(f);
    await loadAndEncode(compressed);
  }

  async function loadAndEncode(blob: Blob) {
    const url = URL.createObjectURL(blob);
    setPreview(url);
    setStrokes([]);
    currentStrokeRef.current = [];
    await new Promise((r) => setTimeout(r, 50));

    const canvas = canvasRef.current!;
    const img = new Image();
    img.onload = () => {
      const maxDim = 800;
      const ratio = maxDim / Math.max(img.width, img.height);
      canvas.width = Math.round(img.width * (ratio < 1 ? ratio : 1));
      canvas.height = Math.round(img.height * (ratio < 1 ? ratio : 1));
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      baseImageRef.current = img;
      emitBase64();
    };
    img.src = url;
  }

  function emitBase64() {
    canvasRef.current?.toBlob(
      async (blob) => {
        if (!blob) return;
        const reader = new FileReader();
        reader.onloadend = () => onChange(reader.result as string);
        reader.readAsDataURL(blob);
      },
      'image/jpeg',
      0.8
    );
  }

  function canvasPoint(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const scale = canvasRef.current!.width / rect.width;
    return {
      x: (e.clientX - rect.left) * scale,
      y: (e.clientY - rect.top) * scale,
      displayX: e.clientX - rect.left,
      displayY: e.clientY - rect.top,
      displaySize: brushRadius * 2 * (rect.width / canvasRef.current!.width),
    };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!preview) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrawing(true);
    currentStrokeRef.current = [];
    paintAt(e);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!preview) return;
    const p = canvasPoint(e);
    setCursor({ x: p.displayX, y: p.displayY, size: p.displaySize });
    if (drawing) paintAt(e);
  }

  function paintAt(e: React.PointerEvent<HTMLCanvasElement>) {
    const { x, y } = canvasPoint(e);
    currentStrokeRef.current.push({ x, y, radius: brushRadius });
    applyBlurRegion(canvasRef.current!.getContext('2d')!, x, y, brushRadius);
    emitBase64();
  }

  function commitStroke() {
    if (currentStrokeRef.current.length === 0) return;
    setStrokes((prev) => [...prev, currentStrokeRef.current]);
    currentStrokeRef.current = [];
  }

  function handlePointerUp() {
    setDrawing(false);
    commitStroke();
  }

  function handlePointerLeave() {
    setDrawing(false);
    commitStroke();
    setCursor(null);
  }

  function undo() {
    if (strokes.length === 0 || !baseImageRef.current) return;
    const updated = strokes.slice(0, -1);
    setStrokes(updated);
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(baseImageRef.current, 0, 0, canvas.width, canvas.height);
    updated.forEach((stroke) => stroke.forEach((p) => applyBlurRegion(ctx, p.x, p.y, p.radius)));
    emitBase64();
  }

  return (
    <div className="flex flex-col gap-3">
      <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />

      {preview ? (
        <>
          <div className="flex items-center justify-center gap-2">
            {BRUSH_SIZES.map((size) => (
              <button
                key={size.label}
                type="button"
                onClick={() => setBrushRadius(size.radius)}
                className={`flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-[12px] font-semibold border transition-all duration-150 cursor-pointer ${
                  brushRadius === size.radius
                    ? 'bg-accent text-white border-accent'
                    : 'bg-bg text-ink-soft border-transparent hover:border-line-strong'
                }`}
              >
                <span
                  className="rounded-full bg-current opacity-70"
                  style={{ width: 6 + BRUSH_SIZES.indexOf(size) * 4, height: 6 + BRUSH_SIZES.indexOf(size) * 4 }}
                />
                {size.label}
              </button>
            ))}
          </div>

          <div className="relative w-full bg-bg rounded-lg overflow-hidden border border-line shadow-card">
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerLeave}
              className="w-full touch-none cursor-none"
            />
            {cursor && (
              <div
                className="pointer-events-none absolute rounded-full border-2 border-accent bg-accent/15"
                style={{
                  left: cursor.x - cursor.size / 2,
                  top: cursor.y - cursor.size / 2,
                  width: cursor.size,
                  height: cursor.size,
                }}
              />
            )}
          </div>
          <p className="text-xs text-ink-faint text-center">
            Tap or drag over sensitive details (faces, ID numbers, addresses) to hide them
          </p>
          <div className="flex gap-4 justify-center">
            <button
              type="button"
              onClick={undo}
              disabled={strokes.length === 0}
              className="text-[13px] font-semibold text-ink-soft hover:text-ink transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-ink-soft"
            >
              Undo blur ({strokes.length})
            </button>
            <button type="button" onClick={() => fileRef.current?.click()} className="text-[13px] font-semibold text-accent hover:text-accent-hover transition-colors cursor-pointer">
              Change photo
            </button>
            {onRemove && (
              <button type="button" onClick={onRemove} className="text-[13px] font-semibold text-danger hover:opacity-80 transition-colors cursor-pointer">
                Remove
              </button>
            )}
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="aspect-[4/3] w-full bg-bg border-2 border-dashed border-line-strong rounded-lg flex flex-col items-center justify-center gap-2.5 text-ink-soft hover:border-accent hover:bg-accent-soft/20 transition-all duration-150 cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-surface shadow-card flex items-center justify-center">
            <CameraIcon className="w-6 h-6" />
          </div>
          <span className="text-[15px] font-bold text-ink">Add a photo</span>
          <span className="text-xs text-ink-faint">Blur sensitive details before upload</span>
        </button>
      )}
    </div>
  );
}
