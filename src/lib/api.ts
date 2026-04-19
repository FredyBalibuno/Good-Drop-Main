/** Base URL for the data API. In dev, leave unset so `/api` is same-origin and Vite proxies to the Node server. */
export function apiUrl(path: string): string {
  const base = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, "") ?? "";
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
