import { LOCATION_COLORS, type LocationType } from "@/lib/health-locations";

const ENTRIES: { type: LocationType; label: string }[] = [
  { type: "hospital", label: "Hospital" },
  { type: "treatment-centre", label: "Treatment Centre" },
];

/** The colour key above the map. */
export function MapLegend() {
  return (
    <div className="flex gap-4 text-xs text-gray-600">
      {ENTRIES.map((entry) => (
        <span key={entry.type} className="flex items-center gap-1.5">
          <span
            className="h-3 w-3 rounded-full"
            style={{ background: LOCATION_COLORS[entry.type] }}
          />{" "}
          {entry.label}
        </span>
      ))}
    </div>
  );
}
