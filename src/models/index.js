const { Schema, model } = require('mongoose');

const COVERS = ['TPO', 'TPFT', 'COMPREHENSIVE'];
const CLASSES = ['PRIVATE', 'COMMERCIAL', 'PSV', 'MOTORCYCLE'];

const Insurer = model('Insurer', new Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  active: { type: Boolean, default: true },
  isDummy: { type: Boolean, default: false }, // true = test data, shown as "Demo rates" in the UI
}, { timestamps: true }));

const addOnSchema = new Schema({
  code: { type: String, required: true },       // e.g. PVT, EXCESS
  name: { type: String, required: true },
  type: { type: String, enum: ['percent', 'flat'], required: true },
  value: { type: Number, required: true },      // percent: fraction of sum insured (0.0025 = 0.25%)
  minimum: { type: Number, default: 0 },
}, { _id: false });

// One row = one insurer's pricing for one cover type + vehicle class.
// To go live: edit or replace these rows. No code changes.
const rateCardSchema = new Schema({
  insurer: { type: Schema.Types.ObjectId, ref: 'Insurer', required: true },
  cover: { type: String, enum: COVERS, required: true },
  vehicleClass: { type: String, enum: CLASSES, required: true },
  rate: Number,            // fraction of sum insured (0.04 = 4%); COMPREHENSIVE and TPFT
  flatPremium: Number,     // TPO only
  minPremium: { type: Number, default: 0 },
  minValue: { type: Number, default: 0 },
  maxValue: { type: Number, default: Number.MAX_SAFE_INTEGER },
  maxVehicleAge: { type: Number, default: 15 },
  excess: String,          // display text, e.g. "2.5% of value, min KES 15,000"
  benefits: [String],
  addOns: [addOnSchema],
  effectiveFrom: { type: Date, default: Date.now },
  effectiveTo: Date,
  active: { type: Boolean, default: true },
}, { timestamps: true });
rateCardSchema.index({ insurer: 1, cover: 1, vehicleClass: 1, active: 1 });
const RateCard = model('RateCard', rateCardSchema);

// NCD discounts and loadings. insurer = null applies to every insurer.
const Adjustment = model('Adjustment', new Schema({
  insurer: { type: Schema.Types.ObjectId, ref: 'Insurer', default: null },
  type: { type: String, enum: ['NCD', 'AGE_LOADING', 'MAKE_LOADING'], required: true },
  threshold: Number,       // NCD: claim-free years; AGE_LOADING: vehicle age in years
  make: String,            // MAKE_LOADING only
  percent: { type: Number, required: true }, // fraction (0.1 = 10%)
  active: { type: Boolean, default: true },
}));

// Statutory levies, applied to the premium. Verify current values with IRA.
const Levy = model('Levy', new Schema({
  code: { type: String, required: true, unique: true },
  name: String,
  type: { type: String, enum: ['percent', 'flat'], required: true },
  value: { type: Number, required: true },
  active: { type: Boolean, default: true },
}));

// Guide prices for common vehicles. newPrice = approximate showroom price when new.
// Used to derive sum insured so the customer does not enter a value.
const VehicleValuation = model('VehicleValuation', new Schema({
  make: { type: String, required: true },
  model: { type: String, required: true },
  yearFrom: { type: Number, required: true },
  yearTo: { type: Number }, // open-ended if omitted
  newPrice: { type: Number, required: true }, // KES when new
  active: { type: Boolean, default: true },
}, { timestamps: true }));
VehicleValuation.schema.index({ make: 1, model: 1, yearFrom: 1 });

const Quote = model('Quote', new Schema({
  vehicle: { regNo: String, chassisNo: String, make: String, model: String, yom: Number, value: Number },
  vehicleClass: String,
  cover: String,
  ncdYears: Number,
  results: [Schema.Types.Mixed],
}, { timestamps: true }));

module.exports = { Insurer, RateCard, Adjustment, Levy, VehicleValuation, Quote, COVERS, CLASSES };
