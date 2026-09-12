import { type DoseState, type StockState } from "@/components/platelet/Platelet";

const BASE_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

export type FactorType = "VIII" | "IX";

/** A person tracked on this device. No auth — a profile is just a name. */
export type Profile = {
  id: number;
  name: string;
  factor_type: FactorType;
  dose_state: DoseState;
  stock_state: StockState;
  vials_on_hand: number;
  days_cover: number;
  created_at: string;
  updated_at: string;
};

/** The fields a new profile is created with. The API defaults the rest. */
export type ProfileDraft = {
  name: string;
  factor_type: FactorType;
  dose_state?: DoseState;
  stock_state?: StockState;
  vials_on_hand?: number;
  days_cover?: number;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: init?.body
        ? { "Content-Type": "application/json", ...init?.headers }
        : init?.headers,
    });
  } catch {
    // A dead backend surfaces as a bare "Failed to fetch", which tells a
    // demo-day audience nothing. Name the likely cause instead.
    throw new Error("Could not reach the API. Is the backend running?");
  }

  if (!response.ok) {
    // FastAPI puts the reason in `detail`, which is a string for our own
    // HTTPExceptions and a list of field errors for 422s.
    const detail = await response.json().catch(() => null);
    const message =
      typeof detail?.detail === "string" ? detail.detail : `Request failed (${response.status})`;
    throw new Error(message);
  }

  return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}

export const api = {
  listProfiles: () => request<Profile[]>("/users"),
  createProfile: (draft: ProfileDraft) =>
    request<Profile>("/users", { method: "POST", body: JSON.stringify(draft) }),
  updateProfile: (id: number, patch: Partial<ProfileDraft>) =>
    request<Profile>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  deleteProfile: (id: number) => request<void>(`/users/${id}`, { method: "DELETE" }),
};
