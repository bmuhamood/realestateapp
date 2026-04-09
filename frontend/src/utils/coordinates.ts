// Common locations in Kampala
export const locations = {
  kampala: { lat: 0.3136, lng: 32.5811 },
  kololo: { lat: 0.3389, lng: 32.5833 },
  naguru: { lat: 0.3383, lng: 32.5967 },
  ntinda: { lat: 0.3470, lng: 32.6136 },
  kira: { lat: 0.4000, lng: 32.6333 },
  najjera: { lat: 0.3514, lng: 32.6217 },
  muyenga: { lat: 0.3090, lng: 32.6143 },
  makindye: { lat: 0.2816, lng: 32.6025 },
  bweyogerere: { lat: 0.3761, lng: 32.6589 },
  gayaza: { lat: 0.4944, lng: 32.6167 },
  nansana: { lat: 0.3679, lng: 32.5333 },
  entebbe: { lat: 0.0589, lng: 32.4749 },
};

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const getLocationName = (lat: number, lng: number): string => {
  let closest = '';
  let minDistance = Infinity;
  
  for (const [name, coords] of Object.entries(locations)) {
    const distance = calculateDistance(lat, lng, coords.lat, coords.lng);
    if (distance < minDistance) {
      minDistance = distance;
      closest = name;
    }
  }
  
  return closest.charAt(0).toUpperCase() + closest.slice(1);
};