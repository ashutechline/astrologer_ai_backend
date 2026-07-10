const { swisseph, PLANETS, julianDayUT } = require('./swissEphemerisClient');

/**
 * Calculates Moon Phase and related data based on exact elongation.
 * @param {Date} date The UTC Date object.
 * @returns {Promise<Object>} Moon phase data (phase, elongation, illumination, sign, age, etc.)
 */
async function getMoonPhaseData(date) {
  const jd = await julianDayUT(date);
  
  return new Promise((resolve, reject) => {
    // swe_pheno_ut provides phase angle, illumination, etc.
    swisseph.swe_pheno_ut(jd, swisseph.SE_MOON, swisseph.SEFLG_SWIEPH, (pheno) => {
      if (pheno.error) return reject(new Error(pheno.error));
      
      // Calculate sun and moon longitudes
      swisseph.swe_calc_ut(jd, swisseph.SE_SUN, swisseph.SEFLG_SWIEPH, (sunBody) => {
        if (sunBody.error) return reject(new Error(sunBody.error));
        
        swisseph.swe_calc_ut(jd, swisseph.SE_MOON, swisseph.SEFLG_SWIEPH, (moonBody) => {
          if (moonBody.error) return reject(new Error(moonBody.error));
          
          const sunLon = sunBody.longitude;
          const moonLon = moonBody.longitude;
          
          // Elongation: angular separation between Sun and Moon
          let elongation = moonLon - sunLon;
          if (elongation < 0) elongation += 360;
          
          // Phase determination based on elongation (45 degree increments)
          let phaseName = '';
          if (elongation < 45) {
            // New Moon is strictly at 0, but realistically up to ~45 for waxing crescent
            // To match standard phases more cleanly, we divide into 8 bins of 45 degrees
            // offset by 22.5 degrees so exact phase is in center of bin
            phaseName = 'New Moon';
          }
          
          let adjustedElongation = (elongation + 22.5) % 360;
          const phaseIndex = Math.floor(adjustedElongation / 45);
          const phaseNames = [
            'New Moon',
            'Waxing Crescent',
            'First Quarter',
            'Waxing Gibbous',
            'Full Moon',
            'Waning Gibbous',
            'Last Quarter',
            'Waning Crescent'
          ];
          phaseName = phaseNames[phaseIndex];

          const moonSign = calculateZodiacSign(moonLon);
          const sunSign = calculateZodiacSign(sunLon);
          
          // Approximating Moon Age (0-29.53 days). Elongation / 360 * 29.530588
          const moonAge = (elongation / 360) * 29.530588;

          resolve({
            date: date.toISOString(),
            phase: phaseName,
            moonSign,
            sunSign,
            moonLongitude: moonLon,
            sunLongitude: sunLon,
            illumination: pheno.phase_volume * 100, // 0 to 100
            moonAge,
            elongation,
            phaseAngle: pheno.phase_angle
          });
        });
      });
    });
  });
}

/**
 * Iteratively search forward to find the next N lunation events (New/Full moons and Eclipses).
 * Because exact lunation events occur at specific elongations (0° and 180°), we calculate forward.
 * @param {Date} startDate 
 * @param {number} months (approx limit)
 * @returns {Promise<Array>}
 */
async function getUpcomingLunations(startDate, months = 12) {
    // This is a simplified search using Swiss Ephemeris.
    // For a highly robust system, swe_sol_eclipse_when_glob / swe_lun_eclipse_when_loc can be used for eclipses.
    // And for exact New/Full Moons, root-finding based on swe_pheno.
    // Here we'll implement a fast step-based root-finder for the next N events.
    const events = [];
    let currentJd = await julianDayUT(startDate);
    const endJd = currentJd + (30 * months);
    
    // Moon moves ~12-13 degrees a day. So half a lunar month is ~14.7 days.
    // We can step forward by 1 day, detect crossing of 0 or 180 degrees elongation.
    let prevElongation = null;
    let prevJd = null;

    while (currentJd <= endJd) {
        const elongData = await getElongationAtJd(currentJd);
        const elong = elongData.elongation;
        
        if (prevElongation !== null) {
            // Check for New Moon (crossing 0)
            if (prevElongation > 300 && elong < 60) {
                const exactJd = await findExactElongation(prevJd, currentJd, 0);
                const isEclipse = await checkEclipse(exactJd, 'New Moon');
                const eventData = await getFullEventData(exactJd, isEclipse ? 'Solar Eclipse' : 'New Moon');
                events.push(eventData);
            }
            // Check for Full Moon (crossing 180)
            else if (prevElongation < 180 && elong >= 180) {
                const exactJd = await findExactElongation(prevJd, currentJd, 180);
                const isEclipse = await checkEclipse(exactJd, 'Full Moon');
                const eventData = await getFullEventData(exactJd, isEclipse ? 'Lunar Eclipse' : 'Full Moon');
                events.push(eventData);
            }
        }
        prevElongation = elong;
        prevJd = currentJd;
        currentJd += 1; // step 1 day
    }
    return events;
}

/**
 * Returns upcoming exact phases
 */
