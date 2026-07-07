const {
  PLANETS,
  julianDayUT,
  calcPlanetUT,
  calcHouses,
  ayanamsaLahiri,
} = require('./swissEphemerisClient');
const { longitudeToSign, computeAspects } = require('./astrologyMath');

/**
 * Converts local birth date/time + UTC offset into a UTC Date.
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @param {string} timeStr - 'HH:mm' (24h), defaults to noon if unknown
 * @param {number} utcOffsetMinutes - e.g. IST = +330
 */
function toUtcDate(dateStr, timeStr, utcOffsetMinutes) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = (timeStr || '12:00').split(':').map(Number);
  // Build as if UTC, then subtract the offset to land on true UTC instant
  const localAsUtc = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  return new Date(localAsUtc.getTime() - utcOffsetMinutes * 60 * 1000);
}

/**
 * Finds which house a given longitude falls into based on house cusps.
 */
function getHouseForLongitude(planetLongitude, houses) {
  if (!houses || houses.length < 12) return null;
  for (let i = 0; i < 12; i++) {
    const currentCusp = houses[i].longitude;
    const nextCusp = houses[(i + 1) % 12].longitude;
    if (currentCusp <= nextCusp) {
      if (planetLongitude >= currentCusp && planetLongitude < nextCusp) return houses[i].house;
    } else {
      // Cusp crosses the 360/0 Aries point
      if (planetLongitude >= currentCusp || planetLongitude < nextCusp) return houses[i].house;
    }
  }
  return null;
}

/**
 * Computes a full natal chart: planet positions, house cusps, ascendant/MC, and aspects.
 *
 * @param {object} input
 * @param {string} input.date - 'YYYY-MM-DD'
 * @param {string} input.time - 'HH:mm', or null if birth time unknown
 * @param {number} input.latitude
 * @param {number} input.longitude
 * @param {number} input.utcOffsetMinutes
 * @param {string} input.houseSystem - 'placidus' | 'whole_sign' | 'koch' | 'equal'
 * @param {string} input.zodiacSystem - 'western' | 'vedic' | 'chinese'
 * @param {boolean} input.timeUnknown
 */
async function calculateNatalChart(input) {
  const {
    date,
    time,
    latitude,
    longitude,
    utcOffsetMinutes = 0,
    houseSystem = 'placidus',
    zodiacSystem = 'western',
    timeUnknown = false,
  } = input;

  const utcDate = toUtcDate(date, timeUnknown ? '12:00' : time, utcOffsetMinutes);
  const jd = await julianDayUT(utcDate);

  const ayanamsa = zodiacSystem === 'vedic' ? await ayanamsaLahiri(jd) : 0;

  // Planetary positions
  const planets = [];
  for (const planet of PLANETS) {
    const body = await calcPlanetUT(jd, planet.id);
    let lon = body.longitude;
    if (zodiacSystem === 'vedic') {
      lon = ((lon - ayanamsa) % 360 + 360) % 360;
    }
    const { sign, degreeInSign } = longitudeToSign(lon);
    planets.push({
      key: planet.key,
      name: planet.name,
      longitude: lon,
      sign,
      degreeInSign: Number(degreeInSign.toFixed(2)),
      speed: body.longitudeSpeed,
      retrograde: body.longitudeSpeed < 0,
    });
  }

  // Houses + angles — skipped/approximated when birth time is unknown, since houses
  // require an exact birth time to be meaningful (only Sun/Moon/planet signs remain valid).
  let houses = null;
  let ascendant = null;
  let midheaven = null;

  if (!timeUnknown) {
    const houseResult = await calcHouses(jd, latitude, longitude, houseSystem);
    let cusps = houseResult.cusps || houseResult.house || [];
    let asc = houseResult.ascendant ?? houseResult.ascmc?.[0];
    let mc = houseResult.mc ?? houseResult.ascmc?.[1];

    if (zodiacSystem === 'vedic') {
      cusps = cusps.map((c) => ((c - ayanamsa) % 360 + 360) % 360);
      asc = ((asc - ayanamsa) % 360 + 360) % 360;
      mc = ((mc - ayanamsa) % 360 + 360) % 360;
    }

    houses = cusps.map((cusp, idx) => {
      const { sign, degreeInSign } = longitudeToSign(cusp);
      return { house: idx + 1, longitude: cusp, sign, degreeInSign: Number(degreeInSign.toFixed(2)) };
    });

    ascendant = longitudeToSign(asc);
    midheaven = longitudeToSign(mc);

    // Assign house positions to each planet now that houses are calculated
    for (const planet of planets) {
      planet.house = getHouseForLongitude(planet.longitude, houses);
    }
  }

  const aspects = computeAspects(planets, planets, true);


  return {
    jd,
    timeUnknown,
    zodiacSystem,
    houseSystem,
    planets,
    houses,
    ascendant,
    midheaven,
    aspects,
    sunSign: planets.find((p) => p.key === 'sun')?.sign,
    moonSign: planets.find((p) => p.key === 'moon')?.sign,
    risingSign: ascendant?.sign ?? null,
  };
}

module.exports = { calculateNatalChart, toUtcDate };
