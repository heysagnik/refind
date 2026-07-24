import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getMyClaims } from '@/app/actions/claims';
import { Card, CardImage, CardBody } from '@/app/components/ui/Card';
import { Chip } from '@/app/components/ui/Chip';
import { Header } from '@/app/components/ui/Header';
import { EmptyState } from '@/app/components/ui/EmptyState';

const statusLabels: Record<string, string> = {
  pending_review: 'Awaiting finder review',
  approved: 'Approved — confirm handover',
  rejected: 'Claim rejected',
};

export default async function MyClaimsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/auth/login?redirect=/claims/my');

  const claims = await getMyClaims();

  return (
    <main className="flex-1 flex flex-col px-6 md:px-8 lg:px-10 py-6 max-w-[1040px] mx-auto w-full pb-24 md:pb-12">
      <Header title="My claims" />

      {claims.length === 0 ? (
        <EmptyState
          message="You haven&rsquo;t claimed anything yet."
          buttonLabel="Explore finds"
          buttonHref="/"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {claims.map((claim) => (
            <Link key={claim.id} href={`/claims/${claim.id}`}>
              <Card className="hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-200">
                {claim.itemImage && <CardImage src={claim.itemImage} alt={claim.itemTitle} />}
                <CardBody>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="font-bold text-[15px]">{claim.itemTitle}</h3>
                      <p className="text-xs text-ink-soft">{claim.itemCategory}</p>
                    </div>
                    <Chip label={claim.status} className="shrink-0" />
                  </div>

                  <p className="text-sm text-ink-soft mt-0.5">
                    {statusLabels[claim.status] || claim.status}
                  </p>

                  {claim.status === 'approved' && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className={`w-2 h-2 rounded-full ${claim.claimerConfirmed ? 'bg-success' : 'bg-bg border border-line'}`} />
                      <span className="text-xs font-medium text-ink-soft">
                        {claim.claimerConfirmed ? 'You confirmed ✓' : 'Confirm when you receive the item'}
                      </span>
                    </div>
                  )}
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}