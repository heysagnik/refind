'use client';

import { useRef, useState } from 'react';
import { compressImage, blobToDataUrl } from '@/lib/image-redaction';
import { ImageEditorModal } from '@/app/components/ImageEditorModal';
import { CameraIcon, EditIcon } from '@/app/components/icons';

interface Props {
  value: string;
  onChange: (base64: string) => void;
  onRemove?: () => void;
}

export function ImageRedactor({ value, onChange, onRemove }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setLoading(true);
    try {
      const compressed = await compressImage(f);
      const dataUrl = await blobToDataUrl(compressed);
      setPreview(dataUrl);
      onChange(dataUrl);
    } finally {
      setLoading(false);
    }
  }

  function handleEditSave(dataUrl: string) {
    setPreview(dataUrl);
    onChange(dataUrl);
    setEditing(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />

      {preview ? (
        <>
          <div className="relative w-full aspect-[4/3] bg-bg rounded-lg overflow-hidden border border-line shadow-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Uploaded photo" className="w-full h-full object-contain" />
            {loading && (
              <div className="absolute inset-0 bg-ink/40 flex items-center justify-center text-white text-[13px] font-semibold">
                Compressing…
              </div>
            )}
          </div>
          <p className="text-xs text-ink-faint text-center">
            Edit the photo to crop it or blur sensitive details (faces, ID numbers, addresses)
          </p>
          <div className="flex gap-4 justify-center">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 text-[13px] font-semibold text-accent hover:text-accent-hover transition-colors cursor-pointer"
            >
              <EditIcon className="w-3.5 h-3.5" />
              Edit photo
            </button>
            <button type="button" onClick={() => fileRef.current?.click()} className="text-[13px] font-semibold text-ink-soft hover:text-ink transition-colors cursor-pointer">
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
          disabled={loading}
          className="aspect-[4/3] w-full bg-bg border-2 border-dashed border-line-strong rounded-lg flex flex-col items-center justify-center gap-2.5 text-ink-soft hover:border-accent hover:bg-accent-soft/20 transition-all duration-150 cursor-pointer disabled:opacity-60"
        >
          <div className="w-12 h-12 rounded-full bg-surface shadow-card flex items-center justify-center">
            <CameraIcon className="w-6 h-6" />
          </div>
          <span className="text-[15px] font-bold text-ink">{loading ? 'Processing…' : 'Add a photo'}</span>
          <span className="text-xs text-ink-faint">You can crop and blur it after uploading</span>
        </button>
      )}

      {editing && preview && (
        <ImageEditorModal src={preview} onCancel={() => setEditing(false)} onSave={handleEditSave} />
      )}
    </div>
  );
}
