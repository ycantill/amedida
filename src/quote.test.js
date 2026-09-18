import { test } from 'node:test';
import assert from 'node:assert/strict';
import { quote, InvalidOrder } from './quote.js';

/* A fixed catalog in the shape GET /catalog returns, so these tests don't
   move every time the rates are recalculated */
const catalog = {
    lines: [{ id: 'knit', name: 'Tejido de punto y colegial', shortName: 'Colegial' }],
    garments: [
        { id: 'polo-shirt', name: 'Camiseta tipo polo', line: 'knit', rate: 38000 },
        { id: 'crew-neck-tee', name: 'Camiseta cuello redondo', line: 'knit', rate: 28000 },
        { id: 'track-jacket', name: 'Chaqueta deportiva', line: 'knit', rate: 86000 },
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    embroidery: 6000,
    tiers: [
        { from: 200, discount: 0.18 },
        { from: 100, discount: 0.12 },
        { from: 50, discount: 0.08 },
    ],
};

test('no discount below 50 units', () => {
    const r = quote(catalog, { lines: [{ garment: 'polo-shirt', sizes: { M: 10 } }] });
    assert.equal(r.discount, 0);
    assert.equal(r.items[0].unitPrice, 38000);
    assert.equal(r.items[0].name, 'Camiseta tipo polo');
    assert.equal(r.total, 380000);
});

test('volume discount applies to the rate, embroidery on top', () => {
    const r = quote(catalog, {
        lines: [
            { garment: 'polo-shirt', sizes: { M: 20, S: 10 }, embroidery: true },
            { garment: 'crew-neck-tee', sizes: { L: 30 } },
        ],
    });
    assert.equal(r.units, 60);
    assert.equal(r.discount, 0.08);
    assert.equal(r.items[0].unitPrice, 34960 + 6000);
    assert.deepEqual(Object.keys(r.items[0].sizes), ['S', 'M']);
    assert.equal(r.items[1].unitPrice, 25760);
    assert.equal(r.total, 30 * 40960 + 30 * 25760);
});

test('the highest tier reached wins', () => {
    const r = quote(catalog, { lines: [{ garment: 'crew-neck-tee', sizes: { M: 200 } }] });
    assert.equal(r.discount, 0.18);
});

test('garments without units are left out of the items', () => {
    const r = quote(catalog, {
        lines: [
            { garment: 'polo-shirt', sizes: { M: 5 } },
            { garment: 'track-jacket', sizes: { M: 0 } },
        ],
    });
    assert.deepEqual(r.items.map((l) => l.garment), ['polo-shirt']);
});

test('rejects malformed orders', () => {
    const cases = [
        undefined,
        { lines: [] },
        { lines: [{ garment: 'cape', sizes: { M: 1 } }] },
        { lines: [{ garment: 'polo-shirt', sizes: { XXL: 1 } }] },
        { lines: [{ garment: 'polo-shirt', sizes: { M: 1.5 } }] },
        { lines: [{ garment: 'polo-shirt', sizes: { M: '3' } }] },
        { lines: [{ garment: 'polo-shirt', sizes: { M: -1 } }] },
        { lines: [{ garment: 'polo-shirt', sizes: { M: 0 } }] },
        { lines: [{ garment: 'polo-shirt', sizes: { M: 1 } }, { garment: 'polo-shirt', sizes: { S: 1 } }] },
    ];
    cases.forEach((order) => assert.throws(() => quote(catalog, order), InvalidOrder));
});
