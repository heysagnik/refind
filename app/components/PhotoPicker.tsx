'use client';

import { useState } from 'react';
import { ImageRedactor } from '@/app/components/ImageRedactor';
import { PlusIcon } from '@/app/components/icons';

interface Props {
  values: string[];
  onChange: (values: string[]) => void;
  max?: number;
}

interface Slot {
  id: string;
  src: string;
}

let uid = 0;
function nextId() {
  uid += 1;
  return `photo-${uid}`;
}

export function PhotoPicker({ values, onChange, max = 3 }: Props) {
  // stable ids, not array index, so removing a photo reliably remounts ImageRedactor
  const [slots, setSlots] = useState<Slot[]>(() => values.map((src) => ({ id: nextId(), src })));
  const [activeIndex, setActiveIndex] = useState(0);

  function commit(next: Slot[]) {
    setSlots(next);
    onChange(next.map((s) => s.src));
  }

  const canAddMore = slots.length < max;
  const maxIndex = canAddMore ? slots.length : slots.length - 1;
  const safeActive = Math.max(0, Math.min(activeIndex, maxIndex));
  const editingNewSlot = safeActive >= slots.length;
  const activeId = editingNewSlot ? 'new-slot' : slots[safeActive].id;

  function updateActiveSlot(base64: string) {
    if (safeActive < slots.length) {
      const next = [...slots];
      next[safeActive] = { ...next[safeActive], src: base64 };
      commit(next);
    } else {
      commit([...slots, { id: nextId(), src: base64 }]);
    }
  }

  function removeSlot(index: number) {
    commit(slots.filter((_, i) => i !== index));
    setActiveIndex(0);
  }

  return (
    <div className="flex flex-col gap-3">
      {slots.length > 0 && (
        <div className="flex items-center gap-2.5">
          {slots.map((slot, i) => (
            <button
              key={slot.id}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`relative w-14 h-14 rounded-md overflow-hidden shrink-0 border-2 transition-all duration-150 cursor-pointer ${
                safeActive === i && !editingNewSlot ? 'border-accent' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img src={slot.src} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}

          {canAddMore && (
            <button
              type="button"
              onClick={() => setActiveIndex(slots.length)}
              className={`flex items-center justify-center w-14 h-14 rounded-md shrink-0 border-2 border-dashed transition-all duration-150 cursor-pointer ${
                editingNewSlot ? 'border-accent text-accent bg-accent-soft/30' : 'border-line-strong text-ink-faint hover:border-accent hover:text-accent'
              }`}
              aria-label="Add another photo"
            >
              <PlusIcon className="w-5 h-5" />
            </button>
          )}

          <span className="text-xs text-ink-faint ml-1">{slots.length}/{max}</span>
        </div>
      )}

      <ImageRedactor
        key={activeId}
        value={editingNewSlot ? '' : slots[safeActive].src}
        onChange={updateActiveSlot}
        onRemove={editingNewSlot ? undefined : () => removeSlot(safeActive)}
      />
    </div>
  );
}
