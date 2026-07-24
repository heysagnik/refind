'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_TABS, PlusIcon } from '@/app/components/icons';

export function BottomNav() {
  const pathname = usePathname() ?? '/';
  const [before, after] = [NAV_TABS.slice(0, 2), NAV_TABS.slice(2)];

  function renderTab(tab: (typeof NAV_TABS)[number]) {
    const active = pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href));
    const Icon = tab.icon;
    return (
      <Link
        key={tab.href}
        href={tab.href}
        className={`flex flex-col items-center justify-center gap-0.5 w-16 py-1 rounded-lg transition-all duration-150 active:scale-95 ${active ? 'text-accent' : 'text-ink-faint'}`}
      >
        <Icon className="w-[22px] h-[22px]" strokeWidth={active ? 2.1 : 1.8} />
        <span className={`text-[11px] tracking-tight ${active ? 'font-bold' : 'font-medium'}`}>{tab.label}</span>
      </Link>
    );
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface/90 backdrop-blur-xl border-t border-line shadow-[0_-4px_20px_rgba(0,0,0,0.04)] pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 px-6">
      <div className="max-w-[480px] mx-auto flex items-center justify-around relative">
        {before.map(renderTab)}

        <Link
          href="/items/new"
          aria-label="Report a find"
          className="flex flex-col items-center justify-center gap-1 w-16 -mt-6 active:scale-95 transition-transform duration-150"
        >
          <span className="flex items-center justify-center w-14 h-14 rounded-full bg-accent text-white shadow-elevated border-4 border-surface">
            <PlusIcon className="w-6 h-6" />
          </span>
          <span className="text-[11px] font-bold text-accent tracking-tight">Report</span>
        </Link>

        {after.map(renderTab)}
      </div>
    </nav>
  );
}
