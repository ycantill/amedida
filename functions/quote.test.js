import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { publicCatalog, quote, InvalidOrder } from './quote.js';

const data = JSON.parse(readFileSync(new URL('../database/catalog.json', import.meta.url)));

test('the public catalog is sorted and hides rates', () => {
    const catalog = publicCatalog(data);
    assert.equal(catalog.garments[0].id, 'drill-trousers');
    assert.equal(catalog.garments.at(-1).id, 'track-jacket');
    assert.deepEqual(catalog.sizes, ['XS', 'S', 'M', 'L', 'XL']);
    assert.equal(catalog.embroidery, 6000);
    assert.ok(!JSON.stringify(catalog).includes('rate'));
    assert.ok(!('tiers' in catalog));
});

test('the catalog carries the lines and every garment belongs to one', () => {
    const catalog = publicCatalog(data);
    assert.deepEqual(catalog.lines.map((l) => l.id), ['industrial', 'health', 'office', 'knit']);
    assert.equal(catalog.lines[0].name, 'Industrial y operativa');

    const ids = catalog.lines.map((l) => l.id);
    catalog.garments.forEach((garment) => assert.ok(ids.includes(garment.line), garment.id));
});

test('a garment whose line does not exist is left out', () => {
    const broken = { ...data, garments: { ...data.garments, ghost: { name: 'Fantasma', line: 'none', rate: 1 } } };
    assert.ok(!publicCatalog(broken).garments.some((g) => g.id === 'ghost'));
});

test('no discount below 50 units', () => {
    const r = quote(data, { lines: [{ garment: 'polo-shirt', sizes: { M: 10 } }] });
    assert.equal(r.discount, 0);
    assert.equal(r.items[0].unitPrice, 38000);
    assert.equal(r.total, 380000);
});

test('volume discount applies to the rate, embroidery on top', () => {
    const r = quote(data, {
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

test('garments without units are left out of the items', () => {
    const r = quote(data, {
        lines: [
            { garment: 'polo-shirt', sizes: { M: 5 } },
            { garment: 'lab-coat', sizes: { M: 0 } },
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
    cases.forEach((order) => assert.throws(() => quote(data, order), InvalidOrder));
});
