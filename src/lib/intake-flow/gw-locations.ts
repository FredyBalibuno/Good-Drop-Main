/** Demo list styled like Greater Washington Goodwill stores — swap for API later */
export const GOODWILL_GW_LOCATIONS = [
  { id: "gw-alex", label: "Alexandria Donation Center — GW" },
  { id: "gw-arl", label: "Arlington Career & Donation Center" },
  { id: "gw-fx", label: "Fairfax Retail & Donation Dock" },
  { id: "gw-rock", label: "Rockville Pike Intake" },
  { id: "gw-sil", label: "Silver Spring Community Donation Hub" },
  { id: "gw-dc", label: "DC — New York Ave Donation Station" },
] as const;

export function getGwLocationLabel(id: string): string {
  return GOODWILL_GW_LOCATIONS.find((l) => l.id === id)?.label ?? id;
}
