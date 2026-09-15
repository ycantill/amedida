/* ==========================================================================
   Price formatting
   The catalog, rates and discounts no longer live here: they are in the
   Realtime Database (/catalog) and served from functions/.
   ========================================================================== */

const CURRENCY_FORMAT = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
});

export function currency(value) {
    return CURRENCY_FORMAT.format(value);
}
