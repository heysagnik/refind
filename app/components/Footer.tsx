import Link from 'next/link';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto pt-6 pb-4 px-6 text-center">
      <p className="text-[11px] text-ink-faint">
        © {year} ReFind ·{' '}
        <Link href="/privacy" className="hover:text-ink-soft transition-colors">
          Privacy Policy
        </Link>{' '}
        ·{' '}
        <Link href="/terms" className="hover:text-ink-soft transition-colors">
          Terms &amp; Conditions
        </Link>
      </p>
    </footer>
  );
}
