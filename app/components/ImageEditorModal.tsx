'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  applyBlurRegion,
  blobToDataUrl,
  compressCanvas,
  cropCanvas,
  loadImage,
  type FractionalRect,
} from '@/lib/image-redaction';
import { CheckIcon, CropIcon, BrushIcon, UndoIcon, ResetIcon, BackIcon } from '@/app/components/icons';

interface Props {
  src: string;
  onCancel: () => void;
  onSave: (dataUrl: string) => void;
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

const FULL_RECT: FractionalRect = { x: 0, y: 0, w: 1, h: 1 };
const MIN_SIZE = 0.12;

type Handle = 'nw' | 'n' | 'ne' | 'w' | 'e' | 'sw' | 's' | 'se';
type DragKind = 'move' | Handle;

const HANDLES: { id: Handle; left: number; top: number; cursor: string; size: string }[] = [
  { id: 'nw', left: 0, top: 0, cursor: 'cursor-nwse-resize', size: 'w-5 h-5' },
  { id: 'n', left: 50, top: 0, cursor: 'cursor-ns-resize', size: 'w-4 h-4' },
  { id: 'ne', left: 100, top: 0, cursor: 'cursor-nesw-resize', size: 'w-5 h-5' },
  { id: 'w', left: 0, top: 50, cursor: 'cursor-ew-resize', size: 'w-4 h-4' },
  { id: 'e', left: 100, top: 50, cursor: 'cursor-ew-resize', size: 'w-4 h-4' },
  { id: 'sw', left: 0, top: 100, cursor: 'cursor-nesw-resize', size: 'w-5 h-5' },
  { id: 's', left: 50, top: 100, cursor: 'cursor-ns-resize', size: 'w-4 h-4' },
  { id: 'se', left: 100, top: 100, cursor: 'cursor-nwse-resize', size: 'w-5 h-5' },
];

const HANDLE_EDGES: Record<Handle, { left?: boolean; right?: boolean; top?: boolean; bottom?: boolean }> = {
  nw: { left: true, top: true },
  n: { top: true },
  ne: { right: true, top: true },
  w: { left: true },
  e: { right: true },
  sw: { left: true, bottom: true },
  s: { bottom: true },
  se: { right: true, bottom: true },
};

function clamp(v: number, min: number, max: number) {
  const hi = Math.max(min, max);
  return Math.min(Math.max(v, min), hi);
}

export function ImageEditorModal({ src, onCancel, onSave }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalRef = useRef<HTMLCanvasElement | null>(null);
  const baseRef = useRef<HTMLCanvasElement | null>(null);
  const currentStrokeRef = useRef<Point[]>([]);
  const drawingRef = useRef(false);
  const dragRef = useRef<{ kind: DragKind; startX: number; startY: number; startRect: FractionalRect } | null>(null);

  const [mode, setMode] = useState<'crop' | 'blur'>('crop');
  const [ready, setReady] = useState(false);
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const [draggingCrop, setDraggingCrop] = useState(false);
  const [brushRadius, setBrushRadius] = useState<number>(BRUSH_SIZES[1].radius);
  const [cropRect, setCropRect] = useState<FractionalRect>(FULL_RECT);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadImage(src).then((img) => {
      if (cancelled) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d')!.drawImage(img, 0, 0);

      const original = document.createElement('canvas');
      original.width = img.width;
      original.height = img.height;
      original.getContext('2d')!.drawImage(img, 0, 0);
      originalRef.current = original;

      const base = document.createElement('canvas');
      base.width = img.width;
      base.height = img.height;
      base.getContext('2d')!.drawImage(img, 0, 0);
      baseRef.current = base;

      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [src]);

  useEffect(() => {
    if (mode !== 'blur') return;
    const canvas = canvasRef.current;
    const base = baseRef.current;
    if (!canvas || !base) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(base, 0, 0);
    strokes.forEach((stroke) => stroke.forEach((p) => applyBlurRegion(ctx, p.x, p.y, p.radius)));
  }, [strokes, mode]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onCancel]);

  function canvasPointFromClient(clientX: number, clientY: number) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width;
    return { x: (clientX - rect.left) * scale, y: (clientY - rect.top) * scale };
  }

  function paintAt(clientX: number, clientY: number) {
    const { x, y } = canvasPointFromClient(clientX, clientY);
    currentStrokeRef.current.push({ x, y, radius: brushRadius });
    applyBlurRegion(canvasRef.current!.getContext('2d')!, x, y, brushRadius);
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (mode !== 'blur' || !ready) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    currentStrokeRef.current = [];
    paintAt(e.clientX, e.clientY);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (mode !== 'blur' || !drawingRef.current) return;
    paintAt(e.clientX, e.clientY);
  }

