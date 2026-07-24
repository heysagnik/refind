import { getPublicItems, getItemStats } from '@/app/actions/items';
import { ExploreView } from '@/app/components/ExploreView';

interface Props {
  searchParams: Promise<{ lat?: string; lng?: string; city?: string }>;
}

export default async function HomePage({ searchParams }: Props) {
  const params = await searchParams;
  const lat = params.lat ? parseFloat(params.lat) : undefined;
  const lng = params.lng ? parseFloat(params.lng) : undefined;
  const city = params.city;
  const isNearby = !!(lat && lng);
  const radiusKm = 25;

  const [{ items: allItems, hasMore }, { activeCount, resolvedCount }] = await Promise.all([
    getPublicItems({ lat, lng, radiusKm }),
    getItemStats(),
  ]);

  return (
    <main className="flex flex-col flex-1">
      <header className="px-6 md:px-8 lg:px-10 pt-8 md:pt-14 pb-8 md:pb-10 max-w-[1440px] mx-auto w-full">
        <div className="md:flex md:items-end md:justify-between md:gap-8">
          <div>
            <h1 className="text-[36px] md:text-[52px] font-extrabold tracking-tight leading-[1.04] max-w-[640px]">
              Lost something? Someone might have found it.
            </h1>
            <p className="text-ink-soft text-base md:text-lg max-w-[480px] mt-4">
              {isNearby
                ? `Browse reported finds near ${city || 'you'}. If yours is here, claim it by answering two quick questions.`
                : 'Browse reported finds. If yours is here, claim it by answering two quick questions.'}
            </p>
          </div>

          <div className="hidden md:flex items-center gap-6 shrink-0 pb-1">
            <div className="flex flex-col items-start">
              <span className="text-[28px] font-extrabold tracking-tight text-ink">{activeCount}</span>
              <span className="text-[13px] font-semibold text-ink-soft">Active finds</span>
            </div>
            <div className="w-px h-10 bg-line" />
            <div className="flex flex-col items-start">
              <span className="text-[28px] font-extrabold tracking-tight text-success">{resolvedCount}</span>
              <span className="text-[13px] font-semibold text-ink-soft">Reunited</span>
            </div>
          </div>
        </div>
      </header>

      <ExploreView
        initialItems={allItems}
        initialHasMore={hasMore}
        lat={lat}
        lng={lng}
        radiusKm={radiusKm}
      />
    </main>
  );
}
