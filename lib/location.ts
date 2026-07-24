export interface City {
  name: string;
  lat: number;
  lng: number;
}

export const POPULAR_CITIES: City[] = [
  { name: 'Delhi NCR', lat: 28.6139, lng: 77.209 },
  { name: 'Mumbai', lat: 19.076, lng: 72.8777 },
  { name: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
  { name: 'Hyderabad', lat: 17.385, lng: 78.4867 },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
  { name: 'Pune', lat: 18.5204, lng: 73.8567 },
  { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
];

const cache = new Map<string, string>();

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (cache.has(key)) return cache.get(key)!;

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=13&addressdetails=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "ReFind/1.0 (community lost-and-found)" },
    });
    if (!res.ok) throw new Error("Nominatim failed");

    const data = await res.json();
    const address = data.address || {};
    const name =
      address.suburb ||
      address.neighbourhood ||
      address.village ||
      address.town ||
      address.city_district ||
      address.city ||
      address.state_district ||
      address.county ||
      address.state ||
      address.country ||
      "Unknown location";

    cache.set(key, name);
    return name;
  } catch {
    cache.set(key, "Unknown location");
    return "Unknown location";
  }
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function fuzzCoordinate(lat: number, lng: number): { lat: number; lng: number } {
  const radiusInMeters = 150;
  const angle = Math.random() * 2 * Math.PI;

  const latOffset = (radiusInMeters / 111000) * Math.sin(angle);
  const lngOffset = ((radiusInMeters / 111000) * Math.cos(angle)) / Math.cos((lat * Math.PI) / 180);

  return {
    lat: Number((lat + latOffset).toFixed(6)),
    lng: Number((lng + lngOffset).toFixed(6)),
  };
}