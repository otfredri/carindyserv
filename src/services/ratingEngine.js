// Pure function: no database access, so it is easy to test and to reuse
// if an insurer later gives you a pricing API.
const round = (n) => Math.round(n);
const isLive = (c, now) =>
  c.active && new Date(c.effectiveFrom) <= now && (!c.effectiveTo || new Date(c.effectiveTo) >= now);

function rateQuote(input, data, now = new Date()) {
  const { value, yom, make, cover, vehicleClass, ncdYears = 0, addOns = [] } = input;
  const age = now.getFullYear() - yom;
  const results = [];

  for (const insurer of data.insurers) {
    const card = data.rateCards.find(
      (c) => String(c.insurer) === String(insurer._id) && c.cover === cover &&
             c.vehicleClass === vehicleClass && isLive(c, now));
    if (!card) continue;
    if (age > card.maxVehicleAge || value < card.minValue || value > card.maxValue) continue;

    const adj = data.adjustments.filter((a) => a.active && (!a.insurer || String(a.insurer) === String(insurer._id)));
    const lines = [];

    // 1. Base premium
    const base = cover === 'TPO' ? card.flatPremium : Math.max(value * card.rate, card.minPremium);
    lines.push({ label: cover === 'TPO' ? 'Third party premium' : 'Basic premium', amount: round(base) });

    // 2. Loadings (largest matching age band + any make loading)
    let loadPct = 0;
    const ageAdj = adj.filter((a) => a.type === 'AGE_LOADING' && age >= a.threshold)
      .sort((a, b) => b.threshold - a.threshold)[0];
    if (ageAdj) loadPct += ageAdj.percent;
    const makeAdj = adj.find((a) => a.type === 'MAKE_LOADING' && a.make?.toLowerCase() === make.toLowerCase());
    if (makeAdj) loadPct += makeAdj.percent;
    if (loadPct) lines.push({ label: 'Risk loadings (vehicle age / make)', amount: round(base * loadPct) });
    const loaded = base * (1 + loadPct);

    // 3. No-claim discount (comprehensive only)
    let ncd = 0;
    if (cover === 'COMPREHENSIVE') {
      const n = adj.filter((a) => a.type === 'NCD' && ncdYears >= a.threshold)
        .sort((a, b) => b.threshold - a.threshold)[0];
      if (n) { ncd = loaded * n.percent; lines.push({ label: 'No-claim discount', amount: -round(ncd) }); }
    }
    const net = loaded - ncd;

    // 4. Optional extras the customer selected
    let extras = 0;
    for (const a of card.addOns.filter((x) => addOns.includes(x.code))) {
      const amt = a.type === 'percent' ? Math.max(value * a.value, a.minimum) : a.value;
      extras += amt;
      lines.push({ label: a.name, amount: round(amt) });
    }

    // 5. Levies on the premium
    const premium = net + extras;
    let levies = 0;
    for (const l of data.levies.filter((x) => x.active)) {
      const amt = l.type === 'percent' ? premium * l.value : l.value;
      levies += amt;
      lines.push({ label: l.name, amount: round(amt) });
    }

    results.push({
      insurerId: insurer._id, insurer: insurer.name, isDummy: insurer.isDummy,
      cover, excess: card.excess, benefits: card.benefits,
      breakdown: lines, total: round(premium + levies),
    });
  }
  return results.sort((a, b) => a.total - b.total);
}

module.exports = { rateQuote };
