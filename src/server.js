require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  optionsSuccessStatus: 204
}));
app.use(express.json({ limit: '50kb' }));

// Health check – useful for Railway
app.get('/', (req, res) => res.json({ status: 'ok' }));

app.use('/api', rateLimit({ windowMs: 60_000, max: 60 }));
app.use('/api/quotes', require('./routes/quotes'));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong. Try again.' });
});

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error('MONGO_URI is missing. Copy .env.example to .env');
  process.exit(1);
}

mongoose
  .connect(uri)
  .then(() => {
    const port = process.env.PORT || 5000;
    app.listen(port, () => console.log(`API running on http://localhost:${port}`));
  })
  .catch((err) => {
    console.error('\nCould not connect to MongoDB.');
    console.error('  URI:', uri);
    console.error('  Error:', err.message);
    console.error('\nMongoDB is not running (or the URI is wrong).');
    console.error('  Local (Ubuntu):  sudo systemctl start mongod');
    console.error('                    sudo systemctl status mongod');
    console.error('  Or use free Atlas: https://www.mongodb.com/cloud/atlas');
    console.error('  Then put the connection string in server/.env as MONGO_URI\n');
    process.exit(1);
  });
