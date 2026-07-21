/** SvelteKit route-data responses are dynamic page payloads, not static JSON. */
export function isSvelteKitDataRequest(url: URL): boolean {
  return url.pathname.endsWith('/__data.json');
}
