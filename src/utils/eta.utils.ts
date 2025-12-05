import axios from 'axios';

export async function getETA_OSRM(depLat: number, depLng: number, arrLat: number, arrLng: number) {
  const url = `http://router.project-osrm.org/route/v1/driving/${depLng},${depLat};${arrLng},${arrLat}?overview=false`;

  const response = await axios.get(url);
  const route = response.data.routes[0];

  const distanceKm = route.distance / 1000;      // meters → km
  const totalMinutes = Math.round(route.duration / 60); // seconds → rounded minutes

  // Convert to hours and minutes if > 60
  let etaFormatted = '';
  if (totalMinutes >= 60) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    etaFormatted = `${hours}h ${minutes}m`;
  } else {
    etaFormatted = `${totalMinutes}m`;
  }

  return {
    distanceKm,
    etaMinutes: totalMinutes,
    etaFormatted,
  };
}

// Example usage:
// (async () => {
//   const result = await getETA_OSRM(52.406822, -1.519693, 52.486244, -1.890401);
//   console.log(`Distance: ${result.distanceKm.toFixed(2)} km, ETA: ${result.etaFormatted}`);
// })();