async function getUpcomingPhases(startDate, days = 30) {
    const phases = [];
    let currentJd = await julianDayUT(startDate);
    const endJd = currentJd + days;
    
    let prevElongation = null;
    let prevJd = null;

    // The 8 phases correspond to elongations: 0, 45, 90, 135, 180, 225, 270, 315
    const targets = [0, 45, 90, 135, 180, 225, 270, 315];
    const targetNames = [
        'New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous',
        'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'
    ];

    while (currentJd <= endJd) {
        const elongData = await getElongationAtJd(currentJd);
        const elong = elongData.elongation;
        
        if (prevElongation !== null) {
            for (let i = 0; i < targets.length; i++) {
                const t = targets[i];
                // Check if crossed target
                let crossed = false;
                if (t === 0) {
                    if (prevElongation > 300 && elong < 60) crossed = true;
                } else {
                    if (prevElongation < t && elong >= t) crossed = true;
                }

                if (crossed) {
                    const exactJd = await findExactElongation(prevJd, currentJd, t);
                    const eventData = await getFullPhaseData(exactJd, targetNames[i]);
                    phases.push(eventData);
                }
            }
        }
        prevElongation = elong;
        prevJd = currentJd;
        currentJd += 0.5; // half day steps to safely catch 45 deg crossings
    }
    
    // Sort chronologically just in case
    phases.sort((a, b) => new Date(a.date) - new Date(b.date));
    return phases;
}

// ---- Helpers ----

async function getElongationAtJd(jd) {
    return new Promise((resolve, reject) => {
        swisseph.swe_calc_ut(jd, swisseph.SE_SUN, swisseph.SEFLG_SWIEPH, (sunBody) => {
            if (sunBody.error) return reject(new Error(sunBody.error));
            swisseph.swe_calc_ut(jd, swisseph.SE_MOON, swisseph.SEFLG_SWIEPH, (moonBody) => {
                if (moonBody.error) return reject(new Error(moonBody.error));
                let elongation = moonBody.longitude - sunBody.longitude;
                if (elongation < 0) elongation += 360;
                resolve({ elongation, sunLon: sunBody.longitude, moonLon: moonBody.longitude });
            });
        });
    });
}

// Bisection method to find exact JD where elongation matches target
async function findExactElongation(jdStart, jdEnd, target, precision = 0.0001) {
    let low = jdStart;
    let high = jdEnd;
    let mid = (low + high) / 2;
    
    for (let i = 0; i < 20; i++) {
        mid = (low + high) / 2;
        const eData = await getElongationAtJd(mid);
        let e = eData.elongation;
        
        // Handle wraparound for New Moon (0 deg)
        let t = target;
        if (target === 0) {
             if (e > 180) e -= 360;
        }

        if (Math.abs(e - t) < precision) break;
        
        if (e < t) low = mid;
        else high = mid;
    }
    return mid;
}

// Returns Zodiac sign based on longitude (0-360)
function calculateZodiacSign(longitude) {
    const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
    const index = Math.floor(longitude / 30) % 12;
    return signs[index];
}

function jdToDate(jd) {
    // simplified JD to Date (UTC)
    const ms = (jd - 2440587.5) * 86400000;
    return new Date(ms);
}

// Very basic eclipse check based on distance to lunar nodes
// Sun and Moon must be near a node. Node moves slowly.
async function checkEclipse(jd, type) {
    return new Promise((resolve, reject) => {
        swisseph.swe_calc_ut(jd, swisseph.SE_TRUE_NODE, swisseph.SEFLG_SWIEPH, (nodeBody) => {
            if (nodeBody.error) return reject(new Error(nodeBody.error));
            const nodeLon = nodeBody.longitude;
            swisseph.swe_calc_ut(jd, swisseph.SE_SUN, swisseph.SEFLG_SWIEPH, (sunBody) => {
                 if (sunBody.error) return reject(new Error(sunBody.error));
                 const sunLon = sunBody.longitude;
                 
                 // Distance from Sun to Node (or South Node which is +180)
                 let dist = Math.abs(sunLon - nodeLon);
                 if (dist > 180) dist = 360 - dist;
                 
                 // If distance is less than ~15-18 degrees, it's an eclipse
                 // This is an approximation for solar/lunar eclipse limits
                 if (dist < 15) {
                     resolve(true);
                 } else if (Math.abs(dist - 180) < 15) {
                     resolve(true); // near South Node
                 } else {
                     resolve(false);
                 }
            });
        });
    });
}

async function getFullEventData(jd, type) {
    const date = jdToDate(jd);
    const data = await getElongationAtJd(jd);
    return {
        date: date.toISOString(),
        type,
        moonSign: calculateZodiacSign(data.moonLon),
        sunSign: calculateZodiacSign(data.sunLon),
        moonLongitude: data.moonLon,
        sunLongitude: data.sunLon
    };
}

async function getFullPhaseData(jd, phase) {
    const date = jdToDate(jd);
    const data = await getElongationAtJd(jd);
    return {
        date: date.toISOString(),
        phase,
        moonSign: calculateZodiacSign(data.moonLon),
        sunSign: calculateZodiacSign(data.sunLon),
        moonLongitude: data.moonLon,
        sunLongitude: data.sunLon
    };
}

module.exports = {
    getMoonPhaseData,
    getUpcomingLunations,
    getUpcomingPhases
};
