/* ==========================================================================
   API del cotizador

   GET  /catalogo  prendas, tallas, tipos de dotación y precio del bordado
   POST /cotizar   precio aproximado de un pedido

   Las tarifas y los tramos de descuento viven en la Realtime Database, bajo
   /catalogo, y no salen de aquí: el navegador solo recibe el resultado.
   ========================================================================== */
import { initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { setGlobalOptions } from 'firebase-functions/options';
import { onRequest } from 'firebase-functions/https';
import * as logger from 'firebase-functions/logger';
import { catalogoPublico, cotizar as calcular, PedidoInvalido } from './cotizacion.js';

initializeApp();

/* Un sitio pequeño: un techo de instancias evita sorpresas en la factura */
setGlobalOptions({ region: 'us-central1', maxInstances: 5 });

const OPCIONES = {
    cors: [
        'https://amedidaconfecciones.co',
        'https://www.amedidaconfecciones.co',
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/,
    ],
};

async function leerCatalogo() {
    const datos = (await getDatabase().ref('catalogo').get()).val();
    if (!datos?.prendas) throw new Error('La base no tiene /catalogo');
    return datos;
}

function soloMetodo(metodo, peticion, respuesta) {
    if (peticion.method === metodo) return true;
    respuesta.set('Allow', metodo).status(405).json({ error: 'Método no permitido' });
    return false;
}

export const catalogo = onRequest(OPCIONES, async (peticion, respuesta) => {
    if (!soloMetodo('GET', peticion, respuesta)) return;

    try {
        const datos = await leerCatalogo();
        respuesta.set('Cache-Control', 'public, max-age=300');
        respuesta.json(catalogoPublico(datos));
    } catch (error) {
        logger.error('No se pudo leer el catálogo', error);
        respuesta.status(500).json({ error: 'No se pudo leer el catálogo' });
    }
});

export const cotizar = onRequest(OPCIONES, async (peticion, respuesta) => {
    if (!soloMetodo('POST', peticion, respuesta)) return;

    try {
        const datos = await leerCatalogo();
        respuesta.json(calcular(datos, peticion.body));
    } catch (error) {
        if (error instanceof PedidoInvalido) {
            respuesta.status(400).json({ error: error.message });
            return;
        }
        logger.error('No se pudo cotizar', error);
        respuesta.status(500).json({ error: 'No se pudo calcular el precio' });
    }
});
