/* ==========================================================================
   Reglas del cotizador, sin nada de Firebase: reciben el catálogo tal como
   está en la base (/catalogo) y devuelven respuestas. Así se prueban solas.
   ========================================================================== */

/* Tope por talla para que un número absurdo no pase como pedido */
const MAXIMO_POR_TALLA = 100000;

export class PedidoInvalido extends Error {}

/* Lo que el navegador puede ver: sin tarifas ni tramos de descuento */
export function catalogoPublico(datos) {
    const prendas = Object.entries(datos.prendas ?? {})
        .sort(([, a], [, b]) => (a.orden ?? 0) - (b.orden ?? 0))
        .map(([id, { nombre }]) => ({ id, nombre }));

    return {
        prendas,
        tallas: datos.tallas ?? [],
        tipos: datos.tipos ?? [],
        bordado: datos.bordado ?? 0,
    };
}

function descuentoPorVolumen(tramos, unidades) {
    return [...(tramos ?? [])]
        .sort((a, b) => b.desde - a.desde)
        .find((tramo) => unidades >= tramo.desde)?.descuento ?? 0;
}

function limpiarLinea(datos, linea, vistas) {
    const id = linea?.prenda;
    const prenda = datos.prendas?.[id];
    if (!prenda) throw new PedidoInvalido(`Prenda desconocida: ${id}`);
    if (vistas.has(id)) throw new PedidoInvalido(`Prenda repetida: ${id}`);
    vistas.add(id);

    const entrada = linea.tallas;
    if (!entrada || typeof entrada !== 'object' || Array.isArray(entrada)) {
        throw new PedidoInvalido(`Faltan las tallas de ${id}`);
    }

    Object.keys(entrada).forEach((talla) => {
        if (!datos.tallas.includes(talla)) throw new PedidoInvalido(`Talla desconocida: ${talla}`);
    });

    /* Las tallas salen en el orden de la escala, no en el que llegaron */
    const tallas = {};
    datos.tallas.forEach((talla) => {
        const cantidad = entrada[talla];
        if (cantidad === undefined) return;
        if (!Number.isInteger(cantidad) || cantidad < 0 || cantidad > MAXIMO_POR_TALLA) {
            throw new PedidoInvalido(`Cantidad inválida en ${id}, talla ${talla}`);
        }
        if (cantidad > 0) tallas[talla] = cantidad;
    });

    return {
        id,
        prenda,
        tallas,
        bordado: linea.bordado === true,
        cantidad: Object.values(tallas).reduce((suma, c) => suma + c, 0),
    };
}

/**
 * pedido: { lineas: [{ prenda: 'camisa', tallas: { M: 10 }, bordado: true }] }
 */
export function cotizar(datos, pedido) {
    const lineas = pedido?.lineas;
    if (!Array.isArray(lineas) || lineas.length === 0) {
        throw new PedidoInvalido('El pedido no trae prendas');
    }

    const vistas = new Set();
    const conUnidades = lineas
        .map((linea) => limpiarLinea(datos, linea, vistas))
        .filter((linea) => linea.cantidad > 0);

    if (!conUnidades.length) throw new PedidoInvalido('El pedido no trae unidades');

    const unidades = conUnidades.reduce((suma, l) => suma + l.cantidad, 0);
    const descuento = descuentoPorVolumen(datos.tramos, unidades);

    const detalle = conUnidades.map(({ id, prenda, tallas, bordado, cantidad }) => {
        const base = Math.round(prenda.tarifa * (1 - descuento));
        const unitario = base + (bordado ? datos.bordado : 0);
        return {
            prenda: id,
            nombre: prenda.nombre,
            cantidad,
            tallas,
            bordado,
            unitario,
            subtotal: unitario * cantidad,
        };
    });

    return {
        detalle,
        unidades,
        descuento,
        total: detalle.reduce((suma, l) => suma + l.subtotal, 0),
    };
}
