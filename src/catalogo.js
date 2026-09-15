/* ==========================================================================
   Formato de precios
   El catálogo, las tarifas y los descuentos ya no viven aquí: están en la
   Realtime Database (/catalogo) y se sirven desde functions/.
   ========================================================================== */

const FORMATO = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
});

export function moneda(valor) {
    return FORMATO.format(valor);
}
