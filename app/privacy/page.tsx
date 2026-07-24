import { Header } from '@/app/components/ui/Header';

export default function PrivacyPage() {
  return (
    <main className="flex-1 flex flex-col px-6 md:px-8 lg:px-10 py-6 max-w-[720px] mx-auto w-full pb-24 md:pb-12">
      <Header title="Privacy Policy" backHref="/" />

      <div className="flex flex-col gap-6 text-[15px] text-ink-soft leading-relaxed">
        <p className="text-xs text-ink-faint">
          Last updated {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}. This is a
          plain-language description of how ReFind actually handles your data, written by the people who built
          it — not a substitute for reviewed legal counsel.
        </p>

        <section className="flex flex-col gap-2">
          <h2 className="text-[16px] font-bold text-ink">What we collect</h2>
          <p>
            To browse reported items, we collect nothing — no account is needed. To report a find or submit a
            claim, we collect your name, email, WhatsApp number, password (stored as a salted hash, never in
            plain text), and the type and <strong>last four digits only</strong> of an ID document — never the
            full number.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-[16px] font-bold text-ink">Photos and location</h2>
          <p>
            When you report a find, you&rsquo;re prompted to blur out any identifying details in your photo
            before it&rsquo;s uploaded. The exact spot where an item was found is never shown publicly — it&rsquo;s
            randomly offset by roughly 150 meters before being displayed on the map, and only the fuzzed location
            is used to answer &ldquo;near me&rdquo; searches.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-[16px] font-bold text-ink">Verification answers</h2>
          <p>
            When you report a find, you answer two system-generated questions only the true owner would know.
            Those answers are stored as salted hashes, not plain text. When someone submits a claim, their typed
            answers are shown only to the finder reviewing that claim — never made public.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-[16px] font-bold text-ink">Who can see what</h2>
          <p>
            Item listings (title, category, description, fuzzed location, photo) are public and visible without
            an account. A claimer&rsquo;s name and ID type/last-four are shown only to the finder of that specific
            item, only after a claim is submitted. Full ID numbers, exact locations, and answer hashes are never
            exposed publicly, at the database level.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-[16px] font-bold text-ink">Third-party services</h2>
          <p>
            We use OpenStreetMap for map tiles, an IP-lookup service to guess your approximate city so the map
            can center itself without asking for location permission, and Cloudflare R2 to store photos. Once a
            claim is approved, the finder contacts the claimer via a WhatsApp link — that conversation happens
            directly between you two; ReFind never sends messages on your behalf and isn&rsquo;t part of the
            handover.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-[16px] font-bold text-ink">Cookies</h2>
          <p>
            We use a single session cookie to keep you signed in. No advertising or analytics trackers.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-[16px] font-bold text-ink">Deleting your data</h2>
          <p>
            You can delete any of your own reports yourself, as long as it hasn&rsquo;t already been claimed and
            handed over. For anything else — including full account deletion — reach out and we&rsquo;ll handle it
            manually.
          </p>
        </section>
      </div>
    </main>
  );
}
