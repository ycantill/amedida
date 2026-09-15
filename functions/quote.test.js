import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { publicCatalog, quote, InvalidOrder } from './quote.js';

const data = JSON.parse(readFileSync(new URL('../database/catalog.json', import.meta.url)));

test('the public catalog is sorted and hides rates', () => {
    const catalog = publicCatalog(data);
    assert.equal(catalog.garments[0].id, 'shirt');
    assert.equal(catalog.garments.at(-1).id, 'overalls');
    assert.deepEqual(catalog.sizes, ['XS', 'S', 'M', 'L', 'XL']);
    assert.equal(catalog.embroidery, 6000);
    assert.ok(!JSON.stringify(catalog).includes('rate'));
    assert.ok(!('tiers' in catalog));
});

test('no discount below 50 units', () => {
    const r = quote(data, { lines: [{ garment: 'shirt', sizes: { M: 10 } }] });
    assert.equal(r.discount, 0);
    assert.equal(r.items[0].unitPrice, 38000);
    assert.equal(r.total, 380000);
});

test('volume discount applies to the rate, embroidery on top', () => {
    const r = quote(data, {
        lines: [
            { garment: 'shirt', sizes: { M: 20, S: 10 }, embroidery: true },
            { garment: 'polo', sizes: { L: 30 } },
        ],
    });
    assert.equal(r.units, 60);
    assert.equal(r.discount, 0.08);
    assert.equal(r.items[0].unitPrice, 34960 + 6000);
    assert.deepEqual(Object.keys(r.items[0].sizes), ['S', 'M']);
    assert.equal(r.items[1].unitPrice, 29440);
    assert.equal(r.total, 30 * 40960 + 30 * 29440);
});

test('garments without units are left out of the items', () => {
    const r = quote(data, {
        lines: [
            { garment: 'shirt', sizes: { M: 5 } },
            { garment: 'skirt', sizes: { M: 0 } },
        ],
    });
    assert.deepEqual(r.items.map((l) => l.garment), ['shirt']);
});

test('rejects malformed orders', () => {
    const cases = [
        undefined,
        { lines: [] },
        { lines: [{ garment: 'cape', sizes: { M: 1 } }] },
        { lines: [{ garment: 'shirt', sizes: { XXL: 1 } }] },
        { lines: [{ garment: 'shirt', sizes: { M: 1.5 } }] },
        { lines: [{ garment: 'shirt', sizes: { M: '3' } }] },
        { lines: [{ garment: 'shirt', sizes: { M: -1 } }] },
        { lines: [{ garment: 'shirt', sizes: { M: 0 } }] },
        { lines: [{ garment: 'shirt', sizes: { M: 1 } }, { garment: 'shirt', sizes: { S: 1 } }] },
    ];
    cases.forEach((order) => assert.throws(() => quote(data, order), InvalidOrder));
});
