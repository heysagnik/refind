'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/auth-client';

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="text-sm text-ink-soft font-semibold hover:text-danger transition-colors cursor-pointer disabled:opacity-60 w-fit"
    >
      {loading ? 'Logging out…' : 'Log out'}
    </button>
  );
}
