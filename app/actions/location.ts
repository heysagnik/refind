'use server';

import { reverseGeocode } from '@/lib/location';

export async function reverseGeocodeAction(lat: number, lng: number): Promise<string> {
  return reverseGeocode(lat, lng);
}
