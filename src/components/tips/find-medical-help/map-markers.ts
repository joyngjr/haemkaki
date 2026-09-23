import L from "leaflet";

import { LOCATION_COLORS, type LocationType } from "@/lib/health-locations";

/**
 * Leaflet markers are built from HTML strings rather than React, so they live
 * here instead of in a component file.
 */
export function makeLocationIcon(type: LocationType) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width: 18px; height: 18px; border-radius: 9999px;
      background: ${LOCATION_COLORS[type]}; border: 2px solid white;
      box-shadow: 0 1px 4px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

/** The pulsing green dot for the device's own position — blue is a treatment centre. */
export const userIcon = L.divIcon({
  className: "",
  html: `<div style="position: relative; width: 20px; height: 20px;">
    <div style="
      position: absolute; inset: 0; border-radius: 9999px;
      background: rgba(16,185,129,0.35); animation: pulse-ring 1.6s ease-out infinite;
    "></div>
    <div style="
      position: absolute; top: 5px; left: 5px; width: 10px; height: 10px;
      border-radius: 9999px; background: #10b981; border: 2px solid white;
    "></div>
  </div>
  <style>
    @keyframes pulse-ring {
      0% { transform: scale(0.6); opacity: 1; }
      100% { transform: scale(2); opacity: 0; }
    }
  </style>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});
