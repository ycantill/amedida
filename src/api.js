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

export function fetchCatalog() {
    return request('catalog');
}

export function quote(order) {
    return request('quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
    });
}
