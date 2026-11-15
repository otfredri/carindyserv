// DUMMY DATA FOR TESTING ONLY. These are NOT real insurer rates or official valuations.
// Names are for demo comparison only. Replace with real rate cards once onboarded.
require('dotenv').config();
const mongoose = require('mongoose');
const { Insurer, RateCard, Adjustment, Levy, VehicleValuation } = require('./models');

// 5 providers with deliberately different rates so side-by-side comparison is meaningful
const demo = [
  {
    name: 'Britam',
    slug: 'britam',
    rate: 0.038,   // comprehensive % of value
    min: 28000,
    tpo: 7000,
    excess: '0.5% of value, min KES 12,000',
    benefits: ['Accident, fire & theft', 'Windscreen up to KES 30,000', 'Towing up to KES 15,000', 'Radio cassette cover'],
  },
  {
    name: 'AAR Insurance',
    slug: 'aar',
    rate: 0.042,
    min: 25000,
    tpo: 6500,
    excess: '1% of value, min KES 10,000',
    benefits: ['Accident, fire & theft', 'Windscreen cover', 'Emergency medical expenses', 'Towing up to KES 10,000'],
  },
  {
    name: 'Directline Assurance',
    slug: 'directline',
    rate: 0.035,
    min: 22000,
    tpo: 6000,
    excess: '0.5% of value, min KES 10,000',
    benefits: ['Accident, fire & theft', 'Windscreen cover', 'Towing up to KES 12,000'],
  },
  {
    name: 'Jubilee Insurance',
    slug: 'jubilee',
    rate: 0.045,
    min: 30000,
    tpo: 8000,
    excess: '2.5% of value, min KES 15,000',
    benefits: ['Accident, fire & theft', 'Windscreen up to KES 50,000', 'Courtesy car (7 days)', 'Towing up to KES 20,000'],
  },
  {
    name: 'CIC Insurance',
    slug: 'cic',
    rate: 0.040,
    min: 26000,
    tpo: 7200,
    excess: '1% of value, min KES 12,000',
    benefits: ['Accident, fire & theft', 'Windscreen cover', 'Political violence optional', 'Towing up to KES 10,000'],
  },
];

const addOns = [
  { code: 'PVT', name: 'Political violence & terrorism', type: 'percent', value: 0.0025, minimum: 2500 },
  { code: 'EXCESS', name: 'Excess protector', type: 'percent', value: 0.0025, minimum: 3000 },
];