  function commitStroke() {
    if (currentStrokeRef.current.length === 0) return;
    setStrokes((prev) => [...prev, currentStrokeRef.current]);
    currentStrokeRef.current = [];
  }

  function handlePointerUp() {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    commitStroke();
  }

  function undoBlur() {
    setStrokes((prev) => prev.slice(0, -1));
  }

  const cropIsFull = cropRect.x === 0 && cropRect.y === 0 && cropRect.w === 1 && cropRect.h === 1;

  function applyCrop() {
    const canvas = canvasRef.current;
    if (!canvas || cropIsFull) {
      setMode('blur');
      return;
    }
    const cropped = cropCanvas(canvas, cropRect);
    canvas.width = cropped.width;
    canvas.height = cropped.height;
    canvas.getContext('2d')!.drawImage(cropped, 0, 0);
    baseRef.current = cropped;
    setStrokes([]);
    setCropRect(FULL_RECT);
    setMode('blur');
  }

  function resetAll() {
    const original = originalRef.current;
    const canvas = canvasRef.current;
    if (!original || !canvas) return;
    canvas.width = original.width;
    canvas.height = original.height;
    canvas.getContext('2d')!.drawImage(original, 0, 0);

    const base = document.createElement('canvas');
    base.width = original.width;
    base.height = original.height;
    base.getContext('2d')!.drawImage(original, 0, 0);
    baseRef.current = base;

    setStrokes([]);
    setCropRect(FULL_RECT);
    setMode('crop');
  }

