import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getMyItems } from '@/app/actions/items';
import { Card, CardImage, CardBody } from '@/app/components/ui/Card';
import { Chip } from '@/app/components/ui/Chip';
import { Header } from '@/app/components/ui/Header';
import { EmptyState } from '@/app/components/ui/EmptyState';

export default async function MyItemsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/auth/login?redirect=/items/my');

  const items = await getMyItems();

  return (
    <main className="flex-1 flex flex-col px-6 md:px-8 lg:px-10 py-6 max-w-[1040px] mx-auto w-full pb-24 md:pb-12">
      <Header title="My reported items" />

      {items.length === 0 ? (
        <EmptyState
          message="You haven&rsquo;t reported anything yet."
          buttonLabel="Report a find"
          buttonHref="/items/new"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <Link key={item.id} href={`/items/my/${item.id}`}>
              <Card className="hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-200">
                {item.imageUrl && <CardImage src={item.imageUrl} alt={item.title} />}
                <CardBody>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-bold text-[15px] truncate">{item.title}</h3>
                    <Chip label={item.status} className="shrink-0" />
                  </div>
                  {item.pendingClaims > 0 && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-2 h-2 rounded-full bg-accent-warm" />
                      <span className="text-xs font-semibold text-accent-warm">
                        {item.pendingClaims} claim{item.pendingClaims > 1 ? 's' : ''} awaiting review
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