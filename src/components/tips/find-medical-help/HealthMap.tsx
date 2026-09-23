import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import { ChevronRight } from "@/components/ui/ChevronRight";
import { healthLocations } from "@/lib/health-locations";

import { makeLocationIcon, userIcon } from "./map-markers";

/** South, Southeast and East Asia, where every pin is. */
const ASIA_CENTER: [number, number] = [20, 100];
const ASIA_ZOOM = 3;

/** Pans the map once the browser hands back a position. */
function RecenterOnLocate({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, 10);
  }, [position, map]);
  return null;
}

/** The pinned map of hospitals and haemophilia treatment centres. */
export function HealthMap({ userPosition }: { userPosition: [number, number] | null }) {
  return (
    // `isolate` keeps Leaflet's high z-index panes under the sticky top bar and the tab bar.
    <div className="isolate overflow-hidden rounded-[28px] shadow-lg" style={{ height: "500px" }}>
      <MapContainer center={ASIA_CENTER} zoom={ASIA_ZOOM} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution="OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {healthLocations.map((loc) => (
          <Marker key={loc.id} position={[loc.lat, loc.lng]} icon={makeLocationIcon(loc.type)}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold text-gray-900">{loc.name}</p>
                <p className="mt-1 text-gray-600">{loc.address}</p>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}&travelmode=driving`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600"
                >
                  Get Directions
                  <ChevronRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </Popup>
          </Marker>
        ))}

        {userPosition && (
          <>
            <Marker position={userPosition} icon={userIcon}>
              <Popup>
                <p className="text-sm font-semibold text-gray-900">You are here</p>
              </Popup>
            </Marker>
            <RecenterOnLocate position={userPosition} />
          </>
        )}
      </MapContainer>
    </div>
  );
}