  async function handleSave() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSaving(true);
    try {
      const blob = await compressCanvas(canvas);
      const dataUrl = await blobToDataUrl(blob);
      onSave(dataUrl);
    } finally {
      setSaving(false);
    }
  }

  function startDrag(e: React.PointerEvent, kind: DragKind) {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDraggingCrop(true);
    dragRef.current = { kind, startX: e.clientX, startY: e.clientY, startRect: cropRect };
  }

  function onOverlayPointerMove(e: React.PointerEvent) {
    const drag = dragRef.current;
    const wrap = wrapRef.current;
    if (!drag || !wrap) return;
    const bounds = wrap.getBoundingClientRect();
    const dx = (e.clientX - drag.startX) / bounds.width;
    const dy = (e.clientY - drag.startY) / bounds.height;
    const s = drag.startRect;

    let next: FractionalRect;
    if (drag.kind === 'move') {
      next = {
        ...s,
        x: clamp(s.x + dx, 0, 1 - s.w),
        y: clamp(s.y + dy, 0, 1 - s.h),
      };
    } else {
      const edges = HANDLE_EDGES[drag.kind];
      let { x, y, w, h } = s;
      if (edges.left) {
        const newX = clamp(s.x + dx, 0, s.x + s.w - MIN_SIZE);
        w = s.w - (newX - s.x);
        x = newX;
      }
      if (edges.right) {
        w = clamp(s.w + dx, MIN_SIZE, 1 - s.x);
      }
      if (edges.top) {
        const newY = clamp(s.y + dy, 0, s.y + s.h - MIN_SIZE);
        h = s.h - (newY - s.y);
        y = newY;
      }
      if (edges.bottom) {
        h = clamp(s.h + dy, MIN_SIZE, 1 - s.y);
      }
      next = { x, y, w, h };
    }
    setCropRect(next);
  }

  function onOverlayPointerUp() {
    dragRef.current = null;
    setDraggingCrop(false);
  }

  return createPortal(
    <div className="fixed inset-0 z-[60] flex flex-col bg-ink">
      <div className="flex items-center justify-between px-3 py-3 border-b border-white/10 shrink-0 bg-ink">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1 pl-1 pr-3 py-1.5 rounded-pill text-[14px] font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <BackIcon className="w-4 h-4" />
          Cancel
        </button>
        <h2 className="text-[15px] font-bold text-white">Edit photo</h2>
        <button
          type="button"
          onClick={handleSave}
          disabled={!ready || saving}
          className="flex items-center gap-1.5 pl-3.5 pr-4 py-1.5 rounded-pill bg-accent text-white text-[14px] font-bold hover:bg-accent-hover transition-colors cursor-pointer disabled:opacity-50"
        >
          <CheckIcon className="w-4 h-4" />
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      <div className="relative flex-1 flex items-center justify-center overflow-hidden p-4 min-h-0">
        {!ready && (
          <div className="absolute w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        )}
        <div
          ref={wrapRef}
          className="relative inline-block max-w-full max-h-full select-none"
          style={{ lineHeight: 0, visibility: ready ? 'visible' : 'hidden' }}
        >
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            style={{ maxWidth: '100%', maxHeight: '65vh', width: 'auto', height: 'auto', display: 'block' }}
            className={`rounded-md touch-none ${mode === 'blur' ? 'cursor-crosshair' : ''}`}
          />
          {mode === 'crop' && (
            <div className="absolute inset-0 touch-none" onPointerMove={onOverlayPointerMove} onPointerUp={onOverlayPointerUp}>
              <div
                onPointerDown={(e) => startDrag(e, 'move')}
                className="absolute border-2 border-white cursor-move"
                style={{
                  left: `${cropRect.x * 100}%`,
                  top: `${cropRect.y * 100}%`,
                  width: `${cropRect.w * 100}%`,
                  height: `${cropRect.h * 100}%`,
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
                }}
              >
                {draggingCrop && (
                  <div className="absolute inset-0 pointer-events-none opacity-80">
                    <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/60" />
                    <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/60" />
                    <div className="absolute top-1/3 left-0 right-0 h-px bg-white/60" />
                    <div className="absolute top-2/3 left-0 right-0 h-px bg-white/60" />
                  </div>
                )}
                {HANDLES.map((h) => (
                  <div
                    key={h.id}
                    onPointerDown={(e) => startDrag(e, h.id)}
                    className={`absolute ${h.size} -translate-x-1/2 -translate-y-1/2 bg-white rounded-full border-2 border-accent shadow-sm ${h.cursor}`}
                    style={{ left: `${h.left}%`, top: `${h.top}%` }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-2 bg-ink">
        <div className="flex items-center justify-center gap-2 mb-3.5">
          <button
            type="button"
            onClick={() => setMode('crop')}
            className={`flex items-center gap-1.5 rounded-pill px-4 py-2 text-[13px] font-semibold transition-colors cursor-pointer ${
              mode === 'crop' ? 'bg-white text-ink' : 'bg-white/10 text-white/70 hover:text-white'
            }`}
          >
            <CropIcon className="w-4 h-4" />
            Crop
          </button>
          <button
            type="button"
            onClick={() => setMode('blur')}
            className={`flex items-center gap-1.5 rounded-pill px-4 py-2 text-[13px] font-semibold transition-colors cursor-pointer ${
              mode === 'blur' ? 'bg-white text-ink' : 'bg-white/10 text-white/70 hover:text-white'
            }`}
          >
            <BrushIcon className="w-4 h-4" />
            Blur
          </button>
        </div>

        {mode === 'crop' ? (
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={applyCrop}
              disabled={!ready}
              className="flex items-center gap-1.5 rounded-pill px-5 py-2.5 bg-accent text-white text-[13px] font-bold hover:bg-accent-hover transition-colors cursor-pointer disabled:opacity-50"
            >
              <CheckIcon className="w-3.5 h-3.5" />
              Apply crop
            </button>
            <button
              type="button"
              onClick={resetAll}
              className="flex items-center gap-1.5 rounded-pill px-4 py-2.5 bg-white/10 text-white/80 text-[13px] font-semibold hover:bg-white/15 hover:text-white transition-colors cursor-pointer"
            >
              <ResetIcon className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center justify-center gap-2">
              {BRUSH_SIZES.map((size) => (
                <button
                  key={size.label}
                  type="button"
                  onClick={() => setBrushRadius(size.radius)}
                  className={`flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-[12px] font-semibold border transition-all duration-150 cursor-pointer ${
                    brushRadius === size.radius
                      ? 'bg-accent text-white border-accent'
                      : 'bg-white/10 text-white/70 border-transparent hover:border-white/30'
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
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={undoBlur}
                disabled={strokes.length === 0}
                className="flex items-center gap-1.5 rounded-pill px-4 py-2 text-[13px] font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              >
                <UndoIcon className="w-3.5 h-3.5" />
                Undo ({strokes.length})
              </button>
              <button
                type="button"
                onClick={resetAll}
                className="flex items-center gap-1.5 rounded-pill px-4 py-2 text-[13px] font-semibold text-white/70 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              >
                <ResetIcon className="w-3.5 h-3.5" />
                Reset
              </button>
            </div>
          </div>
        )}
        <p className="text-center text-[12px] text-white/45 mt-2.5">
          {mode === 'crop' ? 'Drag the corners or edges to crop the photo' : 'Tap or drag to blur sensitive details'}
        </p>
      </div>
    </div>,
    document.body
  );
}
