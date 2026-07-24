'use client';

import { useState } from 'react';
import { Button } from '@/app/components/ui/Button';
import { reviewClaimAction, confirmHandoverAction } from '@/app/actions/claims';

interface Props {
  claimId: string;
  status: string;
  finderConfirmed: boolean;
  claimerConfirmed: boolean;
  role: 'finder' | 'claimer';
}

export function ClaimActions({ claimId, status, finderConfirmed, claimerConfirmed, role }: Props) {
  const [submitting, setSubmitting] = useState(false);

  async function decide(decision: 'approve' | 'reject') {
    setSubmitting(true);
    await reviewClaimAction(claimId, decision);
    location.reload();
  }

  async function confirm() {
    setSubmitting(true);
    await confirmHandoverAction(claimId);
    location.reload();
  }

  if (role === 'finder' && status === 'pending_review') {
    return (
      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => decide('reject')} disabled={submitting} className="flex-1">
          Reject
        </Button>
        <Button onClick={() => decide('approve')} disabled={submitting} className="flex-1">
          Approve & Contact
        </Button>
      </div>
    );
  }

  if (status === 'approved') {
    const confirmed = role === 'finder' ? finderConfirmed : claimerConfirmed;
    const otherConfirmed = role === 'finder' ? claimerConfirmed : finderConfirmed;
    const otherRole = role === 'finder' ? 'claimer' : 'finder';

    if (!confirmed) {
      return (
        <Button onClick={confirm} disabled={submitting} className="w-full">
          Confirm handover
        </Button>
      );
    }
    if (!otherConfirmed) {
      return (
        <p className="text-accent-warm font-semibold text-sm bg-warning-soft rounded-md px-3.5 py-2.5">
          You confirmed ✓ — waiting for the {otherRole} to confirm too.
        </p>
      );
    }
    return (
      <p className="text-success font-semibold text-sm bg-success-soft rounded-md px-3.5 py-2.5">
        Handover confirmed by both sides ✓
      </p>
    );
  }

  if (status === 'rejected') {
    return <p className="text-sm text-ink-soft bg-bg rounded-md px-3.5 py-2.5">Claim rejected.</p>;
  }

  return <p className="text-sm text-ink-soft bg-bg rounded-md px-3.5 py-2.5">Waiting for finder review…</p>;
}

export function WhatsAppLink({
  number,
  itemTitle,
  role = 'finder',
}: {
  number: string;
  itemTitle: string;
  role?: 'finder' | 'claimer';
}) {
  const message =
    role === 'finder'
      ? `Hi! I found your ${itemTitle} on MilGaya. Let's coordinate the handover.`
      : `Hi! I claimed the ${itemTitle} you found on MilGaya. Let's coordinate the handover.`;
  const text = encodeURIComponent(message);
  const url = `https://wa.me/${number.replace(/\D/g, '')}?text=${text}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center w-full rounded-pill px-6 py-3 bg-success text-white text-[15px] font-semibold min-h-[48px] hover:opacity-90 active:scale-[0.98] transition-all duration-150"
    >
      Open WhatsApp
    </a>
  );
}