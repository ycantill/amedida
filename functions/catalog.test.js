import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { publicCatalog } from './catalog.js';

const data = JSON.parse(readFileSync(new URL('../database/database.json', import.meta.url))).catalog;

test('the public catalog is sorted and carries what the quoter needs', () => {
    const catalog = publicCatalog(data);
    assert.equal(catalog.garments[0].id, 'drill-trousers');
    assert.equal(catalog.garments.at(-1).id, 'track-jacket');
    assert.deepEqual(catalog.sizes, ['XS', 'S', 'M', 'L', 'XL']);
    assert.equal(catalog.embroidery, 6000);
    assert.deepEqual(catalog.tiers.map((t) => t.from), [200, 100, 50]);
    catalog.garments.forEach((garment) => {
        assert.deepEqual(Object.keys(garment), ['id', 'name', 'line', 'rate'], garment.id);
    });
});

test('the catalog carries the lines and every garment belongs to one', () => {
    const catalog = publicCatalog(data);
    assert.deepEqual(catalog.lines.map((l) => l.id), ['industrial', 'health', 'office', 'knit']);
    assert.equal(catalog.lines[0].name, 'Industrial y operativa');
    assert.equal(catalog.lines[0].shortName, 'Industrial');

    const ids = catalog.lines.map((l) => l.id);
    catalog.garments.forEach((garment) => assert.ok(ids.includes(garment.line), garment.id));
});

test('garments with no line or no rate are left out', () => {
    const broken = {
        ...data,
        garments: {
            ...data.garments,
            ghost: { name: 'Fantasma', line: 'none', rate: 1 },
            unpriced: { name: 'Sin tarifa', line: 'knit' },
        },
    };
    const ids = publicCatalog(broken).garments.map((g) => g.id);
    assert.ok(!ids.includes('ghost'));
    assert.ok(!ids.includes('unpriced'));
});
