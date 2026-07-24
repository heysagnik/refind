import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getItemByIdPublic } from '@/app/actions/items';
import { Chip } from '@/app/components/ui/Chip';
import { Card, CardBody } from '@/app/components/ui/Card';
import { ClaimForm } from '@/app/components/ClaimForm';
import { MapClient } from '@/app/components/MapClient';
import { PhotoGallery } from '@/app/components/PhotoGallery';
import { BackIcon, CheckIcon } from '@/app/components/icons';
import { categoryLabels } from '@/lib/questions';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ItemDetailPage({ params }: Props) {
  const { id } = await params;
  const item = await getItemByIdPublic(id);
  if (!item) notFound();

  const categoryLabel = categoryLabels[item.category] ?? item.category;
  const photos = item.imageUrls?.length ? item.imageUrls : item.imageUrl ? [item.imageUrl] : [];

  return (
    <main className="flex-1 flex flex-col pb-16">
      {/* Mobile hero photo with floating controls */}
      {photos.length > 0 && (
        <div className="relative lg:hidden aspect-[4/3] w-full">
          <PhotoGallery images={photos} alt={item.title} className="w-full h-full" />
          <Link
            href="/"
            aria-label="Back"
            className="absolute top-4 left-4 flex items-center justify-center w-10 h-10 rounded-full bg-surface/90 backdrop-blur-md shadow-floating text-ink z-10"
          >
            <BackIcon className="w-5 h-5" />
          </Link>
          <span className="absolute top-4 right-4 inline-flex items-center rounded-pill px-3 py-1.5 text-[12px] font-bold bg-surface/90 backdrop-blur-md shadow-floating text-ink z-10">
            {categoryLabel}
          </span>
        </div>
      )}

      <div className="max-w-[1100px] mx-auto w-full px-6 md:px-8 lg:px-10">
        <Link
          href="/"
          className="hidden lg:inline-flex items-center gap-2 text-[14px] font-semibold text-ink-soft hover:text-ink mt-8 mb-2 transition-colors"
        >
          <BackIcon className="w-4 h-4" />
          Back to browse
        </Link>

        <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-12 lg:items-start lg:mt-6">
          <div className="flex flex-col gap-6 min-w-0 pt-6 lg:pt-0">
            {photos.length > 0 && (
              <div className="hidden lg:block relative rounded-xl overflow-hidden border border-line aspect-[4/3]">
                <PhotoGallery images={photos} alt={item.title} className="w-full h-full" />
                <span className="absolute top-4 left-4 inline-flex items-center rounded-pill px-3 py-1.5 text-[12px] font-bold bg-surface/90 backdrop-blur-md shadow-floating text-ink z-10">
                  {categoryLabel}
                </span>
              </div>
            )}

            <div>
              <h1 className="text-[26px] md:text-[30px] font-extrabold tracking-tight leading-tight">{item.title}</h1>
              {item.locationName && (
                <p className="text-sm text-ink-soft mt-1.5">📍 {item.locationName}</p>
              )}
            </div>

            {item.description && (
              <p className="text-ink-soft text-base leading-relaxed">{item.description}</p>
            )}

            <div>
              <div className="h-[220px] md:h-[260px] rounded-lg overflow-hidden border border-line">
                <MapClient
                  items={[{ id: item.id, title: item.title, category: item.category, lat: item.lat, lng: item.lng, imageUrl: item.imageUrl }]}
                />
              </div>
              <p className="text-xs text-ink-faint mt-2">Approximate location · exact position is hidden for privacy</p>
            </div>

            {item.claims && item.claims.length > 0 && (
              <div className="border-t border-line pt-6">
                <h2 className="font-bold text-[15px] mb-3">Claims ({item.claims.length})</h2>
                <div className="space-y-2.5">
                  {item.claims.map((claim) => {
                    const completed = claim.finderConfirmed && claim.claimerConfirmed;
                    return (
                      <div
                        key={claim.id}
                        className={`flex items-start justify-between gap-3 p-3.5 rounded-md border ${
                          completed ? 'border-success/30 bg-success-soft/50' : 'border-line bg-surface'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">{claim.claimerName || 'Anonymous'}</span>
                            {completed && (
                              <Chip label="claimed" className="!bg-success-soft !text-success text-[11px] !px-2 !py-0.5" />
                            )}
                          </div>
                          {!completed && claim.status === 'pending_review' && (
                            <span className="text-xs text-ink-soft">Awaiting finder review</span>
                          )}
                          {!completed && claim.status === 'approved' && (
                            <span className="text-xs text-accent-warm">Handover in progress</span>
                          )}
                          {completed && (
                            <span className="text-xs text-success">Item returned to owner</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Claim panel — sticky on desktop, inline on mobile */}
          <div className="mt-8 lg:mt-0 lg:sticky lg:top-[96px]">
            {item.status === 'active' && (
              <Card className="!shadow-elevated">
                <CardBody className="!p-5">
                  <h2 className="text-[18px] font-bold mb-1">Think this is yours?</h2>
                  <p className="text-ink-soft text-sm mb-5">Answer two short questions to claim it.</p>
                  <ClaimForm itemId={item.id} question1={item.question1} question2={item.question2} />
                </CardBody>
              </Card>
            )}

            {item.status === 'claimed' && (
              <Card className="!shadow-card !border-warning-soft bg-warning-soft/40">
                <CardBody className="!p-5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-accent-warm flex items-center justify-center text-white text-sm font-bold shrink-0">✓</div>
                  <span className="font-semibold text-ink text-[14px]">Someone has claimed this. Handover in progress.</span>
                </CardBody>
              </Card>
            )}

            {item.status === 'closed' && (
              <Card className="!shadow-card !border-success/20 bg-success-soft/40">
                <CardBody className="!p-5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-success flex items-center justify-center text-white shrink-0">
                    <CheckIcon className="w-5 h-5" />
                  </div>
                  <span className="font-semibold text-success text-[14px]">Item returned. Reunited!</span>
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
