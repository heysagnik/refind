'use client';

import dynamic from 'next/dynamic';
import type { MapItem } from './MapView';

const MapView = dynamic(() => import('./MapView').then((m) => m.MapView), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-bg" />,
});

interface Props {
  items: MapItem[];
  highlightedId?: string | null;
  onMarkerHover?: (id: string | null) => void;
  scrollWheelZoom?: boolean;
}

export function MapClient({ items, highlightedId, onMarkerHover, scrollWheelZoom }: Props) {
  return (
    <MapView
      items={items}
      highlightedId={highlightedId}
      onMarkerHover={onMarkerHover}
      scrollWheelZoom={scrollWheelZoom}
    />
  );
}
