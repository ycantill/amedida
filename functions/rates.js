/* ==========================================================================
   Rate rules, with no Firebase at all: they take the cost nodes exactly as
   they are stored in the database (/settings, /fabrics, /recipes) and
   return the rate each garment should carry in /catalog.
   ========================================================================== */

/* Rates are rounded up to the next thousand pesos */
const ROUNDING = 1000;

export class InvalidCosts extends Error {}

function requireNumber(value, name) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
        throw new InvalidCosts(`Invalid setting: ${name}`);
    }
    return value;
}

/* Every setting is required: a missing one would silently price everything
   with a made-up number */
function readSettings(settings) {
    const margin = requireNumber(settings?.targetGrossMargin, 'targetGrossMargin');
    if (margin >= 1) throw new InvalidCosts('Invalid setting: targetGrossMargin');
    return {
        waste: requireNumber(settings.fabricWasteMargin, 'fabricWasteMargin'),
        minute: requireNumber(settings.costPerMinuteLabor, 'costPerMinuteLabor'),
        overhead: requireNumber(settings.cifPerGarment, 'cifPerGarment'),
        margin,
    };
}

export function unitCost(settings, fabric, recipe) {
    const fabricCost = recipe.meters * fabric.pricePerMeter * (1 + settings.waste);
    const labor = recipe.assemblyMinutes * settings.minute;
    return fabricCost + labor + (recipe.trimsCost ?? 0) + settings.overhead;
}

/**
 * Returns { rates, report, skipped }:
 * - rates:   { garmentId: rate } for every catalog garment that has a recipe
 * - report:  one row per priced garment, with its cost and old/new rate
 * - skipped: { garment, reason } for garments that could not be priced
 */
export function calculateRates({ catalog, settings, fabrics, recipes }) {
    const config = readSettings(settings);
    const garments = catalog?.garments ?? {};
    const rates = {};
    const report = [];
    const skipped = [];

    Object.keys(garments).forEach((id) => {
        const recipe = recipes?.[id];
        if (!recipe) {
            skipped.push({ garment: id, reason: 'no recipe' });
            return;
        }
        const fabric = fabrics?.[recipe.fabricId];
        if (!fabric) {
            skipped.push({ garment: id, reason: `unknown fabric ${recipe.fabricId}` });
            return;
        }

        const cost = unitCost(config, fabric, recipe);
        if (!Number.isFinite(cost)) {
            skipped.push({ garment: id, reason: 'incomplete recipe' });
            return;
        }

        const rate = Math.ceil(cost / (1 - config.margin) / ROUNDING) * ROUNDING;
        rates[id] = rate;
        report.push({ garment: id, name: garments[id].name, cost: Math.round(cost), previous: garments[id].rate, rate });
    });

    /* A recipe with no garment in the catalog is not priced: writing its
       rate would create a garment with no name and no line */
    Object.keys(recipes ?? {})
        .filter((id) => !garments[id])
        .forEach((id) => skipped.push({ garment: id, reason: 'not in the catalog' }));

    return { rates, report, skipped };
}
