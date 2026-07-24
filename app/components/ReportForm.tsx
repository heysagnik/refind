'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';
import { PhotoPicker } from '@/app/components/PhotoPicker';
import { createItemAction } from '@/app/actions/items';
import { categoryLabels } from '@/lib/questions';
import { PinIcon, CheckIcon } from '@/app/components/icons';

const categoryList = Object.entries(categoryLabels);

const categoryEmoji: Record<string, string> = {
  phone: '📱',
  laptop: '💻',
  wallet: '👛',
  keys: '🔑',
  documents: '📄',
  bag: '🎒',
  clothing: '🧥',
  footwear: '👟',
  jewelry: '💍',
  glasses: '👓',
  watch: '⌚',
  headphones: '🎧',
  waterbottle: '🧴',
  umbrella: '☂️',
  toy: '🧸',
  other: '📦',
};

export function ReportForm() {
  const router = useRouter();
  const [category, setCategory] = useState('electronics');
  const [images, setImages] = useState<string[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [questions, setQuestions] = useState<[string, string]>(['Loading questions...', 'Loading questions...']);
  const [error, setError] = useState<string | null>(null);

  function requestLocation() {
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setError('Location permission is required to report a find.')
    );
  }

  async function generateQuestions(cat: string) {
    setCategory(cat);
    const { pickQuestions } = await import('@/lib/questions');
    setQuestions(pickQuestions(cat));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (images.length === 0) {
      setError('Add at least one photo.');
      return;
    }
    if (!location) {
      setError('Pin your current location.');
      return;
    }
    setSubmitting(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set('category', category);
    formData.set('lat', String(location.lat));
    formData.set('lng', String(location.lng));
    formData.set('imagesBase64', JSON.stringify(images));

    try {
      await createItemAction(formData);
      router.push('/items/my');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-semibold text-ink-soft">Photos (up to 3)</label>
        <PhotoPicker values={images} onChange={setImages} max={3} />
      </div>

      <Input label="Title" name="title" required placeholder="e.g. Black leather wallet" />

      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-semibold text-ink-soft">Category</label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
          {categoryList.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => generateQuestions(key)}
              className={`flex flex-col items-center justify-center gap-1.5 rounded-md px-2 py-3.5 border-2 text-center transition-all duration-150 active:scale-[0.97] cursor-pointer ${
                category === key
                  ? 'bg-accent-soft border-accent text-accent'
                  : 'bg-bg border-transparent text-ink-soft hover:border-line-strong'
              }`}
            >
              <span className="text-xl leading-none">{categoryEmoji[key] ?? '📦'}</span>
              <span className="text-[11px] font-semibold leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <Input label="Description (optional)" name="description" placeholder="Where was it found? Any details?" />

      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-semibold text-ink-soft">Location</label>
        <button
          type="button"
          onClick={requestLocation}
          className={`flex items-center gap-2.5 rounded-md px-4 py-3.5 border-2 text-left transition-all duration-150 cursor-pointer ${
            location ? 'bg-success-soft border-transparent text-success' : 'bg-bg border-dashed border-line-strong text-ink-soft hover:border-accent'
          }`}
        >
          {location ? <CheckIcon className="w-5 h-5 shrink-0" /> : <PinIcon className="w-5 h-5 shrink-0" />}
          <span className="font-semibold text-[15px]">
            {location ? 'Location pinned' : 'Pin your current location'}
          </span>
        </button>
      </div>

      <div className="flex flex-col gap-3 p-4 rounded-lg bg-accent-soft/40 border border-accent-soft">
        <p className="text-[13px] font-bold text-accent uppercase tracking-wide">
          Verification questions
        </p>
        <p className="text-[13px] text-ink-soft -mt-2">Only the real owner would know these answers.</p>
        <Input label={questions[0]} name="answer1" required placeholder="Only the real owner would know" />
        <Input label={questions[1]} name="answer2" required placeholder="Only the real owner would know" />
      </div>

      {error && <p className="text-sm text-danger bg-danger-soft rounded-md px-3 py-2.5 font-medium">{error}</p>}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? 'Submitting...' : 'Submit report'}
      </Button>
    </form>
  );
}