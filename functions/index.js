/* ==========================================================================
   Quoter API

   GET  /catalog  garments, sizes, uniform types and embroidery price
   POST /quote    approximate price for an order

   Rates and discount tiers live in the Realtime Database, under /catalog,
   and never leave this code: the browser only receives the result.
   ========================================================================== */
import { initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { setGlobalOptions } from 'firebase-functions/options';
import { onRequest } from 'firebase-functions/https';
import * as logger from 'firebase-functions/logger';
import { publicCatalog, quote as calculate, InvalidOrder } from './quote.js';

initializeApp();

/* A small site: an instance ceiling avoids billing surprises */
setGlobalOptions({ region: 'us-central1', maxInstances: 5 });

const OPTIONS = {
    cors: [
        'https://amedidaconfecciones.co',
        'https://www.amedidaconfecciones.co',
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/,
    ],
};

async function readCatalog() {
    const data = (await getDatabase().ref('catalog').get()).val();
    if (!data?.garments) throw new Error('The database has no /catalog');
    return data;
}

function allowOnly(method, request, response) {
    if (request.method === method) return true;
    response.set('Allow', method).status(405).json({ error: 'Method not allowed' });
    return false;
}

export const catalog = onRequest(OPTIONS, async (request, response) => {
    if (!allowOnly('GET', request, response)) return;

    try {
        const data = await readCatalog();
        response.set('Cache-Control', 'public, max-age=300');
        response.json(publicCatalog(data));
    } catch (error) {
        logger.error('Could not read the catalog', error);
        response.status(500).json({ error: 'Could not read the catalog' });
    }
});

export const quote = onRequest(OPTIONS, async (request, response) => {
    if (!allowOnly('POST', request, response)) return;

    try {
        const data = await readCatalog();
        response.json(calculate(data, request.body));
    } catch (error) {
        if (error instanceof InvalidOrder) {
            response.status(400).json({ error: error.message });
            return;
        }
        logger.error('Could not calculate the quote', error);
        response.status(500).json({ error: 'Could not calculate the price' });
    }
});
