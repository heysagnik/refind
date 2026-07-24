import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { headers } from 'next/headers';
import { profiles } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { getMyItems } from '@/app/actions/items';
import { getMyClaims } from '@/app/actions/claims';
import { Card, CardBody } from '@/app/components/ui/Card';
import { Chip } from '@/app/components/ui/Chip';
import { Header } from '@/app/components/ui/Header';
import { EmptyState } from '@/app/components/ui/EmptyState';
import { LogoutButton } from '@/app/components/LogoutButton';
import Link from 'next/link';
import { categoryLabels } from '@/lib/questions';

const docTypeLabels: Record<string, string> = {
  aadhaar: 'Aadhaar',
  dl: 'Driving Licence',
  passport: 'Passport',
  voter: 'Voter ID',
  other: 'Other document',
};

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/auth/login?redirect=/profile');

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, session.user.id));

  const [myItems, myClaims] = await Promise.all([
    getMyItems(),
    getMyClaims(),
  ]);

  return (
    <main className="flex-1 flex flex-col px-6 md:px-8 lg:px-10 py-6 max-w-[960px] mx-auto w-full pb-24 md:pb-12">
      <Header title="You" />

      <Card className="mb-8 lg:max-w-[560px] !shadow-elevated">
        <CardBody>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-full bg-accent-soft text-accent flex items-center justify-center text-2xl font-bold shrink-0">
                {(session.user.name?.[0] || '?').toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-lg">{profile?.displayName || session.user.name || 'You'}</div>
                <div className="text-sm text-ink-soft truncate">{session.user.email}</div>
              </div>
            </div>
            {profile?.whatsappNumber && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-soft">
                <span>WhatsApp: {profile.whatsappNumber}</span>
              </div>
            )}
            {profile?.docType && (
              <div className="text-sm text-ink-soft">
                Verified with: {docTypeLabels[profile.docType] || profile.docType.toUpperCase()}
                {profile.docLastFour && ` (ending in ${profile.docLastFour})`}
              </div>
            )}
            <div className="flex items-center gap-4">
              <Link href="/profile/edit" className="text-sm text-accent font-semibold w-fit">
                Edit profile
              </Link>
              <LogoutButton />
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start">
      <section className="mb-8 lg:mb-0">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-bold text-lg">My reported items ({myItems.length})</h2>
          <Link href="/items/my" className="text-sm text-accent font-semibold">See all</Link>
        </div>

        {myItems.length === 0 ? (
          <EmptyState
            message="No reported items. Be the first to report a find."
            buttonLabel="Report a find"
            buttonHref="/items/new"
          />
        ) : (
          <div className="flex flex-col gap-3">
            {myItems.slice(0, 3).map((item) => (
              <Link key={item.id} href={`/items/my/${item.id}`}>
                <Card className="hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-200">
                  <div className="flex">
                    {item.imageUrl && (
                      <div className="w-20 h-20 shrink-0 bg-bg">
                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <CardBody className="flex-1 flex flex-col justify-center">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-[15px] truncate">{item.title}</h3>
                          <p className="text-xs text-ink-soft mt-0.5">
                            {categoryLabels[item.category] || item.category}
                          </p>
                        </div>
                        <Chip label={item.status} />
                      </div>
                      {item.pendingClaims > 0 && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <div className="w-2 h-2 rounded-full bg-accent-warm" />
                          <span className="text-xs font-semibold text-accent-warm">
                            {item.pendingClaims} pending
                          </span>
                        </div>
                      )}
                    </CardBody>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-bold text-lg">My claims ({myClaims.length})</h2>
          <Link href="/claims/my" className="text-sm text-accent font-semibold">See all</Link>
        </div>

        {myClaims.length === 0 ? (
          <EmptyState
            message="No claims made yet. Explore finds near you."
            buttonLabel="Explore finds"
            buttonHref="/"
          />
        ) : (
          <div className="flex flex-col gap-3">
            {myClaims.slice(0, 3).map((claim) => (
              <Link key={claim.id} href={`/claims/${claim.id}`}>
                <Card className="hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-200">
                  <div className="flex">
                    {claim.itemImage && (
                      <div className="w-20 h-20 shrink-0 bg-bg">
                        <img src={claim.itemImage} alt={claim.itemTitle} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <CardBody className="flex-1 flex flex-col justify-center">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-[15px] truncate">{claim.itemTitle}</h3>
                          <p className="text-xs text-ink-soft mt-0.5">{claim.itemCategory}</p>
                        </div>
                        <Chip label={claim.status} />
                      </div>
                    </CardBody>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
      </div>
    </main>
  );
}