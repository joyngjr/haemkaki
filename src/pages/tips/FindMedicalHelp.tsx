import { useState } from "react";

import { HealthMap } from "@/components/tips/find-medical-help/HealthMap";
import { MapLegend } from "@/components/tips/find-medical-help/MapLegend";
import { BackLink } from "@/components/layout/BackLink";
import { PageHeader } from "@/components/layout/PageHeader";

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
      <BackLink to="/tips" />
      <PageHeader title="Find Medical Help" subtitle="Tap a pin to see the name and address." />

      <div className="mt-4 flex items-center justify-between">
        <MapLegend />

        <button
          onClick={handleLocateMe}
          disabled={locating}
          className="rounded-full bg-blue-500 px-4 py-2 text-xs font-semibold text-white shadow transition-transform active:scale-95 disabled:opacity-60"
        >
          {locating ? "Locating..." : "Use my location"}
        </button>
      </div>

      {locateError && <p className="mt-2 text-xs text-red-500">{locateError}</p>}

      <div className="mt-4">
        <HealthMap userPosition={userPosition} />
      </div>
    </div>
  );
}
