import { redirect, notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getClaimReview } from '@/app/actions/claims';
import { answerMatchLevel } from '@/lib/text';
import { Card, CardImage, CardBody } from '@/app/components/ui/Card';
import { Chip } from '@/app/components/ui/Chip';
import { Header } from '@/app/components/ui/Header';
import { ClaimActions, WhatsAppLink } from '@/app/components/ClaimActions';
import { CheckIcon } from '@/app/components/icons';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ClaimReviewPage({ params }: Props) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect(`/auth/login?redirect=/claims/${id}`);

  const claim = await getClaimReview(id);
  if (!claim) notFound();

  const role = session.user.id === claim.item.finderId ? 'finder' : 'claimer';
  const completed = claim.finderConfirmed && claim.claimerConfirmed;

  return (
    <main className="flex-1 flex flex-col px-6 md:px-8 lg:px-10 py-6 max-w-[640px] mx-auto w-full pb-24 md:pb-12">
      <Header title="Claim review" backHref="/" right={<Chip label={claim.status} />} />

      <Card className="mb-6">
        {claim.item.imageUrl && <CardImage src={claim.item.imageUrl} alt={claim.item.title} />}
        <CardBody>
          <h3 className="font-bold text-[15px]">{claim.item.title}</h3>
          <p className="text-sm text-ink-soft">{claim.item.category}</p>
        </CardBody>
      </Card>

      {role === 'finder' && (
        <section className="flex flex-col gap-2 mb-6">
          <h2 className="text-[13px] font-bold text-ink-soft uppercase tracking-wide">Claimer&rsquo;s answers</h2>
          <div className="bg-bg rounded-md p-4 space-y-3">
            {([
              [claim.item.questions?.[0], claim.answer1, claim.item.referenceAnswers?.[0]],
              [claim.item.questions?.[1], claim.answer2, claim.item.referenceAnswers?.[1]],
            ] as const).map(([question, claimerAnswer, referenceAnswer], i) => {
              const match = referenceAnswer ? answerMatchLevel(referenceAnswer, claimerAnswer) : 'different';
              return (
                <div key={i}>
                  <div className="text-xs text-ink-soft">Q: {question || `Question ${i + 1}`}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="text-base font-medium">{claimerAnswer}</div>
                    {match !== 'different' && (
                      <Chip
                        label={match === 'exact' ? 'Matches' : 'Similar'}
                        className={match === 'exact' ? '!bg-success-soft !text-success text-[11px] !px-2 !py-0.5' : '!bg-warning-soft !text-accent-warm text-[11px] !px-2 !py-0.5'}
                      />
                    )}
                  </div>
                  {referenceAnswer && (
                    <div className="text-xs text-ink-faint mt-1">Your answer: {referenceAnswer}</div>
                  )}
                </div>
              );
            })}
          </div>

          <section className="flex flex-col gap-2 mt-4">
            <h2 className="text-[13px] font-bold text-ink-soft uppercase tracking-wide">Identity verified</h2>
            <div className="bg-bg rounded-md p-4">
              <div className="text-base font-semibold">{claim.claimer.displayName || 'Anonymous'}</div>
              {claim.claimer.docType && (
                <div className="text-sm text-ink-soft mt-1">
                  {claim.claimer.docType.toUpperCase()} — ending in {claim.claimer.docLastFour}
                </div>
              )}
            </div>
          </section>
        </section>
      )}

      {role === 'claimer' && (
        <section className="flex flex-col gap-2 mb-6">
          <h2 className="text-[13px] font-bold text-ink-soft uppercase tracking-wide">Your answers</h2>
          <div className="bg-bg rounded-md p-4 space-y-3">
            <div>
              <div className="text-xs text-ink-soft">Your response 1</div>
              <div className="text-base mt-0.5 font-medium">{claim.answer1}</div>
            </div>
            <div>
              <div className="text-xs text-ink-soft">Your response 2</div>
              <div className="text-base mt-0.5 font-medium">{claim.answer2}</div>
            </div>
          </div>
        </section>
      )}

      {completed && (
        <div className="flex items-center gap-3 p-4 rounded-md bg-success-soft mb-6">
          <div className="w-9 h-9 rounded-full bg-success flex items-center justify-center text-white shrink-0">
            <CheckIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-success text-[14px]">Handover complete</div>
            <div className="text-sm text-success/80">Item returned to its owner</div>
          </div>
        </div>
      )}

      <section className="mt-auto pt-4">
        {claim.status === 'approved' && !completed && (
          <div className="mb-4">
            {role === 'finder' ? (
              <WhatsAppLink number={claim.claimer.whatsappNumber} itemTitle={claim.item.title} role="finder" />
            ) : (
              <WhatsAppLink number={claim.item.finderWhatsappNumber} itemTitle={claim.item.title} role="claimer" />
            )}
          </div>
        )}
        {!completed && (
          <ClaimActions
            claimId={claim.claimId}
            status={claim.status}
            finderConfirmed={claim.finderConfirmed}
            claimerConfirmed={claim.claimerConfirmed}
            role={role}
          />
        )}
      </section>
    </main>
  );
}