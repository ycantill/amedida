import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { catalogoPublico, cotizar, PedidoInvalido } from './cotizacion.js';

const datos = JSON.parse(readFileSync(new URL('../database/catalogo.json', import.meta.url)));

test('el catálogo público va en orden y no deja ver tarifas', () => {
    const publico = catalogoPublico(datos);
    assert.equal(publico.prendas[0].id, 'camisa');
    assert.equal(publico.prendas.at(-1).id, 'overol');
    assert.deepEqual(publico.tallas, ['XS', 'S', 'M', 'L', 'XL']);
    assert.equal(publico.bordado, 6000);
    assert.ok(!JSON.stringify(publico).includes('tarifa'));
    assert.ok(!('tramos' in publico));
});

test('sin descuento por debajo de 50 unidades', () => {
    const r = cotizar(datos, { lineas: [{ prenda: 'camisa', tallas: { M: 10 } }] });
    assert.equal(r.descuento, 0);
    assert.equal(r.detalle[0].unitario, 38000);
    assert.equal(r.total, 380000);
});

test('descuento por volumen sobre la tarifa, bordado aparte', () => {
    const r = cotizar(datos, {
        lineas: [
            { prenda: 'camisa', tallas: { M: 20, S: 10 }, bordado: true },
            { prenda: 'polo', tallas: { L: 30 } },
        ],
    });
    assert.equal(r.unidades, 60);
    assert.equal(r.descuento, 0.08);
    assert.equal(r.detalle[0].unitario, 34960 + 6000);
    assert.deepEqual(Object.keys(r.detalle[0].tallas), ['S', 'M']);
    assert.equal(r.detalle[1].unitario, 29440);
    assert.equal(r.total, 30 * 40960 + 30 * 29440);
});

test('las prendas sin unidades no salen en el detalle', () => {
    const r = cotizar(datos, {
        lineas: [
            { prenda: 'camisa', tallas: { M: 5 } },
            { prenda: 'falda', tallas: { M: 0 } },
        ],
    });
    assert.deepEqual(r.detalle.map((l) => l.prenda), ['camisa']);
});

test('rechaza pedidos mal formados', () => {
    const casos = [
        undefined,
        { lineas: [] },
        { lineas: [{ prenda: 'capa', tallas: { M: 1 } }] },
        { lineas: [{ prenda: 'camisa', tallas: { XXL: 1 } }] },
        { lineas: [{ prenda: 'camisa', tallas: { M: 1.5 } }] },
        { lineas: [{ prenda: 'camisa', tallas: { M: '3' } }] },
        { lineas: [{ prenda: 'camisa', tallas: { M: -1 } }] },
        { lineas: [{ prenda: 'camisa', tallas: { M: 0 } }] },
        { lineas: [{ prenda: 'camisa', tallas: { M: 1 } }, { prenda: 'camisa', tallas: { S: 1 } }] },
    ];
    casos.forEach((pedido) => assert.throws(() => cotizar(datos, pedido), PedidoInvalido));
});
