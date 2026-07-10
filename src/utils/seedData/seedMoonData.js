require('dotenv').config({ path: '../../.env' });
const mongoose = require('mongoose');
const MoonPhase = require('../../models/MoonPhase');
const Lunation = require('../../models/Lunation');
const config = require('../../config/env');

const moonPhasesData = [
  {
    phase: 'New Moon',
    title: 'The Seed of Intention',
    description: 'A time of darkness when the moon is not visible. This marks the beginning of the lunar cycle and is ideal for setting new intentions.',
    theme: 'New Beginnings',
    career: 'Good time to begin projects and plant seeds for future success.',
    love: 'Set intentions for new relationships or a fresh start in current ones.',
    health: 'Start healthier routines and clear out old habits.',
    finance: 'Plan future investments and create a new budget.',
    spiritual: 'Meditation, manifestation, and visualization of goals.',
    affirmation: 'I welcome new beginnings and set clear intentions for my future.',
  },
  {
    phase: 'Waxing Crescent',
    title: 'Taking the First Step',
    description: 'A thin sliver of light appears. It is a time to take action on the intentions set during the New Moon.',
    theme: 'Action & Momentum',
    career: 'Take the first tangible steps on your new projects.',
    love: 'Show initiative and communicate your desires.',
    health: 'Build energy and integrate new healthy habits gradually.',
    finance: 'Research and gather resources for your financial goals.',
    spiritual: 'Focus on growth and maintaining faith in your vision.',
    affirmation: 'I take confident steps towards manifesting my dreams.',
  },
  {
    phase: 'First Quarter',
    title: 'Overcoming Hurdles',
    description: 'The moon is half-illuminated. Challenges may arise, testing your commitment to your goals.',
    theme: 'Commitment & Action',
    career: 'Push through obstacles and make necessary adjustments.',
    love: 'Address any conflicts constructively to strengthen the bond.',
    health: 'Stay committed to your routine even if motivation wanes.',
    finance: 'Re-evaluate your budget and cut unnecessary expenses.',
    spiritual: 'Trust the process and build resilience.',
    affirmation: 'I am resilient and committed to my goals.',
  },
  {
    phase: 'Waxing Gibbous',
    title: 'Refining the Vision',
    description: 'The moon is almost full. This is a time for refinement, editing, and fine-tuning your plans.',
    theme: 'Refinement & Adjustment',
    career: 'Review your progress and perfect your ongoing work.',
    love: 'Deepen intimacy and communicate openly about needs.',
    health: 'Listen to your body and adjust your diet or exercise plan.',
    finance: 'Check on your investments and ensure you are on track.',
    spiritual: 'Practice gratitude and prepare for the culmination.',
    affirmation: 'I am flexible and open to adjusting my path for the highest good.',
  },
  {
    phase: 'Full Moon',
    title: 'The Culmination',
    description: 'The moon is fully illuminated, bringing hidden things to light. A time of completion, celebration, and release.',
    theme: 'Manifestation & Release',
    career: 'Celebrate your achievements and release what is not working.',
    love: 'Emotions run high; embrace passion and release toxic patterns.',
    health: 'Detoxify your body and release stress.',
    finance: 'Acknowledge your financial progress and release scarcity mindset.',
    spiritual: 'Release emotional baggage and perform forgiveness rituals.',
    affirmation: 'I release what no longer serves me and celebrate my abundance.',
  },
  {
    phase: 'Waning Gibbous',
    title: 'Sharing the Harvest',
    description: 'The light begins to decrease. A time for gratitude, sharing knowledge, and giving back.',
    theme: 'Gratitude & Sharing',
    career: 'Share your successes and mentor others.',
    love: 'Express gratitude for your partner and loved ones.',
    health: 'Focus on restorative practices and gentle movement.',
    finance: 'Share your wealth, donate, or help someone in need.',
    spiritual: 'Reflect on your journey and express deep gratitude.',
    affirmation: 'I am deeply grateful for all the blessings in my life.',
  },
  {
    phase: 'Last Quarter',
    title: 'Releasing the Old',
    description: 'The moon is half-illuminated again, but decreasing. A time of letting go, forgiveness, and clearing space.',
    theme: 'Release & Forgiveness',
    career: 'Wrap up loose ends and prepare to transition to new phases.',
    love: 'Forgive past hurts and release lingering resentments.',
    health: 'Clear out clutter in your physical space for better mental health.',
    finance: 'Pay off debts or finalize outstanding financial matters.',
    spiritual: 'Perform cord-cutting rituals and profound energetic cleansing.',
    affirmation: 'I release all blockages and make space for new energy.',
  },
  {
    phase: 'Waning Crescent',
    title: 'Rest and Surrender',
    description: 'Only a thin sliver remains. A time for deep rest, recuperation, and turning inward before the new cycle begins.',
    theme: 'Rest & Reflection',
    career: 'Take a break, avoid starting new tasks, and reflect on the past cycle.',
    love: 'Spend quiet time alone or engage in gentle connection.',
    health: 'Prioritize sleep, relaxation, and deep healing.',
    finance: 'Reflect on your financial habits without taking new action.',
    spiritual: 'Surrender to the flow of life and rest deeply in the void.',
    affirmation: 'I surrender to peace and allow myself to rest and recharge.',
  },
];

