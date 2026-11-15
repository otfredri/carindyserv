const assert = require('assert');
const { rateQuote } = require('./ratingEngine');
const insurer = { _id: 'i1', name: 'Test', isDummy: true };
const card = { insurer: 'i1', cover: 'COMPREHENSIVE', vehicleClass: 'PRIVATE', rate: 0.04, minPremium: 20000,
  maxVehicleAge: 15, minValue: 0, maxValue: 1e9, addOns: [], active: true, effectiveFrom: new Date('2020-01-01') };
const data = { insurers: [insurer], rateCards: [card], adjustments: [], levies: [] };
const year = new Date().getFullYear() - 1;
const [r] = rateQuote({ value: 1000000, yom: year, make: 'Toyota', cover: 'COMPREHENSIVE', vehicleClass: 'PRIVATE' }, data);
assert.strictEqual(r.total, 40000);
const [m] = rateQuote({ value: 100000, yom: year, make: 'Toyota', cover: 'COMPREHENSIVE', vehicleClass: 'PRIVATE' }, data);
assert.strictEqual(m.total, 20000); // minimum premium applies
console.log('rating engine tests passed');
