/* ==========================================================================
   Quoter rules, with no Firebase at all: they take the catalog exactly as it
   is stored in the database (/catalog) and return answers. That way they
   can be tested on their own.
   ========================================================================== */

/* Per-size cap so an absurd number doesn't pass as an order */
const MAX_PER_SIZE = 100000;

export class InvalidOrder extends Error {}

/* What the browser is allowed to see: no rates and no discount tiers */
export function publicCatalog(data) {
    const garments = Object.entries(data.garments ?? {})
        .sort(([, a], [, b]) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map(([id, { name }]) => ({ id, name }));

    return {
        garments,
        sizes: data.sizes ?? [],
        types: data.types ?? [],
        embroidery: data.embroidery ?? 0,
    };
}

function volumeDiscount(tiers, units) {
    return [...(tiers ?? [])]
        .sort((a, b) => b.from - a.from)
        .find((tier) => units >= tier.from)?.discount ?? 0;
}

function sanitizeLine(data, line, seen) {
    const id = line?.garment;
    const garment = data.garments?.[id];
    if (!garment) throw new InvalidOrder(`Unknown garment: ${id}`);
    if (seen.has(id)) throw new InvalidOrder(`Duplicate garment: ${id}`);
    seen.add(id);

    const input = line.sizes;
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        throw new InvalidOrder(`Missing sizes for ${id}`);
    }

    Object.keys(input).forEach((size) => {
        if (!data.sizes.includes(size)) throw new InvalidOrder(`Unknown size: ${size}`);
    });

    /* Sizes come out in scale order, not in the order they arrived */
    const sizes = {};
    data.sizes.forEach((size) => {
        const quantity = input[size];
        if (quantity === undefined) return;
        if (!Number.isInteger(quantity) || quantity < 0 || quantity > MAX_PER_SIZE) {
            throw new InvalidOrder(`Invalid quantity for ${id}, size ${size}`);
        }
        if (quantity > 0) sizes[size] = quantity;
    });

    return {
        id,
        garment,
        sizes,
        embroidery: line.embroidery === true,
        quantity: Object.values(sizes).reduce((sum, q) => sum + q, 0),
    };
}

/**
 * order: { lines: [{ garment: 'shirt', sizes: { M: 10 }, embroidery: true }] }
 */
export function quote(data, order) {
    const lines = order?.lines;
    if (!Array.isArray(lines) || lines.length === 0) {
        throw new InvalidOrder('The order has no garments');
    }

    const seen = new Set();
    const withUnits = lines
        .map((line) => sanitizeLine(data, line, seen))
        .filter((line) => line.quantity > 0);

    if (!withUnits.length) throw new InvalidOrder('The order has no units');

    const units = withUnits.reduce((sum, l) => sum + l.quantity, 0);
    const discount = volumeDiscount(data.tiers, units);

    const items = withUnits.map(({ id, garment, sizes, embroidery, quantity }) => {
        const base = Math.round(garment.rate * (1 - discount));
        const unitPrice = base + (embroidery ? data.embroidery : 0);
        return {
            garment: id,
            name: garment.name,
            quantity,
            sizes,
            embroidery,
            unitPrice,
            subtotal: unitPrice * quantity,
        };
    });

    return {
        items,
        units,
        discount,
        total: items.reduce((sum, l) => sum + l.subtotal, 0),
    };
}
