/** Link that opens the venue in the viewer's maps app: the exact pin when one was picked, else a text search. */
export function mapsUrl(e: { latitude?: number | null; longitude?: number | null; location: string; address?: string | null }) {
  const query = e.latitude != null && e.longitude != null ? `${e.latitude},${e.longitude}` : [e.location, e.address].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
