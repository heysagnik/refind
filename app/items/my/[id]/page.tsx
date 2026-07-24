import { redirect, notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getMyItemDetail } from '@/app/actions/items';
import { Card, CardBody } from '@/app/components/ui/Card';
import { Chip } from '@/app/components/ui/Chip';
import { Header } from '@/app/components/ui/Header';
import { PhotoGallery } from '@/app/components/PhotoGallery';
import { DeleteItemButton } from '@/app/components/DeleteItemButton';
import Link from 'next/link';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MyItemDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/auth/login?redirect=/items/my');

  const item = await getMyItemDetail(id);
  if (!item) notFound();

  const photos = item.imageUrls?.length ? item.imageUrls : item.imageUrl ? [item.imageUrl] : [];

  return (
    <main className="flex-1 flex flex-col px-6 md:px-8 lg:px-10 py-6 max-w-[640px] mx-auto w-full pb-24 md:pb-12">
      <Header title={item.title} backHref="/items/my" right={<Chip label={item.status} />} />

      {photos.length > 0 && (
        <div className="aspect-[4/3] w-full rounded-lg border border-line mb-6">
          <PhotoGallery images={photos} alt={item.title} className="w-full h-full rounded-lg" />
        </div>
      )}

      {item.description && (
        <p className="text-ink-soft mb-6 leading-relaxed">{item.description}</p>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="font-bold text-[16px]">
          Claims {item.claims.length > 0 && `(${item.claims.length})`}
        </h2>

        {item.claims.length === 0 ? (
          <div className="py-10 text-center text-ink-soft text-sm bg-surface rounded-lg border border-dashed border-line">
            No claims yet. When someone claims this, you&rsquo;ll see them here.
          </div>
        ) : (
          item.claims.map((claim) => {
            const completed = claim.finderConfirmed && claim.claimerConfirmed;
            return (
              <Card key={claim.id} className={completed ? '!border-success/30 bg-success-soft/40' : ''}>
                <CardBody>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">
                          {claim.claimer.displayName || 'Anonymous claimer'}
                        </span>
                        {completed && (
                          <Chip label="claimed" className="!bg-success-soft !text-success text-[11px] !px-2 !py-0.5" />
                        )}
                      </div>
                      {claim.claimer.docType && (
                        <div className="text-xs text-ink-soft mt-0.5">
                          {claim.claimer.docType.toUpperCase()} ending in {claim.claimer.docLastFour}
                        </div>
                      )}
                    </div>
                    <Chip label={claim.status} />
                  </div>

                  {claim.status === 'pending_review' && (
                    <div className="bg-bg rounded-md p-3 space-y-2 text-sm mb-3">
                      <div><span className="text-ink-soft">Q1:</span> {claim.answer1}</div>
                      <div><span className="text-ink-soft">Q2:</span> {claim.answer2}</div>
                    </div>
                  )}

                  {completed && claim.resolvedAt && (
                    <p className="text-xs text-success mt-1">
                      Resolved on {new Date(claim.resolvedAt).toLocaleDateString()}
                    </p>
                  )}

                  <div className="flex gap-2 mt-2">
                    <Link href={`/claims/${claim.id}`}>
                      <span className="text-sm text-accent font-semibold">
                        {claim.status === 'pending_review' ? 'Review claim' : 'View details'}
                      </span>
                    </Link>
                  </div>
                </CardBody>
              </Card>
            );
          })
        )}
      </section>

      <section className="border-t border-line mt-8 pt-6">
        {item.status === 'active' ? (
          <DeleteItemButton itemId={item.id} />
        ) : (
          <p className="text-xs text-ink-faint">
            This report can&rsquo;t be deleted once a claim has been approved or completed.
          </p>
        )}
      </section>
    </main>
  );
}