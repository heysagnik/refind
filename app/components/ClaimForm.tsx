'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';
import { useSession } from '@/lib/auth-client';
import { submitClaimAction } from '@/app/actions/claims';

interface Props {
  itemId: string;
  question1: string;
  question2: string;
}

export function ClaimForm({ itemId, question1, question2 }: Props) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isPending) {
    return <div className="h-32 bg-bg rounded-md animate-pulse" />;
  }

  if (!session) {
    return (
      <Button
        className="w-full"
        onClick={() => router.push(`/auth/signup?redirect=${encodeURIComponent(`/items/${itemId}`)}`)}
      >
        Sign in to claim
      </Button>
    );
  }

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setError(null);
    try {
      const a1 = String(formData.get('a1') ?? '');
      const a2 = String(formData.get('a2') ?? '');
      await submitClaimAction(itemId, a1, a2);
      router.push('/claims/my');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSubmitting(false);
    }
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <Input label={question1} name="a1" required />
      <Input label={question2} name="a2" required />
      {error && <p className="text-sm text-danger bg-danger-soft rounded-md px-3 py-2.5 font-medium">{error}</p>}
      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? 'Submitting…' : 'Submit claim'}
      </Button>
    </form>
  );
}