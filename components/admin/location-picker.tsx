"use client";

import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import { Field } from "@/components/ui/server";
import { Icon } from "@/components/ui/icons";

type Props = {
  defaults: { location: string; address: string; latitude: string; longitude: string };
  errors: { location?: string[]; address?: string[]; latitude?: string[]; longitude?: string[] };
};

type Hit = { display_name: string; lat: string; lon: string; name?: string };
type Leaflet = typeof import("leaflet");

const NOMINATIM = "https://nominatim.openstreetmap.org";
const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629]; // India
const num = (s: string) => (s.trim() === "" || Number.isNaN(Number(s)) ? null : Number(s));

/**
 * Venue picker: type the venue and address by hand, or search / drop a pin on an OpenStreetMap map, or use the
 * device's current position. A pin stores latitude/longitude, which the ticket and event page turn into a maps link.
 * Search and reverse geocoding use OpenStreetMap's public Nominatim service (no API key; light, user-triggered use).
 */
export function LocationPicker({ defaults, errors }: Props) {
  const [location, setLocation] = useState(defaults.location);
  const [address, setAddress] = useState(defaults.address);
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(() => {
    const lat = num(defaults.latitude);
    const lng = num(defaults.longitude);
    return lat != null && lng != null ? { lat, lng } : null;
  });
  const [mapOpen, setMapOpen] = useState(pin != null);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [busy, setBusy] = useState<"" | "search" | "locate" | "reverse">("");
  const [note, setNote] = useState("");

  const mapEl = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const marker = useRef<Marker | null>(null);
  const lib = useRef<Leaflet | null>(null);
  const initialPin = useRef(pin);

  const reverse = useCallback(async (lat: number, lng: number) => {
    setBusy("reverse");
    try {
      const r = await fetch(`${NOMINATIM}/reverse?format=jsonv2&zoom=18&lat=${lat}&lon=${lng}`, { headers: { Accept: "application/json" } });
      if (!r.ok) throw new Error();
      const d = (await r.json()) as { display_name?: string; name?: string };
      if (d.display_name) {
        const full = d.display_name;
        setAddress(full.slice(0, 300));
        setLocation((cur) => cur.trim() || (d.name || full.split(",")[0]).slice(0, 160));
      }
      setNote("");
    } catch {
      setNote("Pin saved, but the address couldn't be looked up. You can type it in.");
    } finally {
      setBusy("");
    }
  }, []);

  const place = useCallback(
    (lat: number, lng: number, opts: { lookup: boolean; zoom?: number }) => {
      const L = lib.current;
      const m = map.current;
      if (!L || !m) return;
      setPin({ lat, lng });
      if (!marker.current) {
        const mk = L.marker([lat, lng], { draggable: true, icon: pinIcon(L) }).addTo(m);
        mk.on("dragend", () => {
          const p = mk.getLatLng();
          setPin({ lat: p.lat, lng: p.lng });
          reverse(p.lat, p.lng);
        });
        marker.current = mk;
      } else marker.current.setLatLng([lat, lng]);
      m.setView([lat, lng], opts.zoom ?? Math.max(m.getZoom(), 16));
      if (opts.lookup) reverse(lat, lng);
    },
    [reverse],
  );

  // Create the map the first time the panel opens.
  useEffect(() => {
    if (!mapOpen || map.current || !mapEl.current) return;
    let cancelled = false;
    (async () => {
      const mod = await import("leaflet");
      const L = (mod.default ?? mod) as Leaflet;
      if (cancelled || !mapEl.current) return;
      lib.current = L;
      const start = initialPin.current;
      const m = L.map(mapEl.current, { scrollWheelZoom: false }).setView(start ? [start.lat, start.lng] : DEFAULT_CENTER, start ? 16 : 5);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(m);
      m.on("click", (ev) => place(ev.latlng.lat, ev.latlng.lng, { lookup: true }));
      map.current = m;
      if (start) place(start.lat, start.lng, { lookup: false, zoom: 16 });
    })();
    return () => {
      cancelled = true;
    };
  }, [mapOpen, place]);

  useEffect(
    () => () => {
      map.current?.remove();
      map.current = null;
      marker.current = null;
    },
    [],
  );

  async function search() {
    const q = query.trim();
    if (q.length < 3) return setNote("Type at least 3 characters to search.");
    setBusy("search");
    setNote("");
    try {
      const r = await fetch(`${NOMINATIM}/search?format=jsonv2&limit=5&q=${encodeURIComponent(q)}`, { headers: { Accept: "application/json" } });
      if (!r.ok) throw new Error();
      const found = (await r.json()) as Hit[];
      setHits(found);
      if (!found.length) setNote("No places found. Try a nearby landmark or drop the pin on the map.");
    } catch {
      setNote("Search is unavailable right now. You can still type the venue or tap the map.");
    } finally {
      setBusy("");
    }
  }

  function choose(h: Hit) {
    setHits([]);
    setQuery(h.display_name);
    setAddress(h.display_name.slice(0, 300));
    setLocation((cur) => cur.trim() || (h.name || h.display_name.split(",")[0]).slice(0, 160));
    place(Number(h.lat), Number(h.lon), { lookup: false, zoom: 17 });
  }

  function useMyLocation() {
    if (!navigator.geolocation) return setNote("This browser can't share your location.");
    setBusy("locate");
    setNote("");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setBusy("");
        const { latitude: lat, longitude: lng } = p.coords;
        if (map.current) place(lat, lng, { lookup: true, zoom: 17 });
        else {
          // The map initialises after this render and places the pin from initialPin; fetch the address now.
          initialPin.current = { lat, lng };
          setPin({ lat, lng });
          setMapOpen(true);
          reverse(lat, lng);
        }
      },
      (err) => {
        setBusy("");
        setNote(err.code === err.PERMISSION_DENIED ? "Location permission was blocked. Allow it in your browser, or search / tap the map instead." : "Couldn't get your location. Search or tap the map instead.");
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  function clearPin() {
    marker.current?.remove();
    marker.current = null;
    initialPin.current = null;
    setPin(null);
  }

  return (
    <div className="space-y-5">
      <input type="hidden" name="latitude" value={pin ? pin.lat.toFixed(6) : ""} />
      <input type="hidden" name="longitude" value={pin ? pin.lng.toFixed(6) : ""} />

      <Field label="Location" name="location" errors={errors.location} required hint="Venue name, as shown on tickets. Type it, or pick it on the map below.">
        <input id="location" name="location" value={location} onChange={(e) => setLocation(e.target.value)} required maxLength={160} className="input" aria-invalid={errors.location ? true : undefined} aria-describedby="location-error location-hint" />
      </Field>
      <Field label="Address" name="address" errors={errors.address}>
        <input id="address" name="address" value={address} onChange={(e) => setAddress(e.target.value)} maxLength={300} className="input" />
      </Field>

      <div className="rounded-xl border border-line bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn-secondary btn-sm" onClick={() => setMapOpen((o) => !o)} aria-expanded={mapOpen}>
            <Icon name="pin" className="size-4" /> {mapOpen ? "Hide map" : "Pick on map"}
          </button>
          <button type="button" className="btn-secondary btn-sm" onClick={useMyLocation} disabled={busy === "locate"}>
            {busy === "locate" ? "Finding you…" : "Use my current location"}
          </button>
          {pin && (
            <>
              <span className="text-xs text-muted">
                Pin saved ({pin.lat.toFixed(4)}, {pin.lng.toFixed(4)})
              </span>
              <button type="button" className="btn-ghost btn-sm" onClick={clearPin}>
                Remove pin
              </button>
            </>
          )}
        </div>
        {(errors.latitude || errors.longitude) && (
          <p role="alert" className="field-error mt-2">
            {(errors.latitude ?? errors.longitude)![0]}
          </p>
        )}

        {mapOpen && (
          <div className="mt-4 space-y-3">
            <div className="relative">
              <div className="flex gap-2">
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      search();
                    }
                  }}
                  placeholder="Search a place, e.g. Lodhi Garden, Delhi"
                  aria-label="Search for a place"
                  className="input"
                />
                <button type="button" className="btn-primary btn-sm shrink-0" onClick={search} disabled={busy === "search"}>
                  {busy === "search" ? "Searching…" : "Search"}
                </button>
              </div>
              {hits.length > 0 && (
                <ul className="absolute inset-x-0 top-full z-[1000] mt-1 max-h-60 overflow-auto rounded-lg border border-line bg-white shadow-lg">
                  {hits.map((h, i) => (
                    <li key={i}>
                      <button type="button" onClick={() => choose(h)} className="block min-h-11 w-full px-3 py-2 text-left text-sm hover:bg-mint">
                        {h.display_name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div ref={mapEl} className="h-72 w-full overflow-hidden rounded-lg border border-line" role="application" aria-label="Map. Tap to drop a pin on the venue." />
            <p className="text-xs text-muted">Tap the map or drag the pin to the exact spot. {busy === "reverse" && "Looking up the address…"}</p>
          </div>
        )}
        {note && (
          <p role="status" className="mt-3 text-sm text-muted">
            {note}
          </p>
        )}
      </div>
    </div>
  );
}

function pinIcon(L: Leaflet) {
  return L.divIcon({
    className: "",
    iconSize: [28, 36],
    iconAnchor: [14, 34],
    html: '<svg width="28" height="36" viewBox="0 0 24 30" aria-hidden="true"><path d="M12 29s9-8.3 9-16A9 9 0 0 0 3 13c0 7.7 9 16 9 16Z" fill="#1f6b4a" stroke="#fff" stroke-width="1.5"/><circle cx="12" cy="13" r="3.5" fill="#fff"/></svg>',
  });
}
