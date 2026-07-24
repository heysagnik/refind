import Link from 'next/link';
import { ReactNode } from 'react';
import { BackIcon } from '@/app/components/icons';

interface Props {
  title?: string;
  subtitle?: string;
  backHref?: string;
  right?: ReactNode;
}

export function Header({ title, subtitle, backHref, right }: Props) {
  return (
    <header className="flex items-center justify-between gap-3 mb-6">
      <div className="flex items-center gap-3 min-w-0">
        {backHref && (
          <Link
            href={backHref}
            aria-label="Back"
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-bg active:scale-95 text-ink transition-all duration-150 shrink-0 -ml-1.5"
          >
            <BackIcon className="w-5 h-5" />
          </Link>
        )}
        {title && (
          <div className="flex flex-col min-w-0">
            <h1 className="text-[22px] font-bold tracking-tight truncate">{title}</h1>
            {subtitle && <p className="text-sm text-ink-soft truncate">{subtitle}</p>}
          </div>
        )}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </header>
  );
}
