'use server';

import { reverseGeocode } from '@/lib/location';

export async function reverseGeocodeAction(lat: number, lng: number): Promise<string> {
  return reverseGeocode(lat, lng);
}

export interface LocationSearchResult {
  lat: number;
  lng: number;
  name: string;
}

export async function searchLocationAction(query: string): Promise<LocationSearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=6&addressdetails=1`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'ReFind/1.0 (community lost-and-found)' },
    });
    if (!res.ok) return [];

    const data = await res.json();
    return data.map((d: { lat: string; lon: string; display_name: string }) => ({
      lat: parseFloat(d.lat),
      lng: parseFloat(d.lon),
      name: d.display_name.split(',').slice(0, 3).join(',').trim(),
    }));
  } catch {
    return [];
  }
}
