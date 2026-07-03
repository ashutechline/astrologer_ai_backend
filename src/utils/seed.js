/**
 * Run with: npm run seed
 * Populates reference/static content the app needs to function: tarot deck, angel numbers,
 * moon rituals, the Learn module's reference library + sample courses, today's quiz question,
 * and a couple of sample calendar events. Safe to re-run -- uses upserts, won't duplicate data.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const config = require('../config/env');
const logger = require('../config/logger');

const { TarotCard, MoonRitual, AngelNumber, CalendarEvent } = require('../models/Content');
const { Course, ReferenceEntry, QuizQuestion } = require('../models/Learn');

const tarotCards = require('./seedData/tarotCards');
const { angelNumbers, moonRituals } = require('./seedData/angelNumbersAndRituals');
const { planets, signs, houses, aspects } = require('./seedData/referenceLibrary');
const { courses, quizQuestionPool } = require('./seedData/coursesAndQuiz');

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

async function seedTarotDeck() {
  let created = 0;
  for (const card of tarotCards) {
    const result = await TarotCard.updateOne({ name: card.name }, { $setOnInsert: card }, { upsert: true });
    if (result.upsertedCount) created++;
  }
  logger.info(`Tarot deck: ${created} new cards inserted (${tarotCards.length} total in seed set)`);
}

async function seedAngelNumbers() {
  let created = 0;
  for (const entry of angelNumbers) {
    const result = await AngelNumber.updateOne({ number: entry.number }, { $setOnInsert: entry }, { upsert: true });
    if (result.upsertedCount) created++;
  }
  logger.info(`Angel numbers: ${created} new entries inserted`);
}

async function seedMoonRituals() {
  for (const ritual of moonRituals) {
    await MoonRitual.updateOne({ phase: ritual.phase }, { $set: ritual }, { upsert: true });
  }
  logger.info(`Moon rituals: ${moonRituals.length} entries upserted (new + full)`);
}

async function seedReferenceLibrary() {
  const all = [
    ...planets.map((e) => ({ ...e, category: 'planets' })),
    ...signs.map((e) => ({ ...e, category: 'signs' })),
    ...houses.map((e) => ({ ...e, category: 'houses' })),
    ...aspects.map((e) => ({ ...e, category: 'aspects' })),
  ];
  for (const entry of all) {
    await ReferenceEntry.updateOne({ category: entry.category, key: entry.key }, { $set: entry }, { upsert: true });
  }
  logger.info(`Reference library: ${all.length} entries upserted across planets/signs/houses/aspects`);
}

async function seedCourses() {
  let created = 0;
  for (const course of courses) {
    const result = await Course.updateOne({ title: course.title }, { $setOnInsert: course }, { upsert: true });
    if (result.upsertedCount) created++;
  }
  logger.info(`Courses: ${created} new courses inserted`);
}

async function seedTodaysQuiz() {
  const dateKey = todayKey();
  const existing = await QuizQuestion.findOne({ date: dateKey });
  if (existing) {
    logger.info("Quiz: today's question already exists, skipping");
    return;
  }
  const pick = quizQuestionPool[Math.floor(Math.random() * quizQuestionPool.length)];
  await QuizQuestion.create({ ...pick, date: dateKey });
  logger.info(`Quiz: seeded today's question (${dateKey})`);
}

async function seedRealCalendarEvents() {
  const { calculateCurrentSky } = require('../services/ephemeris/transitService');

  // Clear old events to avoid duplicates when re-seeding
  await CalendarEvent.deleteMany({});

  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);

  const daysToScan = 90;
  const events = [];

  let prevPlanets = null;

  for (let i = 0; i <= daysToScan; i++) {
    const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    const { planets } = await calculateCurrentSky(d);

    if (prevPlanets) {
      // Find Ingresses and Retrogrades
      for (const p of planets) {
        const prev = prevPlanets.find((x) => x.key === p.key);
        if (!prev) continue;

        // Ingress check
        if (['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'].includes(p.key)) {
          if (prev.sign !== p.sign) {
            events.push({
              title: `${p.name} enters ${p.sign}`,
              type: 'ingress',
              date: d,
              description: `${p.name} moves into ${p.sign}, shifting the cosmic energy.`,
              energyRating: 'amber',
            });
          }
        }

        // Retrograde checks
        if (['mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'].includes(p.key)) {
          if (prev.speed >= 0 && p.speed < 0) {
            events.push({
              title: `${p.name} turns Retrograde`,
              type: 'retrograde_start',
              planet: p.key,
              date: d,
              description: `${p.name} begins its retrograde motion. Time to review and reflect.`,
              energyRating: 'red',
            });
          } else if (prev.speed < 0 && p.speed >= 0) {
            events.push({
              title: `${p.name} turns Direct`,
              type: 'retrograde_end',
              planet: p.key,
              date: d,
              description: `${p.name} stations direct. Forward momentum resumes.`,
              energyRating: 'green',
            });
          }
        }
      }

      // Find Lunations (New/Full Moon)
      const prevSun = prevPlanets.find((p) => p.key === 'sun');
      const prevMoon = prevPlanets.find((p) => p.key === 'moon');
      const curSun = planets.find((p) => p.key === 'sun');
      const curMoon = planets.find((p) => p.key === 'moon');

      if (prevSun && prevMoon && curSun && curMoon) {
        const prevElong = (prevMoon.longitude - prevSun.longitude + 360) % 360;
        const curElong = (curMoon.longitude - curSun.longitude + 360) % 360;

        // New Moon: elongation crosses 0
        if (prevElong > 340 && curElong < 20) {
          events.push({
            title: `New Moon in ${curMoon.sign}`,
            type: 'new_moon',
            date: d,
            description: `A fresh start for creative self-expression and confidence.`,
            energyRating: 'green',
          });
        }

        // Full Moon: elongation crosses 180
        if (prevElong < 180 && curElong >= 180) {
          events.push({
            title: `Full Moon in ${curMoon.sign}`,
            type: 'full_moon',
            date: d,
            description: `A full moon illuminating themes of truth and expansion.`,
            energyRating: 'amber',
          });
        }
      }
    }

    prevPlanets = planets;
  }

  for (const event of events) {
    await CalendarEvent.create(event);
  }

  logger.info(`Calendar: Generated ${events.length} real ephemeris events for the next ${daysToScan} days.`);
}

async function run() {
  await mongoose.connect(config.mongo.uri);
  logger.info('Connected to MongoDB for seeding');

  await seedTarotDeck();
  await seedAngelNumbers();
  await seedMoonRituals();
  await seedReferenceLibrary();
  await seedCourses();
  await seedTodaysQuiz();
  await seedRealCalendarEvents();

  logger.info('Seeding complete');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  logger.error(`Seeding failed: ${err.message}`);
  process.exit(1);
});
