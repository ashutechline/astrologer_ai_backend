require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const config = require('../config/env');
const logger = require('../config/logger');
const City = require('../models/City');

async function seedCities() {
  const results = [];
  const csvFilePath = path.join(__dirname, '../../India Cities LatLng.csv');

  logger.info(`Starting to read CSV from: ${csvFilePath}`);

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (data) => {
        // Map CSV rows to the Mongoose schema
        results.push({
          city: data.city,
          lat: parseFloat(data.lat),
          lng: parseFloat(data.lng),
          country: data.country,
          iso2: data.iso2,
          admin_name: data.admin_name,
          capital: data.capital || null,
          population: data.population ? parseInt(data.population, 10) : null,
          population_proper: data.population_proper ? parseInt(data.population_proper, 10) : null,
        });
      })
      .on('end', async () => {
        logger.info(`CSV parsing finished. Found ${results.length} cities.`);
        try {
          let created = 0;
          for (const cityData of results) {
            // Upsert based on city name and state/admin_name to avoid duplicates
            const result = await City.updateOne(
              { city: cityData.city, admin_name: cityData.admin_name },
              { $setOnInsert: cityData },
              { upsert: true }
            );
            if (result.upsertedCount) created++;
          }
          logger.info(`Cities seeding complete: ${created} new cities inserted.`);
          resolve();
        } catch (error) {
          reject(error);
        }
      })
      .on('error', (error) => reject(error));
  });
}

async function run() {
  try {
    await mongoose.connect(config.mongo.uri);
    logger.info('Connected to MongoDB for seeding cities');

    await seedCities();

    logger.info('City seeding complete');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    logger.error(`City Seeding failed: ${err.message}`);
    process.exit(1);
  }
}

run();
