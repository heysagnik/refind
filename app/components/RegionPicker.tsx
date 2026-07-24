'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { PinIcon, ChevronDownIcon, CloseIcon } from '@/app/components/icons';
import { POPULAR_CITIES } from '@/lib/location';
import { reverseGeocodeAction } from '@/app/actions/location';

const STORAGE_KEY = 'refind:location';

interface StoredLocation {
  lat: number;
  lng: number;
  city: string;
}

function readStoredLocation(): StoredLocation | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed.lat === 'number' && typeof parsed.lng === 'number') return parsed;
    return null;
  } catch {
    return null;
  }
}

// IP-based lookup, called directly from the browser rather than routed
// through our own server: that way it resolves the visitor's actual public
// IP (works correctly in local dev too, since the request truly leaves from
// their machine), and it needs no permission prompt at all — unlike
// navigator.geolocation, which is reserved for the explicit "Use current
// location" button below.
async function ipGeolocate(): Promise<StoredLocation | null> {
  try {
    const res = await fetch('https://ipwho.is/');
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.success || typeof data.latitude !== 'number' || typeof data.longitude !== 'number') return null;
    const city = data.city || data.region || data.country || '';
    return { lat: data.latitude, lng: data.longitude, city };
  } catch {
    return null;
  }
}

interface Props {
  compact?: boolean;
}

export function RegionPicker({ compact = false }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stored, setStored] = useState<StoredLocation | null>(null);
  const autoTriedRef = useRef(false);

  // On the Explore page itself, the URL query params are the source of
  // truth (so server-side data fetching and the picker agree). On every
  // other page there's nothing to filter, so fall back to the last location
  // the person picked, persisted client-side, purely for display.
  const urlLat = searchParams.get('lat');
  const urlLng = searchParams.get('lng');
  const urlCity = searchParams.get('city');
  const onExploreWithLocation = pathname === '/' && urlLat && urlLng;

  const current: StoredLocation | null = onExploreWithLocation
    ? { lat: parseFloat(urlLat!), lng: parseFloat(urlLng!), city: urlCity || '' }
    : stored;

  // Runs once on mount (client-only — `localStorage`/geolocation don't exist
  // during SSR, so this can't be a lazy useState initializer without either
  // crashing server-side or causing a server/client hydration mismatch).
  useEffect(() => {
    const existing = readStoredLocation();
    if (existing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStored(existing);
      return;
    }

    // First visit with nothing saved yet: silently detect an approximate
    // location by IP instead of leaving the picker on a generic placeholder.
    // No permission prompt — see ipGeolocate() above. A failed lookup just
    // leaves the picker on "Set location", same as before.
    if (onExploreWithLocation || autoTriedRef.current) return;
    autoTriedRef.current = true;
    ipGeolocate().then((loc) => {
      if (!loc) return;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
      setStored(loc);
      if (pathname === '/') {
        router.replace(`/?lat=${loc.lat}&lng=${loc.lng}&city=${encodeURIComponent(loc.city)}`);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (onExploreWithLocation) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ lat: parseFloat(urlLat!), lng: parseFloat(urlLng!), city: urlCity || '' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlLat, urlLng, urlCity]);

  const active = !!current;

  function goTo(lat: number, lng: number, city: string) {
    setOpen(false);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ lat, lng, city }));
    setStored({ lat, lng, city });
    router.push(`/?lat=${lat}&lng=${lng}&city=${encodeURIComponent(city)}`);
  }

  function clear() {
    setOpen(false);
    localStorage.removeItem(STORAGE_KEY);
    setStored(null);
    router.push('/');
  }

  function useCurrentLocation() {
    setError(null);
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError("Your browser doesn't support location access.");
      return;
    }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const name = await reverseGeocodeAction(latitude, longitude);
        setDetecting(false);
        goTo(latitude, longitude, name);
      },
      () => {
        setDetecting(false);
        setError("Couldn't access your location.");
      }
    );
  }

  const label = active ? current!.city || 'Near me' : 'Set location';

  return (
    <div className="relative shrink-0 min-w-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 rounded-pill min-w-0 transition-all duration-150 active:scale-[0.98] cursor-pointer ${
          compact ? 'px-3 py-1.5 text-[12.5px] font-semibold' : 'pl-3.5 pr-3 py-2.5 text-[14px] font-semibold shadow-card border'
        } ${
          active
            ? compact
              ? 'bg-accent-soft text-accent'
              : 'bg-ink text-white border-ink hover:opacity-90'
            : compact
              ? 'bg-bg text-ink-soft'
              : 'bg-surface text-ink border-line hover:border-line-strong hover:shadow-elevated'
        }`}
      >
        <PinIcon className={compact ? 'w-3.5 h-3.5 shrink-0' : 'w-4 h-4 shrink-0'} />
        <span className="truncate max-w-[110px]">{label}</span>
        <ChevronDownIcon
          className={`shrink-0 transition-transform duration-150 ${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} ${open ? 'rotate-180' : ''} ${
            active && !compact ? 'text-white/70' : 'text-ink-soft'
          }`}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-1/2 -translate-x-1/2 top-[calc(100%+8px)] w-[min(288px,calc(100vw-32px))] bg-surface rounded-md border border-line shadow-elevated overflow-hidden z-50">
            {active && (
              <button
                type="button"
                onClick={clear}
                className="flex items-center gap-2.5 w-full text-left px-4 py-3 text-[14px] font-semibold text-ink-soft hover:bg-bg transition-colors cursor-pointer border-b border-line"
              >
                <CloseIcon className="w-4 h-4" />
                Clear location
              </button>
            )}

            <button
              type="button"
              onClick={useCurrentLocation}
              disabled={detecting}
              className="flex items-center gap-2.5 w-full text-left px-4 py-3 text-[14px] font-semibold text-accent hover:bg-accent-soft/40 transition-colors cursor-pointer disabled:opacity-60"
            >
              <PinIcon className="w-4 h-4" />
              {detecting ? 'Locating…' : 'Use current location'}
            </button>
            {error && <p className="px-4 pb-2 text-xs text-danger -mt-1">{error}</p>}

            <div className="px-4 pt-2.5 pb-1.5 text-[11px] font-bold text-ink-faint uppercase tracking-wide border-t border-line">
              Popular cities
            </div>
            <div className="max-h-64 overflow-y-auto pb-1">
              {POPULAR_CITIES.map((city) => (
                <button
                  key={city.name}
                  type="button"
                  onClick={() => goTo(city.lat, city.lng, city.name)}
                  className={`flex items-center justify-between w-full text-left px-4 py-2.5 text-[14px] font-medium hover:bg-bg transition-colors cursor-pointer ${
                    current?.city === city.name ? 'text-accent font-semibold' : 'text-ink'
                  }`}
                >
                  {city.name}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
