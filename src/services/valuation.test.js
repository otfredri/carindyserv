const assert = require('assert');
const { estimateValue, depreciate } = require('./valuation');

const vals = [
  { make: 'Toyota', model: 'Axio', yearFrom: 2016, yearTo: 2020, newPrice: 2800000, active: true },
  { make: 'Toyota', model: 'Axio', yearFrom: 2021, newPrice: 3500000, active: true },
];

const year = new Date().getFullYear();

// Exact match + depreciation
const r1 = estimateValue({ make: 'Toyota', model: 'Axio', yom: 2018 }, vals);
assert.strictEqual(r1.source, 'lookup');
assert.ok(r1.value > 0 && r1.value < 2800000);

// Unknown model falls back to make average / estimate
const r2 = estimateValue({ make: 'Toyota', model: 'Unknown', yom: year - 2 }, vals);
assert.strictEqual(r2.source, 'estimate');
assert.ok(r2.value > 0);

// Floor
assert.ok(depreciate(1_000_000, 50) >= 150_000);

console.log('valuation tests passed');
