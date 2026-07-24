import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sitemap | MilGaya — Community Lost & Found',
  description: 'Sitemap and dynamic routes directory for MilGaya community lost & found platform.',
};

export default function SitemapPage() {
  return (
    <main className="max-w-[800px] mx-auto px-6 py-12">
      <h1 className="text-3xl font-extrabold mb-4">Sitemap</h1>
      <p className="text-ink-soft mb-8">
        Navigate key pages and services on MilGaya — the privacy-first community lost &amp; found platform.
      </p>
      <ul className="space-y-3">
        <li>
          <a href="/" className="text-accent font-semibold hover:underline">
            Home &amp; Explore Map
          </a>
        </li>
        <li>
          <a href="/items/new" className="text-accent font-semibold hover:underline">
            Report a Found Item
          </a>
        </li>
        <li>
          <a href="/auth/login" className="text-accent font-semibold hover:underline">
            Log In
          </a>
        </li>
        <li>
          <a href="/auth/signup" className="text-accent font-semibold hover:underline">
            Sign Up
          </a>
        </li>
        <li>
          <a href="/privacy" className="text-accent font-semibold hover:underline">
            Privacy Policy
          </a>
        </li>
        <li>
          <a href="/terms" className="text-accent font-semibold hover:underline">
            Terms of Service
          </a>
        </li>
      </ul>
    </main>
  );
}
