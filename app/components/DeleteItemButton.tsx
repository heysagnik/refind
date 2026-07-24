'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/Button';
import { deleteItemAction } from '@/app/actions/items';

export function DeleteItemButton({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await deleteItemAction(itemId);
      router.push('/items/my');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setDeleting(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex flex-col gap-3 p-4 rounded-md bg-danger-soft border border-danger/20">
        <p className="text-[13px] font-semibold text-danger">
          Delete this report? This can&rsquo;t be undone.
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setConfirming(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="danger" className="flex-1" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Yes, delete'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-[13px] font-semibold text-danger hover:opacity-80 transition-colors cursor-pointer text-left"
      >
        Delete this report
      </button>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
