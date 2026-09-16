/* ==========================================================================
   Quoter API

   GET /catalog      garments with their rates, sizes, product lines,
                     discount tiers and embroidery price. The browser
                     prices the order with this alone.
   GET /updateRates  recalculates every garment rate from the costs
                     (/settings, /fabrics, /recipes). Run by hand, with
                     ?key=..., whenever a cost changes.

   Costs live in the Realtime Database and never leave this code: the
   browser only receives the resulting rates.
   ========================================================================== */
import { timingSafeEqual } from 'node:crypto';
import { initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { setGlobalOptions } from 'firebase-functions/options';
import { defineSecret } from 'firebase-functions/params';
import { onRequest } from 'firebase-functions/https';
import * as logger from 'firebase-functions/logger';
import { publicCatalog } from './catalog.js';
import { calculateRates, InvalidCosts } from './rates.js';

initializeApp();

/* A small site: an instance ceiling avoids billing surprises */
setGlobalOptions({ region: 'us-central1', maxInstances: 5 });

/* Set with: firebase functions:secrets:set ADMIN_SECRET_KEY */
const ADMIN_SECRET_KEY = defineSecret('ADMIN_SECRET_KEY');

const CATALOG_OPTIONS = {
    cors: [
        'https://amedidaconfecciones.co',
        'https://www.amedidaconfecciones.co',
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/,
    ],
};

function allowOnly(method, request, response) {
    if (request.method === method) return true;
    response.set('Allow', method).status(405).json({ error: 'Method not allowed' });
    return false;
}

export const catalog = onRequest(CATALOG_OPTIONS, async (request, response) => {
    if (!allowOnly('GET', request, response)) return;

    try {
        const data = (await getDatabase().ref('catalog').get()).val();
        if (!data?.garments) throw new Error('The database has no /catalog');
        response.set('Cache-Control', 'public, max-age=300');
        response.json(publicCatalog(data));
    } catch (error) {
        logger.error('Could not read the catalog', error);
        response.status(500).json({ error: 'Could not read the catalog' });
    }
});

/* ---------- Rate recalculation ---------- */

function sameKey(provided, expected) {
    if (typeof provided !== 'string' || !expected) return false;
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
}

const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const pesos = (value) => (Number.isFinite(value) ? `$${value.toLocaleString('es-CO')}` : '—');

/* Meant to be opened in a browser by whoever runs it, so it answers HTML */
function ratesPage({ report, skipped }) {
    const rows = report.map((row) => `
        <tr>
            <td>${escape(row.name)}<br><code>${escape(row.garment)}</code></td>
            <td>${pesos(row.cost)}</td>
            <td>${pesos(row.previous)}</td>
            <td><strong>${pesos(row.rate)}</strong></td>
        </tr>`).join('');

    const skippedList = skipped.length
        ? `<h3>Sin recalcular</h3><ul>${skipped
            .map((s) => `<li><code>${escape(s.garment)}</code>: ${escape(s.reason)}</li>`).join('')}</ul>`
        : '';

    return `<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex">
    <title>Tarifas recalculadas</title>
    <style>
        body { font-family: system-ui, sans-serif; padding: 24px; background: #f4f6f8; color: #222; }
        table { width: 100%; max-width: 760px; border-collapse: collapse; background: #fff; }
        th, td { padding: 10px 14px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background: #0f172a; color: #fff; font-size: 14px; }
        td:not(:first-child), th:not(:first-child) { text-align: right; white-space: nowrap; }
        code { color: #64748b; font-size: 12px; }
    </style>
</head>
<body>
    <h2>Tarifas recalculadas</h2>
    <p>Se actualizaron <strong>${report.length}</strong> prendas. Precios en COP, sin IVA.
    El sitio puede tardar hasta 5 minutos en mostrarlos.</p>
    <table>
        <thead><tr><th>Prenda</th><th>Costo unitario</th><th>Tarifa anterior</th><th>Tarifa nueva</th></tr></thead>
        <tbody>${rows}</tbody>
    </table>
    ${skippedList}
</body>
</html>`;
}

export const updateRates = onRequest({ secrets: [ADMIN_SECRET_KEY] }, async (request, response) => {
    if (!allowOnly('GET', request, response)) return;
    response.set('Cache-Control', 'no-store');

    if (!sameKey(request.query.key, ADMIN_SECRET_KEY.value())) {
        response.status(401).json({ error: 'Unauthorized' });
        return;
    }

    try {
        const db = getDatabase();
        const [catalogData, settings, fabrics, recipes] = await Promise.all(
            ['catalog', 'settings', 'fabrics', 'recipes'].map(async (node) => (await db.ref(node).get()).val()),
        );

        const result = calculateRates({ catalog: catalogData, settings, fabrics, recipes });
        if (result.skipped.length) logger.warn('Garments left without a new rate', result.skipped);

        const updates = Object.fromEntries(
            Object.entries(result.rates).map(([id, rate]) => [`${id}/rate`, rate]),
        );
        if (Object.keys(updates).length) await db.ref('catalog/garments').update(updates);

        logger.info('Rates updated', result.report);
        response.status(200).type('html').send(ratesPage(result));
    } catch (error) {
        if (error instanceof InvalidCosts) {
            response.status(400).json({ error: error.message });
            return;
        }
        logger.error('Could not update the rates', error);
        response.status(500).json({ error: 'Could not update the rates' });
    }
});
