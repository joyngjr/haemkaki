import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { healthLocations, type LocationType } from "@/lib/health-locations";

const colors: Record<LocationType, string> = {
  hospital: "#ef4444",
  pharmacy: "#22c55e",
  polyclinic: "#3b82f6",
};

function makeIcon(type: LocationType) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width: 18px; height: 18px; border-radius: 9999px;
      background: ${colors[type]}; border: 2px solid white;
      box-shadow: 0 1px 4px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

const userIcon = L.divIcon({
  className: "",
  html: `<div style="position: relative; width: 20px; height: 20px;">
    <div style="
      position: absolute; inset: 0; border-radius: 9999px;
      background: rgba(59,130,246,0.35); animation: pulse-ring 1.6s ease-out infinite;
    "></div>
    <div style="
      position: absolute; top: 5px; left: 5px; width: 10px; height: 10px;
      border-radius: 9999px; background: #3b82f6; border: 2px solid white;
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

function RecenterOnLocate({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, 14);
  }, [position, map]);
  return null;
}

export function FindMedicalHelp() {
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [locateError, setLocateError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  function handleLocateMe() {
    if (!navigator.geolocation) {
      setLocateError("Your browser doesn't support location.");
      return;
    }
    setLocating(true);
    setLocateError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPosition([pos.coords.latitude, pos.coords.longitude]);
        setLocating(false);
      },
      () => {
        setLocateError("Couldn't get your location. Check location permissions.");
        setLocating(false);
      },
    );
  }

  return (
    <div className="px-4 pt-8 pb-8">
      <Link
        to="/tips"
        className="inline-flex items-center gap-1 text-sm font-semibold text-gray-500"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back
      </Link>
      <PageHeader title="Find Medical Help" subtitle="Tap a pin to see the name and address." />

      <div className="mt-4 flex items-center justify-between">
        <div className="flex gap-4 text-xs text-gray-600">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full" style={{ background: colors.hospital }} />{" "}
            Hospital
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full" style={{ background: colors.polyclinic }} />{" "}
            Polyclinic
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full" style={{ background: colors.pharmacy }} />{" "}
            Pharmacy
          </span>
        </div>

        <button
          onClick={handleLocateMe}
          disabled={locating}
          className="rounded-full bg-blue-500 px-4 py-2 text-xs font-semibold text-white shadow transition-transform active:scale-95 disabled:opacity-60"
        >
          {locating ? "Locating..." : "Use my location"}
        </button>
      </div>

      {locateError && <p className="mt-2 text-xs text-red-500">{locateError}</p>}

      <div className="mt-4 overflow-hidden rounded-[28px] shadow-lg" style={{ height: "500px" }}>
        <MapContainer
          center={[1.3521, 103.8198]}
          zoom={11}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution="OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {healthLocations.map((loc) => (
            <Marker key={loc.id} position={[loc.lat, loc.lng]} icon={makeIcon(loc.type)}>
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold text-gray-900">{loc.name}</p>
                  <p className="mt-1 text-gray-600">{loc.address}</p>
                  <a
                    href={
                      "https://www.google.com/maps/dir/?api=1&destination=" +
                      loc.lat +
                      "," +
                      loc.lng +
                      "&travelmode=driving"
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600"
                  >
                    Get Directions
                    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                      <path
                        d="M9 6l6 6-6 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
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
    </div>
  );
}
