'use client';

import { useState } from 'react';
import { MapClient } from '@/app/components/MapClient';
import { ItemCard, CardItem } from '@/app/components/ItemCard';
import { EmptyState } from '@/app/components/ui/EmptyState';
import { getPublicItems } from '@/app/actions/items';

interface Props {
  initialItems: CardItem[];
  initialHasMore: boolean;
  lat?: number;
  lng?: number;
  radiusKm: number;
}

function LoadMoreButton({ hasMore, loading, onClick }: { hasMore: boolean; loading: boolean; onClick: () => void }) {
  if (!hasMore) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="self-center rounded-pill px-6 py-3 bg-surface border border-line text-[14px] font-semibold text-ink hover:border-line-strong hover:shadow-card active:scale-[0.98] transition-all duration-150 disabled:opacity-50 cursor-pointer"
    >
      {loading ? 'Loading…' : 'Load more'}
    </button>
  );
}

export function ExploreView({ initialItems, initialHasMore, lat, lng, radiusKm }: Props) {
  const [items, setItems] = useState(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  async function loadMore() {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const { items: nextItems, hasMore: nextHasMore } = await getPublicItems({ lat, lng, radiusKm, page });
      setItems((prev) => [...prev, ...nextItems]);
      setHasMore(nextHasMore);
      setPage((p) => p + 1);
    } finally {
      setLoadingMore(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="px-6 md:px-8 lg:px-10 pb-16 max-w-[1440px] mx-auto w-full">
        <EmptyState
          message="No items reported yet. Be the first one."
          buttonLabel="Report a find"
          buttonHref="/items/new"
        />
      </div>
    );
  }

  const activeItems = items.filter((i) => i.status === 'active');
  const heading = lat !== undefined && lng !== undefined ? 'Finds near you' : 'Recently reported';

  return (
    <div className="flex flex-col gap-8 px-6 md:px-8 lg:px-10 pb-16 max-w-[1440px] mx-auto w-full">
      {activeItems.length > 0 ? (
        <div className="w-full h-[240px] sm:h-[320px] md:h-[400px] rounded-xl overflow-hidden border border-line shadow-elevated">
          <MapClient items={activeItems} highlightedId={hoveredId} onMarkerHover={setHoveredId} scrollWheelZoom />
        </div>
      ) : (
        <div className="w-full h-[180px] rounded-xl border border-line bg-bg flex items-center justify-center text-ink-faint text-sm font-medium">
          No active finds to show on the map yet
        </div>
      )}

      <div className="flex flex-col gap-6">
        <div className="flex items-baseline gap-3">
          <h2 className="text-[20px] font-bold">{heading}</h2>
          <span className="text-[13px] text-ink-soft font-semibold bg-bg px-2.5 py-0.5 rounded-pill">
            {items.length}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              highlighted={hoveredId === item.id}
              onHoverStart={() => setHoveredId(item.id)}
              onHoverEnd={() => setHoveredId(null)}
            />
          ))}
        </div>

        <LoadMoreButton hasMore={hasMore} loading={loadingMore} onClick={loadMore} />
      </div>
    </div>
  );
}
