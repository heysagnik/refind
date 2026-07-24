'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

function makeIcon(active: boolean) {
  const size = active ? 38 : 30;
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width: ${size}px; height: ${size}px;
        background: ${active ? '#1D4ED8' : '#2563EB'};
        border: 3px solid #FFFFFF;
        border-radius: 999px 999px 999px 2px;
        transform: rotate(45deg);
        box-shadow: 0 2px 8px rgba(0,0,0,${active ? 0.35 : 0.28});
        transition: width 0.15s, height 0.15s;
      "></div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size - 2],
    popupAnchor: [0, -size + 4],
  });
}

const defaultIcon = makeIcon(false);
const activeIcon = makeIcon(true);

function FitBounds({ items }: { items: MapItem[] }) {
  const map = useMap();

  useEffect(() => {
    if (items.length < 2) return;
    const bounds = L.latLngBounds(items.map((item) => [item.lat, item.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 });
  }, [items, map]);

  return null;
}

export interface MapItem {
  id: string;
  title: string;
  category: string;
  lat: number;
  lng: number;
  imageUrl: string;
}

interface Props {
  items: MapItem[];
  highlightedId?: string | null;
  onMarkerHover?: (id: string | null) => void;
  scrollWheelZoom?: boolean;
}

export function MapView({ items, highlightedId, onMarkerHover, scrollWheelZoom = false }: Props) {
  const center: [number, number] = items[0]
    ? [items[0].lat, items[0].lng]
    : [28.7041, 77.1025];

  return (
    <MapContainer
      center={center}
      zoom={13}
      className="relative z-0"
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={scrollWheelZoom}
      touchZoom
    >
      <TileLayer
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds items={items} />
      {items.map((item) => (
        <Marker
          key={item.id}
          position={[item.lat, item.lng]}
          icon={item.id === highlightedId ? activeIcon : defaultIcon}
          eventHandlers={
            onMarkerHover
              ? {
                  mouseover: () => onMarkerHover(item.id),
                  mouseout: () => onMarkerHover(null),
                }
              : undefined
          }
        >
          <Popup>
            <a href={`/items/${item.id}`} className="font-bold text-[14px] text-ink no-underline">
              {item.title}
            </a>
            <div className="text-xs text-ink-soft mt-0.5">{item.category}</div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
