import { Header } from '@/app/components/ui/Header';

export default function TermsPage() {
  return (
    <main className="flex-1 flex flex-col px-6 md:px-8 lg:px-10 py-6 max-w-[720px] mx-auto w-full pb-24 md:pb-12">
      <Header title="Terms & Conditions" backHref="/" />

      <div className="flex flex-col gap-6 text-[15px] text-ink-soft leading-relaxed">
        <p className="text-xs text-ink-faint">
          Last updated {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}. Plain-language
          terms for a free community tool — not reviewed legal boilerplate.
        </p>

        <section className="flex flex-col gap-2">
          <h2 className="text-[16px] font-bold text-ink">What MilGaya is</h2>
          <p>
            MilGaya is a free tool for reporting and reclaiming lost items in your community. It connects finders
            and owners and helps verify a claim before contact is made. It doesn&rsquo;t charge for anything, and
            it isn&rsquo;t a courier, storage, or escrow service.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-[16px] font-bold text-ink">Your responsibilities</h2>
          <p>
            You&rsquo;re responsible for the accuracy of anything you post — item descriptions, verification
            answers, and claim details. Submitting a claim for an item that isn&rsquo;t yours, or reporting a find
            that doesn&rsquo;t exist, isn&rsquo;t allowed and may get your account suspended.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-[16px] font-bold text-ink">Handovers happen between you, not through us</h2>
          <p>
            Once a claim is approved, the finder and claimer coordinate return of the item directly over
            WhatsApp, at a time and place they agree on themselves. MilGaya isn&rsquo;t present for that exchange
            and can&rsquo;t guarantee it happens safely or at all — use the same judgment you would meeting anyone
            from the internet: pick a public place, and verify identity as far as you&rsquo;re comfortable with.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-[16px] font-bold text-ink">No guarantee of recovery</h2>
          <p>
            We help match reports to claims; we can&rsquo;t promise a lost item will ever be found, or that a
            found item will be reunited with its actual owner. The service is provided as-is, without warranty
            of any kind.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-[16px] font-bold text-ink">Account suspension</h2>
          <p>
            We may suspend or remove accounts or listings that are fraudulent, abusive, or otherwise misuse the
            service — including fake claims, harassment, or attempts to extract personal information from other
            users beyond what the claim flow already asks for.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-[16px] font-bold text-ink">Changes</h2>
          <p>
            These terms may change as the product does. Material changes will be reflected here with an updated
            date at the top of this page.
          </p>
        </section>
      </div>
    </main>
  );
}
