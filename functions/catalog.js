/* ==========================================================================
   Public catalog, with no Firebase at all: it takes /catalog exactly as it
   is stored in the database and returns what the quoter needs to price an
   order on its own. Costs (/settings, /fabrics, /recipes) are never read
   here, so they can't leak.
   ========================================================================== */

const byOrder = (a, b) => (a[1].sortOrder ?? 0) - (b[1].sortOrder ?? 0);

export function publicCatalog(data) {
    const lines = Object.entries(data.lines ?? {})
        .sort(byOrder)
        .map(([id, { name, shortName }]) => ({ id, name, shortName: shortName ?? name }));

    /* A garment whose line no longer exists would never be reachable from
       the line picker, and one without a rate can't be priced, so both are
       left out rather than shown loose */
    const garments = Object.entries(data.garments ?? {})
        .filter(([, garment]) => data.lines?.[garment.line])
        .filter(([, garment]) => Number.isFinite(garment.rate) && garment.rate > 0)
        .sort(byOrder)
        .map(([id, { name, line, rate }]) => ({ id, name, line, rate }));

    const tiers = (data.tiers ?? [])
        .map(({ from, discount }) => ({ from, discount }))
        .sort((a, b) => b.from - a.from);

    return {
        lines,
        garments,
        sizes: data.sizes ?? [],
        embroidery: data.embroidery ?? 0,
        tiers,
    };
}
