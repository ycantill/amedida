/* Client for the quoter API (functions/).
   The base URL comes from VITE_API: .env points to production and a
   .env.local can point to the emulators. */
const API = import.meta.env.VITE_API;

async function request(path, options) {
    const response = await fetch(`${API}/${path}`, options);
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error ?? `The API responded ${response.status}`);
    return body;
}

/* The catalog is cached for a few minutes. `fresh` skips that cache, so a
   retry after a deploy doesn't get the same stale answer again. */
export function fetchCatalog({ fresh = false } = {}) {
    return request('catalog', fresh ? { cache: 'reload' } : undefined);
}
