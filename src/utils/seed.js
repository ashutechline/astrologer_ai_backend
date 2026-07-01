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

async function seedSampleCalendarEvents() {
  const now = new Date();
  const sampleEvents = [
    {
      title: 'Full Moon in Sagittarius',
      type: 'full_moon',
      date: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      description: 'A full moon illuminating themes of truth, adventure, and expansion.',
      energyRating: 'amber',
    },
    {
      title: 'Mercury Retrograde Begins',
      type: 'retrograde_start',
      planet: 'mercury',
      date: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000),
      description: 'Expect communication mishaps and tech glitches -- double-check before sending.',
      energyRating: 'red',
    },
    {
      title: 'New Moon in Leo',
      type: 'new_moon',
      date: new Date(now.getTime() + 18 * 24 * 60 * 60 * 1000),
      description: 'A fresh start for creative self-expression and confidence.',
      energyRating: 'green',
    },
  ];

  for (const event of sampleEvents) {
    const exists = await CalendarEvent.findOne({ title: event.title, date: event.date });
    if (!exists) await CalendarEvent.create(event);
  }
  logger.info(`Calendar: ${sampleEvents.length} sample events ensured (extend with a real ephemeris-driven generator for production)`);
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
  await seedSampleCalendarEvents();

  logger.info('Seeding complete');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  logger.error(`Seeding failed: ${err.message}`);
  process.exit(1);
});
