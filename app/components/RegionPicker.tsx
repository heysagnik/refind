'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { PinIcon, ChevronDownIcon, CloseIcon, SearchIcon } from '@/app/components/icons';
import { POPULAR_CITIES } from '@/lib/location';
import { reverseGeocodeAction, searchLocationAction, type LocationSearchResult } from '@/app/actions/location';

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
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const autoTriedRef = useRef(false);

  const urlLat = searchParams.get('lat');
  const urlLng = searchParams.get('lng');
  const urlCity = searchParams.get('city');
  const onExploreWithLocation = pathname === '/' && urlLat && urlLng;

  const current: StoredLocation | null = onExploreWithLocation
    ? { lat: parseFloat(urlLat!), lng: parseFloat(urlLng!), city: urlCity || '' }
    : stored;

  useEffect(() => {
    const existing = readStoredLocation();
    if (existing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStored(existing);
      return;
    }

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

  useEffect(() => {
    if (query.trim().length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const handle = setTimeout(async () => {
      const found = await searchLocationAction(query);
      setResults(found);
      setSearching(false);
    }, 400);
    return () => clearTimeout(handle);
  }, [query]);

  const active = !!current;

  function goTo(lat: number, lng: number, city: string) {
    setOpen(false);
    setQuery('');
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ lat, lng, city }));
    setStored({ lat, lng, city });
    router.push(`/?lat=${lat}&lng=${lng}&city=${encodeURIComponent(city)}`);
  }

  function clear() {
    setOpen(false);
    setQuery('');
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

      {open && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-[440px] max-h-[80vh] bg-surface rounded-xl border border-line shadow-elevated overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
              <h2 className="text-[16px] font-bold">Choose a location</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-bg text-ink-soft cursor-pointer transition-colors"
              >
                <CloseIcon className="w-[18px] h-[18px]" />
              </button>
            </div>

            <div className="flex flex-col gap-1 p-4 overflow-y-auto">
              <div className="relative mb-2">
                <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for a city or place"
                  autoFocus
                  className="w-full bg-bg border border-transparent focus:border-accent focus:bg-surface rounded-md pl-10 pr-4 py-3 text-[15px] text-ink placeholder:text-ink-faint focus:outline-none focus:ring-4 focus:ring-accent-soft/60 transition-all duration-150"
                />
              </div>

              {active && (
                <button
                  type="button"
                  onClick={clear}
                  className="flex items-center gap-2.5 w-full text-left px-1 py-2.5 text-[14px] font-semibold text-ink-soft hover:text-ink transition-colors cursor-pointer"
                >
                  <CloseIcon className="w-4 h-4" />
                  Clear location
                </button>
              )}

              <button
                type="button"
                onClick={useCurrentLocation}
                disabled={detecting}
                className="flex items-center gap-2.5 w-full text-left px-1 py-2.5 text-[14px] font-semibold text-accent hover:text-accent-hover transition-colors cursor-pointer disabled:opacity-60"
              >
                <PinIcon className="w-4 h-4" />
                {detecting ? 'Locating…' : 'Use current location'}
              </button>
              {error && <p className="px-1 pb-1 text-xs text-danger">{error}</p>}

              {query.trim().length >= 2 ? (
                <>
                  <div className="px-1 pt-3 pb-1 text-[11px] font-bold text-ink-faint uppercase tracking-wide">
                    {searching ? 'Searching…' : results.length === 0 ? 'No matches' : 'Results'}
                  </div>
                  {results.map((r, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => goTo(r.lat, r.lng, r.name)}
                      className="text-left px-1 py-2.5 text-[14px] font-medium text-ink hover:bg-bg rounded-md transition-colors cursor-pointer"
                    >
                      {r.name}
                    </button>
                  ))}
                </>
              ) : (
                <>
                  <div className="px-1 pt-3 pb-1 text-[11px] font-bold text-ink-faint uppercase tracking-wide">
                    Popular cities
                  </div>
                  {POPULAR_CITIES.map((city) => (
                    <button
                      key={city.name}
                      type="button"
                      onClick={() => goTo(city.lat, city.lng, city.name)}
                      className={`flex items-center justify-between w-full text-left px-1 py-2.5 text-[14px] font-medium hover:bg-bg rounded-md transition-colors cursor-pointer ${
                        current?.city === city.name ? 'text-accent font-semibold' : 'text-ink'
                      }`}
                    >
                      {city.name}
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
