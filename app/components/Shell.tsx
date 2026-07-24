'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, Suspense, useEffect, useId, useState } from 'react';
import { useSession, signOut } from '@/lib/auth-client';
import { NAV_TABS, PlusIcon, ChevronDownIcon } from '@/app/components/icons';
import { RegionPicker } from '@/app/components/RegionPicker';
import { Footer } from '@/app/components/Footer';

function Logo({ compact = false }: { compact?: boolean }) {
  // desktop + mobile headers both render this at once; unique ids avoid colliding SVG defs
  const uid = useId();
  const bgId = `${uid}-bg`;
  const sheenId = `${uid}-sheen`;
  const shadowId = `${uid}-shadow`;

  return (
    <Link href="/" className="flex items-center gap-2 shrink-0">
      <svg viewBox="0 0 64 64" className={compact ? 'w-8 h-8' : 'w-9 h-9'} aria-hidden="true">
        <defs>
          <linearGradient id={bgId} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#3B82F6" />
            <stop offset="1" stopColor="#1D4ED8" />
          </linearGradient>
          <linearGradient id={sheenId} x1="0" y1="0" x2="0" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.18" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
          <filter id={shadowId} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#0F1E4D" floodOpacity="0.35" />
          </filter>
        </defs>
        <rect width="64" height="64" rx="14" fill={`url(#${bgId})`} />
        <rect width="64" height="40" rx="14" fill={`url(#${sheenId})`} />
        <path
          d="M32 13 A12 12 0 0 1 44 25 C44 34 34 40 32 52 C30 40 20 34 20 25 A12 12 0 0 1 32 13 Z"
          fill="#FFFFFF"
          filter={`url(#${shadowId})`}
        />
        <circle cx="32" cy="24" r="4.5" fill="#1D4ED8" />
      </svg>
      <span className={`${compact ? 'text-base' : 'text-lg'} font-extrabold tracking-tight`}>ReFind</span>
    </Link>
  );
}

function NavLinks({ pathname }: { pathname: string }) {
  return (
    <>
      {NAV_TABS.map((tab) => {
        const active = pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href));
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2 rounded-pill text-[14px] font-semibold transition-colors duration-150 ${
              active ? 'bg-accent-soft text-accent' : 'text-ink-soft hover:bg-bg hover:text-ink'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </>
  );
}

function AvatarMenu({ name, email }: { name: string; email: string }) {
  const [open, setOpen] = useState(false);
  const initial = (name || '?').charAt(0).toUpperCase();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-pill border border-line hover:shadow-card transition-shadow cursor-pointer"
      >
        <div className="w-8 h-8 rounded-full bg-accent-soft text-accent flex items-center justify-center text-sm font-bold">
          {initial}
        </div>
        <ChevronDownIcon className={`w-3.5 h-3.5 text-ink-soft transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-[calc(100%+8px)] w-56 bg-surface rounded-md border border-line shadow-elevated overflow-hidden z-50">
            <div className="px-4 py-3 border-b border-line">
              <div className="text-sm font-semibold truncate">{name || 'You'}</div>
              <div className="text-xs text-ink-soft truncate">{email}</div>
            </div>
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-ink hover:bg-bg transition-colors"
            >
              Profile
            </Link>
            <button
              type="button"
              onClick={() => signOut()}
              className="block w-full text-left px-4 py-2.5 text-sm text-ink-soft hover:bg-bg cursor-pointer transition-colors"
            >
              Log out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '/';
  const { data: session, refetch } = useSession();

  // login/signup use server actions, which bypass the client SDK's session store —
  // refetch on route change so post-auth redirects actually update the header
  useEffect(() => {
    refetch?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <div className="flex flex-col flex-1 min-h-full">
      <header className="hidden md:flex sticky top-0 z-30 items-center justify-between h-[72px] py-3 px-6 md:px-8 lg:px-10 bg-surface/85 backdrop-blur-xl border-b border-line">
        <div className="flex items-center gap-1">
          <Logo />
          <nav className="flex items-center gap-1 ml-6">
            <NavLinks pathname={pathname} />
          </nav>
          <div className="ml-2">
            <Suspense fallback={<div className="h-[42px] w-[128px] rounded-pill bg-bg animate-pulse" />}>
              <RegionPicker />
            </Suspense>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/items/new"
            className="inline-flex items-center gap-1.5 rounded-pill px-5 py-2.5 bg-accent text-white text-[14px] font-semibold min-h-[44px] hover:bg-accent-hover active:scale-[0.98] transition-all duration-150"
          >
            <PlusIcon className="w-4 h-4" />
            Report a find
          </Link>

          {session ? (
            <AvatarMenu name={session.user.name || ''} email={session.user.email || ''} />
          ) : (
            <Link
              href="/auth/login"
              className="px-4 py-2 rounded-pill text-[14px] font-semibold text-ink-soft hover:bg-bg transition-colors"
            >
              Log in
            </Link>
          )}
        </div>
      </header>

      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between h-14 px-5 bg-surface/85 backdrop-blur-xl border-b border-line">
        <div className="flex items-center gap-2 min-w-0">
          <Logo compact />
          <Suspense fallback={<div className="h-[27px] w-[90px] rounded-pill bg-bg animate-pulse" />}>
            <RegionPicker compact />
          </Suspense>
        </div>
        {session ? (
          <Link href="/profile" className="w-8 h-8 rounded-full bg-accent-soft text-accent flex items-center justify-center text-sm font-bold">
            {(session.user.name || '?').charAt(0).toUpperCase()}
          </Link>
        ) : (
          <Link href="/auth/login" className="text-[14px] font-semibold text-accent">
            Log in
          </Link>
        )}
      </header>

      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        {children}
        <Footer />
      </div>
    </div>
  );
}
