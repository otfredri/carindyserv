/**
 * Estimates market value (sum insured) from make, model and year of manufacture.
 * Looks up VehicleValuation rows first; falls back to a simple depreciation formula.
 * Values are indicative only — real underwriting uses official valuation guides.
 */

const DEFAULT_NEW_PRICE = 2_500_000; // generic mid-size saloon if unknown
const ANNUAL_DEPRECIATION = 0.12;    // ~12% per year
const FLOOR_RATIO = 0.15;            // never below 15% of new price

function depreciate(newPrice, age) {
  const value = newPrice * Math.pow(1 - ANNUAL_DEPRECIATION, Math.max(0, age));
  return Math.max(Math.round(value / 1000) * 1000, Math.round(newPrice * FLOOR_RATIO / 1000) * 1000);
}

/**
 * @param {{ make: string, model: string, yom: number }} input
 * @param {Array} valuations  lean VehicleValuation docs
 * @param {Date} [now]
 * @returns {{ value: number, source: 'lookup' | 'estimate', label: string }}
 */
function estimateValue({ make, model, yom }, valuations = [], now = new Date()) {
  const age = now.getFullYear() - yom;
  const makeL = (make || '').trim().toLowerCase();
  const modelL = (model || '').trim().toLowerCase();

  // Prefer exact make+model match whose year range covers yom
  const hit = valuations.find((v) =>
    v.active &&
    v.make.toLowerCase() === makeL &&
    v.model.toLowerCase() === modelL &&
    yom >= v.yearFrom &&
    yom <= (v.yearTo || 9999)
  );

  if (hit) {
    const value = depreciate(hit.newPrice, age);
    return {
      value,
      source: 'lookup',
      label: `Estimated market value for ${make} ${model} (${yom})`,
    };
  }

  // Make-only fallback (average of that make's entries, or default)
  const makeHits = valuations.filter((v) => v.active && v.make.toLowerCase() === makeL);
  const newPrice = makeHits.length
    ? Math.round(makeHits.reduce((s, v) => s + v.newPrice, 0) / makeHits.length)
    : DEFAULT_NEW_PRICE;

  const value = depreciate(newPrice, age);
  return {
    value,
    source: 'estimate',
    label: makeHits.length
      ? `Estimated market value for ${make} (${yom}) — model not in guide`
      : `Generic estimated value for ${yom} vehicle — make/model not in guide`,
  };
}

module.exports = { estimateValue, depreciate };
