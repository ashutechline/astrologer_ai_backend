const SunCalc = require('suncalc');

const CHALDEAN_ORDER = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon'];
const DAY_RULERS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

function getPlanetaryHours(dateStr, lat, lon) {
  // Use noon UTC to avoid edge cases with timezones when determining the base date
  const baseDate = new Date(`${dateStr}T12:00:00Z`);
  const dayOfWeek = baseDate.getUTCDay();

  // Get times for the given date
  const times = SunCalc.getTimes(baseDate, lat, lon);
  const sunrise = times.sunrise;
  const sunset = times.sunset;

  // Get times for next day
  const nextDay = new Date(baseDate);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  const nextTimes = SunCalc.getTimes(nextDay, lat, lon);
  const nextSunrise = nextTimes.sunrise;

  // Duration of day and night hours in milliseconds
  const dayHourDuration = (sunset.getTime() - sunrise.getTime()) / 12;
  const nightHourDuration = (nextSunrise.getTime() - sunset.getTime()) / 12;

  let currentPlanetIndex = CHALDEAN_ORDER.indexOf(DAY_RULERS[dayOfWeek]);
  const hours = [];

  // Day Hours (1 to 12)
  for (let i = 0; i < 12; i++) {
    const start = new Date(sunrise.getTime() + i * dayHourDuration);
    const end = new Date(sunrise.getTime() + (i + 1) * dayHourDuration);
    hours.push({
      index: i + 1,
      isDay: true,
      planet: CHALDEAN_ORDER[currentPlanetIndex],
      startTime: start.toISOString(),
      endTime: end.toISOString()
    });
    currentPlanetIndex = (currentPlanetIndex + 1) % 7;
  }

  // Night Hours (13 to 24)
  for (let i = 0; i < 12; i++) {
    const start = new Date(sunset.getTime() + i * nightHourDuration);
    const end = new Date(sunset.getTime() + (i + 1) * nightHourDuration);
    hours.push({
      index: i + 13,
      isDay: false,
      planet: CHALDEAN_ORDER[currentPlanetIndex],
      startTime: start.toISOString(),
      endTime: end.toISOString()
    });
    currentPlanetIndex = (currentPlanetIndex + 1) % 7;
  }

  return hours;
}

console.log(getPlanetaryHours('2026-07-07', 28.6, 77.2).slice(0, 3));
console.log(getPlanetaryHours('2026-07-07', 28.6, 77.2).slice(12, 15));
