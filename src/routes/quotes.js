const router = require('express').Router();
const { Insurer, RateCard, Adjustment, Levy, VehicleValuation, Quote, COVERS, CLASSES } = require('../models');
const { rateQuote } = require('../services/ratingEngine');
const { estimateValue } = require('../services/valuation');

const DISCLAIMER = 'Online prices are estimates and carry a margin of error. The final premium may change after the insurer reviews and confirms your details. Vehicle value is estimated from make, model and year — not entered by you.';
const REG = /^K[A-Z]{2}\s?\d{3}[A-Z]$/i; // e.g. KDA 123A

function validate(b) {
  const e = {};
  const year = new Date().getFullYear();
  if (!REG.test(b.regNo || '')) e.regNo = 'Enter a valid registration, e.g. KDA 123A';
  if (!/^[A-Za-z0-9]{5,30}$/.test(b.chassisNo || '')) e.chassisNo = 'Chassis number must be 5-30 letters or digits';
  if (!b.make?.trim()) e.make = 'Enter the make';
  if (!b.model?.trim()) e.model = 'Enter the model';
  if (!(b.yom >= 1990 && b.yom <= year)) e.yom = `Year must be between 1990 and ${year}`;
  if (!CLASSES.includes(b.vehicleClass)) e.vehicleClass = 'Choose a vehicle use';
  if (!COVERS.includes(b.cover)) e.cover = 'Choose a cover type';
  return e;
}

router.post('/compare', async (req, res, next) => {
  try {
    const b = {
      ...req.body,
      yom: Number(req.body.yom),
      ncdYears: Number(req.body.ncdYears) || 0,
      addOns: Array.isArray(req.body.addOns) ? req.body.addOns : [],
    };
    const errors = validate(b);
    if (Object.keys(errors).length) return res.status(400).json({ errors });

    const valuations = await VehicleValuation.find({ active: true }).lean();
    const valuation = estimateValue({ make: b.make, model: b.model, yom: b.yom }, valuations);
    b.value = valuation.value;

    const [insurers, rateCards, adjustments, levies] = await Promise.all([
      Insurer.find({ active: true }).lean(),
      RateCard.find({ cover: b.cover, vehicleClass: b.vehicleClass, active: true }).lean(),
      Adjustment.find({ active: true }).lean(),
      Levy.find({ active: true }).lean(),
    ]);

    const results = rateQuote(b, { insurers, rateCards, adjustments, levies });

    await Quote.create({
      vehicle: {
        regNo: b.regNo.toUpperCase(),
        chassisNo: b.chassisNo.toUpperCase(),
        make: b.make,
        model: b.model,
        yom: b.yom,
        value: b.value,
      },
      vehicleClass: b.vehicleClass,
      cover: b.cover,
      ncdYears: b.ncdYears,
      results,
    });

    res.json({
      disclaimer: DISCLAIMER,
      valuation: {
        value: valuation.value,
        source: valuation.source,
        label: valuation.label,
      },
      results,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
