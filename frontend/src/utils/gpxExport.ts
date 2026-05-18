import type { Cave } from '../api/caves';

/**
 * Generates a GPX file with two waypoints (parking → entrance) and a simple
 * route connecting them. Suitable for handheld GPS units and navigation apps.
 */
export function generateGpx(cave: Cave): string {
  const now = new Date().toISOString();
  const entranceName = `${cave.registry_id} - ${cave.name}`;
  const parkingName = `Parcheggio - ${cave.name}`;

  const entranceWpt = `  <wpt lat="${cave.latitude}" lon="${cave.longitude}">
    <ele>${cave.elevation ?? 0}</ele>
    <name>${escapeXml(entranceName)}</name>
    <desc>Ingresso grotta</desc>
    <sym>Cave</sym>
    <type>Entrance</type>
  </wpt>`;

  const parkingWpt =
    cave.parking_latitude != null && cave.parking_longitude != null
      ? `  <wpt lat="${cave.parking_latitude}" lon="${cave.parking_longitude}">
    <name>${escapeXml(parkingName)}</name>
    <desc>${escapeXml(cave.parking_notes ?? 'Parcheggio')}</desc>
    <sym>Parking Area</sym>
    <type>Parking</type>
  </wpt>`
      : '';

  const routePoints =
    cave.parking_latitude != null && cave.parking_longitude != null
      ? `  <rte>
    <name>${escapeXml(`Percorso a ${cave.name}`)}</name>
    <rtept lat="${cave.parking_latitude}" lon="${cave.parking_longitude}">
      <name>${escapeXml(parkingName)}</name>
    </rtept>
    <rtept lat="${cave.latitude}" lon="${cave.longitude}">
      <name>${escapeXml(entranceName)}</name>
    </rtept>
  </rte>`
      : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Cave Registry"
  xmlns="http://www.topografix.com/GPX/1/1"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${escapeXml(cave.name)}</name>
    <desc>${escapeXml(`Catasto: ${cave.registry_id}`)}</desc>
    <time>${now}</time>
  </metadata>
${parkingWpt}
${entranceWpt}
${routePoints}
</gpx>`;
}

/**
 * Triggers a browser download of the GPX file.
 */
export function downloadGpx(cave: Cave): void {
  const content = generateGpx(cave);
  const blob = new Blob([content], { type: 'application/gpx+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${cave.registry_id}_${cave.name.replace(/\s+/g, '_')}.gpx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Opens Google Maps navigation to the parking location (or cave entrance as
 * fallback when no parking is defined).
 */
export function openMapsToParking(cave: Cave): void {
  const lat = cave.parking_latitude ?? cave.latitude;
  const lon = cave.parking_longitude ?? cave.longitude;
  if (lat == null || lon == null) return;
  window.open(
    `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&travelmode=driving`,
    '_blank',
    'noopener,noreferrer',
  );
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
