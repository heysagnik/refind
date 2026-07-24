import Link from 'next/link';
import { SearchIcon } from '@/app/components/icons';

interface Props {
  message: string;
  buttonLabel: string;
  buttonHref: string;
}

export function EmptyState({ message, buttonLabel, buttonHref }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center rounded-lg border border-dashed border-line bg-surface/50">
      <div className="w-16 h-16 rounded-full bg-bg flex items-center justify-center mb-4">
        <SearchIcon className="w-7 h-7 text-ink-faint" />
      </div>
      <p className="text-ink-soft mb-5 max-w-[260px]">{message}</p>
      <Link
        href={buttonHref}
        className="inline-flex items-center justify-center rounded-pill px-6 py-3 bg-accent text-white text-[15px] font-semibold min-h-[48px] hover:bg-accent-hover active:scale-[0.98] transition-all duration-150"
      >
        {buttonLabel}
      </Link>
    </div>
  );
}
