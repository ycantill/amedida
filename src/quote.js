/* ==========================================================================
   Quoter rules. They take the catalog exactly as GET /catalog delivers it
   (garments as a list, each with its rate) and return the approximate
   price. No DOM and no fetch, so they can be tested with node on their own.
   ========================================================================== */

/* Per-size cap so an absurd number doesn't pass as an order */
const MAX_PER_SIZE = 100000;

export class InvalidOrder extends Error {}

function volumeDiscount(tiers, units) {
    return [...(tiers ?? [])]
        .sort((a, b) => b.from - a.from)
        .find((tier) => units >= tier.from)?.discount ?? 0;
}

function sanitizeLine(catalog, line, seen) {
    const id = line?.garment;
    const garment = catalog.garments.find((g) => g.id === id);
    if (!garment) throw new InvalidOrder(`Unknown garment: ${id}`);
    if (seen.has(id)) throw new InvalidOrder(`Duplicate garment: ${id}`);
    seen.add(id);

    const input = line.sizes;
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        throw new InvalidOrder(`Missing sizes for ${id}`);
    }

    Object.keys(input).forEach((size) => {
        if (!catalog.sizes.includes(size)) throw new InvalidOrder(`Unknown size: ${size}`);
    });

    /* Sizes come out in scale order, not in the order they arrived */
    const sizes = {};
    catalog.sizes.forEach((size) => {
        const quantity = input[size];
        if (quantity === undefined) return;
        if (!Number.isInteger(quantity) || quantity < 0 || quantity > MAX_PER_SIZE) {
            throw new InvalidOrder(`Invalid quantity for ${id}, size ${size}`);
        }
        if (quantity > 0) sizes[size] = quantity;
    });

    return {
        garment,
        sizes,
        embroidery: line.embroidery === true,
        quantity: Object.values(sizes).reduce((sum, q) => sum + q, 0),
    };
}

/**
 * order: { lines: [{ garment: 'polo-shirt', sizes: { M: 10 }, embroidery: true }] }
 */
export function quote(catalog, order) {
    const lines = order?.lines;
    if (!Array.isArray(lines) || lines.length === 0) {
        throw new InvalidOrder('The order has no garments');
    }

    const seen = new Set();
    const withUnits = lines
        .map((line) => sanitizeLine(catalog, line, seen))
        .filter((line) => line.quantity > 0);

    if (!withUnits.length) throw new InvalidOrder('The order has no units');

    const units = withUnits.reduce((sum, l) => sum + l.quantity, 0);
    const discount = volumeDiscount(catalog.tiers, units);

    const items = withUnits.map(({ garment, sizes, embroidery, quantity }) => {
        const base = Math.round(garment.rate * (1 - discount));
        const unitPrice = base + (embroidery ? catalog.embroidery : 0);
        return {
            garment: garment.id,
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