// Approximate new prices (KES) for common Kenyan private cars — demo valuation only
const valuations = [
  { make: 'Toyota', model: 'Axio', yearFrom: 2010, yearTo: 2015, newPrice: 2200000 },
  { make: 'Toyota', model: 'Axio', yearFrom: 2016, yearTo: 2020, newPrice: 2800000 },
  { make: 'Toyota', model: 'Axio', yearFrom: 2021, newPrice: 3500000 },
  { make: 'Toyota', model: 'Fielder', yearFrom: 2010, yearTo: 2015, newPrice: 2400000 },
  { make: 'Toyota', model: 'Fielder', yearFrom: 2016, yearTo: 2020, newPrice: 3000000 },
  { make: 'Toyota', model: 'Fielder', yearFrom: 2021, newPrice: 3800000 },
  { make: 'Toyota', model: 'Premio', yearFrom: 2010, yearTo: 2016, newPrice: 3200000 },
  { make: 'Toyota', model: 'Premio', yearFrom: 2017, newPrice: 4200000 },
  { make: 'Toyota', model: 'Vitz', yearFrom: 2010, yearTo: 2015, newPrice: 1500000 },
  { make: 'Toyota', model: 'Vitz', yearFrom: 2016, newPrice: 2000000 },
  { make: 'Toyota', model: 'Hilux', yearFrom: 2010, yearTo: 2015, newPrice: 4500000 },
  { make: 'Toyota', model: 'Hilux', yearFrom: 2016, newPrice: 6500000 },
  { make: 'Toyota', model: 'Land Cruiser', yearFrom: 2010, yearTo: 2015, newPrice: 9000000 },
  { make: 'Toyota', model: 'Land Cruiser', yearFrom: 2016, newPrice: 14000000 },
  { make: 'Nissan', model: 'Note', yearFrom: 2010, yearTo: 2016, newPrice: 1800000 },
  { make: 'Nissan', model: 'Note', yearFrom: 2017, newPrice: 2400000 },
  { make: 'Nissan', model: 'X-Trail', yearFrom: 2010, yearTo: 2015, newPrice: 3800000 },
  { make: 'Nissan', model: 'X-Trail', yearFrom: 2016, newPrice: 5200000 },
  { make: 'Mazda', model: 'Demio', yearFrom: 2010, yearTo: 2015, newPrice: 1600000 },
  { make: 'Mazda', model: 'Demio', yearFrom: 2016, newPrice: 2100000 },
  { make: 'Mazda', model: 'CX-5', yearFrom: 2012, yearTo: 2017, newPrice: 4000000 },
  { make: 'Mazda', model: 'CX-5', yearFrom: 2018, newPrice: 5500000 },
  { make: 'Subaru', model: 'Impreza', yearFrom: 2010, yearTo: 2016, newPrice: 2800000 },
  { make: 'Subaru', model: 'Forester', yearFrom: 2010, yearTo: 2015, newPrice: 3500000 },
  { make: 'Subaru', model: 'Forester', yearFrom: 2016, newPrice: 4800000 },
  { make: 'Honda', model: 'Fit', yearFrom: 2010, yearTo: 2015, newPrice: 1700000 },
  { make: 'Honda', model: 'Fit', yearFrom: 2016, newPrice: 2300000 },
  { make: 'Honda', model: 'CR-V', yearFrom: 2010, yearTo: 2015, newPrice: 4200000 },
  { make: 'Honda', model: 'CR-V', yearFrom: 2016, newPrice: 5800000 },
  { make: 'Mitsubishi', model: 'Outlander', yearFrom: 2010, yearTo: 2015, newPrice: 3600000 },
  { make: 'Mitsubishi', model: 'Outlander', yearFrom: 2016, newPrice: 5000000 },
  { make: 'Volkswagen', model: 'Golf', yearFrom: 2010, yearTo: 2015, newPrice: 2800000 },
  { make: 'Volkswagen', model: 'Golf', yearFrom: 2016, newPrice: 3800000 },
  { make: 'Toyota', model: 'Vanguard', yearFrom: 2008, yearTo: 2015, newPrice: 3800000 },
  { make: 'Toyota', model: 'Noah', yearFrom: 2010, yearTo: 2015, newPrice: 2600000 },
  { make: 'Toyota', model: 'Noah', yearFrom: 2016, newPrice: 3600000 },
  { make: 'Toyota', model: 'Harrier', yearFrom: 2010, yearTo: 2016, newPrice: 4500000 },
  { make: 'Toyota', model: 'Harrier', yearFrom: 2017, newPrice: 6000000 },
  { make: 'Toyota', model: 'Sienta', yearFrom: 2010, newPrice: 2400000 },
  { make: 'Toyota', model: 'Wish', yearFrom: 2009, yearTo: 2016, newPrice: 2500000 },
  { make: 'Toyota', model: 'Probox', yearFrom: 2005, newPrice: 1700000 },
  { make: 'Toyota', model: 'Succeed', yearFrom: 2005, newPrice: 1800000 },
  { make: 'Toyota', model: 'Raum', yearFrom: 2003, yearTo: 2011, newPrice: 2000000 },
  { make: 'Toyota', model: 'Belta', yearFrom: 2005, yearTo: 2012, newPrice: 1500000 },
  { make: 'Toyota', model: 'RunX', yearFrom: 2000, yearTo: 2006, newPrice: 1800000 },
  { make: 'Toyota', model: 'Hiace', yearFrom: 2010, newPrice: 5000000 },
  { make: 'Toyota', model: 'Prado', yearFrom: 2003, yearTo: 2009, newPrice: 6500000 },
  { make: 'Toyota', model: 'Prado', yearFrom: 2010, newPrice: 9500000 },
  { make: 'Nissan', model: 'Wingroad', yearFrom: 2005, newPrice: 1800000 },
  { make: 'Nissan', model: 'Murano', yearFrom: 2008, newPrice: 4200000 },
  { make: 'Mitsubishi', model: 'Pajero', yearFrom: 2000, yearTo: 2010, newPrice: 5500000 },
  { make: 'Mitsubishi', model: 'Pajero Sport', yearFrom: 2005, newPrice: 4500000 },
  { make: 'Volkswagen', model: 'Polo', yearFrom: 2010, newPrice: 2200000 },
  { make: 'Suzuki', model: 'Escudo', yearFrom: 2000, yearTo: 2008, newPrice: 3000000 },
  { make: 'Suzuki', model: 'Wagon R', yearFrom: 2010, newPrice: 1300000 },
  { make: 'Land Rover', model: 'Range Rover Sport', yearFrom: 2014, newPrice: 14000000 },
  { make: 'Mercedes-Benz', model: 'C180', yearFrom: 2014, newPrice: 6500000 },
  { make: 'Toyota', model: 'Allion', yearFrom: 2010, yearTo: 2016, newPrice: 3000000 },
  { make: 'Toyota', model: 'Mark X', yearFrom: 2010, yearTo: 2016, newPrice: 4200000 },
  { make: 'Toyota', model: 'RAV4', yearFrom: 2010, yearTo: 2015, newPrice: 4000000 },
  { make: 'Toyota', model: 'RAV4', yearFrom: 2016, newPrice: 5800000 },
  { make: 'Toyota', model: 'Passo', yearFrom: 2010, newPrice: 1600000 },
  { make: 'Toyota', model: 'Auris', yearFrom: 2010, newPrice: 2600000 },
  { make: 'Toyota', model: 'Rush', yearFrom: 2010, newPrice: 2800000 },
  { make: 'Toyota', model: 'NZE', yearFrom: 2002, yearTo: 2014, newPrice: 2000000 },
  { make: 'Nissan', model: 'Tiida', yearFrom: 2010, newPrice: 2000000 },
  { make: 'Nissan', model: 'Juke', yearFrom: 2011, newPrice: 3200000 },
  { make: 'Nissan', model: 'Serena', yearFrom: 2010, newPrice: 3500000 },
  { make: 'Nissan', model: 'Navara', yearFrom: 2010, newPrice: 4800000 },
  { make: 'Mazda', model: 'Axela', yearFrom: 2010, newPrice: 2800000 },
  { make: 'Mazda', model: 'Atenza', yearFrom: 2010, newPrice: 3600000 },
  { make: 'Subaru', model: 'Legacy', yearFrom: 2010, newPrice: 3800000 },
  { make: 'Subaru', model: 'XV', yearFrom: 2012, newPrice: 4200000 },
  { make: 'Honda', model: 'Vezel', yearFrom: 2014, newPrice: 3400000 },
  { make: 'Isuzu', model: 'D-Max', yearFrom: 2012, newPrice: 4800000 },
];