const lunationsData = [
  {
    type: 'New Moon',
    title: 'New Moon Blessings',
    description: 'The Sun and Moon align, marking a powerful moment to set intentions for the upcoming lunar cycle.',
    theme: 'New Beginnings',
    career: 'Excellent time for launching a new project or setting career goals.',
    love: 'A fresh start in relationships; good for a first date or renewed commitment.',
    health: 'Start a new health regimen or detox.',
    finance: 'Open a new savings account or set financial intentions.',
    spiritual: 'Highly potent for manifestation rituals and intention setting.',
    affirmation: 'I plant the seeds of my future with intention and clarity.',
  },
  {
    type: 'Full Moon',
    title: 'Full Moon Illumination',
    description: 'The Sun and Moon are opposite, bringing hidden truths to light and culminating past efforts.',
    theme: 'Culmination & Release',
    career: 'A project may come to fruition or reach a critical turning point.',
    love: 'Emotions are heightened; a time for romantic breakthroughs or necessary endings.',
    health: 'Release bad habits and focus on emotional well-being.',
    finance: 'Acknowledge financial growth or release debt-related stress.',
    spiritual: 'Ideal for release rituals, forgiveness, and cleansing crystals.',
    affirmation: 'I celebrate my growth and release all that no longer serves my highest good.',
  },
  {
    type: 'Solar Eclipse',
    title: 'Solar Eclipse Portal',
    description: 'A supercharged New Moon that brings sudden new beginnings, fated events, and major life changes.',
    theme: 'Karmic Beginnings',
    career: 'Unexpected career opportunities or sudden shifts in direction.',
    love: 'Fated meetings or sudden new chapters in partnerships.',
    health: 'A profound time to initiate a major lifestyle transformation.',
    finance: 'Sudden financial changes; be prepared for new paths to wealth.',
    spiritual: 'A powerful portal for rapid evolution and stepping into your destiny.',
    affirmation: 'I embrace unexpected changes and trust the unfolding of my destiny.',
  },
  {
    type: 'Lunar Eclipse',
    title: 'Lunar Eclipse Transformation',
    description: 'A supercharged Full Moon bringing major endings, sudden breakthroughs, and profound emotional release.',
    theme: 'Major Endings & Shifts',
    career: 'A job may suddenly end to make way for a better aligned path.',
    love: 'Karmic relationships may end or undergo a massive transformation.',
    health: 'A critical time for deep emotional and physical healing.',
    finance: 'Sudden shifts in financial stability; a call to reassess values.',
    spiritual: 'Deep karmic clearing; trust the universe as things fall away.',
    affirmation: 'I surrender to the flow of transformation and trust that all endings are new beginnings.',
  },
];

async function seedMoonData() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(config.mongo.uri);
    console.log('Connected to MongoDB.');

    console.log('Clearing existing MoonPhase and Lunation data...');
    await MoonPhase.deleteMany({});
    await Lunation.deleteMany({});

    console.log('Inserting MoonPhase data...');
    await MoonPhase.insertMany(moonPhasesData);
    
    console.log('Inserting Lunation data...');
    await Lunation.insertMany(lunationsData);

    console.log('Successfully seeded MoonPhase and Lunation data!');
  } catch (error) {
    console.error('Error seeding moon data:', error);
  } finally {
    mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

if (require.main === module) {
  seedMoonData();
}

module.exports = { seedMoonData };
