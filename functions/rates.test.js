import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { calculateRates, InvalidCosts } from './rates.js';

const data = JSON.parse(readFileSync(new URL('../database/database.json', import.meta.url)));

test('rate is cost over (1 - margin), rounded up to the thousand', () => {
    const { rates, report } = calculateRates(data);
    /* polo-shirt: 1.05 m × 19500 × 1.07 + 40 min × 190 + 4500 + 5500 */
    const row = report.find((r) => r.garment === 'polo-shirt');
    assert.equal(row.cost, 39508);
    assert.equal(rates['polo-shirt'], 61000);
});

test('the database file already carries the calculated rates', () => {
    const { rates, skipped } = calculateRates(data);
    assert.deepEqual(skipped, []);
    Object.entries(rates).forEach(([id, rate]) => {
        assert.equal(data.catalog.garments[id].rate, rate, id);
    });
});

test('garments that cannot be priced are skipped, not written', () => {
    const recipes = { ...data.recipes, ghost: data.recipes['polo-shirt'] };
    recipes['lab-coat'] = { ...recipes['lab-coat'], fabricId: 'silk' };
    delete recipes['crew-neck-tee'];

    const { rates, skipped } = calculateRates({ ...data, recipes });
    assert.ok(!('ghost' in rates));
    assert.ok(!('lab-coat' in rates));
    assert.ok(!('crew-neck-tee' in rates));
    assert.deepEqual(skipped.map((s) => s.garment).sort(), ['crew-neck-tee', 'ghost', 'lab-coat']);
});

test('a missing or broken setting stops the whole calculation', () => {
    const cases = [
        undefined,
        { ...data.settings, cifPerGarment: undefined },
        { ...data.settings, costPerMinuteLabor: '190' },
        { ...data.settings, targetGrossMargin: 1 },
    ];
    cases.forEach((settings) => {
        assert.throws(() => calculateRates({ ...data, settings }), InvalidCosts);
    });
});

test('a zero setting is respected, not replaced by a default', () => {
    const settings = { ...data.settings, fabricWasteMargin: 0 };
    const { report } = calculateRates({ ...data, settings });
    const row = report.find((r) => r.garment === 'polo-shirt');
    assert.equal(row.cost, Math.round(1.05 * 19500 + 40 * 190 + 4500 + 5500));
});