(async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI is not set. Copy .env.example to .env and ensure MongoDB is running.');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
  } catch (err) {
    console.error('\nCould not connect to MongoDB.');
    console.error('  URI:', uri);
    console.error('  Error:', err.message);
    console.error('\nStart MongoDB locally, or use a free Atlas cluster and put its connection string in .env');
    console.error('  Local (Ubuntu):  sudo systemctl start mongod');
    console.error('  Atlas:           https://www.mongodb.com/cloud/atlas → free M0 cluster → Connect → Drivers\n');
    process.exit(1);
  }

  await Promise.all(
    [Insurer, RateCard, Adjustment, Levy, VehicleValuation].map((m) => m.deleteMany({}))
  );

  for (const d of demo) {
    const ins = await Insurer.create({ name: d.name, slug: d.slug, isDummy: true });
    const base = {
      insurer: ins._id,
      vehicleClass: 'PRIVATE',
      maxVehicleAge: 15,
      minValue: 300000,
      maxValue: 15000000,
    };
    await RateCard.insertMany([
      {
        ...base,
        cover: 'COMPREHENSIVE',
        rate: d.rate,
        minPremium: d.min,
        addOns,
        excess: d.excess,
        benefits: d.benefits,
      },
      {
        ...base,
        cover: 'TPFT',
        rate: d.rate * 0.55,
        minPremium: Math.round(d.min * 0.6),
        addOns: [],
        excess: 'Not applicable',
        benefits: ['Third party liability', 'Fire & theft of own vehicle'],
      },
      {
        ...base,
        cover: 'TPO',
        flatPremium: d.tpo,
        minValue: 0,
        maxValue: 1e12,
        addOns: [],
        excess: 'Not applicable',
        benefits: ['Third party injury & property damage'],
      },
    ]);
  }

  await Adjustment.insertMany([
    { type: 'NCD', threshold: 1, percent: 0.10 },
    { type: 'NCD', threshold: 2, percent: 0.20 },
    { type: 'NCD', threshold: 3, percent: 0.30 },
    { type: 'AGE_LOADING', threshold: 8, percent: 0.10 },
    { type: 'AGE_LOADING', threshold: 12, percent: 0.20 },
    { type: 'MAKE_LOADING', make: 'Toyota', percent: 0.05 },
  ]);

  await Levy.insertMany([
    { code: 'ITL', name: 'Training levy', type: 'percent', value: 0.002 },
    { code: 'PCF', name: 'Policyholders compensation fund', type: 'percent', value: 0.0025 },
    { code: 'STAMP', name: 'Stamp duty', type: 'flat', value: 40 },
  ]);

  await VehicleValuation.insertMany(valuations);

  console.log('Seeded 5 demo insurers (Britam, AAR, Directline, Jubilee, CIC) + valuations');
  await mongoose.disconnect();
})();
