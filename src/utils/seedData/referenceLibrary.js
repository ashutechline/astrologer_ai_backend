const planets = [
  { key: 'sun', title: 'Sun', summary: 'Core identity and life force.', body: 'The Sun represents your core identity, ego, and the basic energy that drives you through life. Its sign describes your fundamental character and what you need to feel vital and seen.' },
  { key: 'moon', title: 'Moon', summary: 'Emotions and inner needs.', body: 'The Moon governs emotional responses, instincts, and what makes you feel safe. Its sign reveals how you process feelings and what you need to feel nurtured.' },
  { key: 'mercury', title: 'Mercury', summary: 'Communication and thought.', body: 'Mercury rules how you think, communicate, and process information. Its sign shapes your communication style and learning preferences.' },
  { key: 'venus', title: 'Venus', summary: 'Love, beauty, and values.', body: 'Venus governs attraction, love, aesthetics, and what you value. Its sign describes your romantic style and what brings you pleasure.' },
  { key: 'mars', title: 'Mars', summary: 'Drive, action, and desire.', body: 'Mars represents assertiveness, ambition, and how you pursue what you want. Its sign shapes your approach to conflict and motivation.' },
  { key: 'jupiter', title: 'Jupiter', summary: 'Growth, luck, and expansion.', body: 'Jupiter rules expansion, optimism, and the areas of life where you naturally grow and find opportunity. Its sign points to where you experience abundance.' },
  { key: 'saturn', title: 'Saturn', summary: 'Discipline, structure, and lessons.', body: 'Saturn represents responsibility, limitation, and long-term mastery. Its sign and house point to where you face the most growth through discipline.' },
  { key: 'uranus', title: 'Uranus', summary: 'Innovation and disruption.', body: 'Uranus governs sudden change, originality, and rebellion against convention. Its generational sign placement shapes broad cultural shifts.' },
  { key: 'neptune', title: 'Neptune', summary: 'Dreams, intuition, and illusion.', body: 'Neptune rules imagination, spirituality, and the dissolving of boundaries. It can bring inspiration or confusion depending on placement.' },
  { key: 'pluto', title: 'Pluto', summary: 'Transformation and power.', body: 'Pluto represents deep transformation, power dynamics, and what must be destroyed to be reborn. Its placement points to areas of profound change.' },
];

const signs = [
  { key: 'aries', title: 'Aries', summary: 'The pioneer -- bold, direct, energetic.', body: 'Aries is the first sign of the zodiac, ruled by Mars. Cardinal fire energy that initiates action with courage and impatience for results.' },
  { key: 'taurus', title: 'Taurus', summary: 'The builder -- steady, sensual, persistent.', body: 'Taurus is ruled by Venus, an earth sign valuing stability, comfort, and the pleasures of the physical world.' },
  { key: 'gemini', title: 'Gemini', summary: 'The communicator -- curious, adaptable, witty.', body: 'Gemini is ruled by Mercury, an air sign thriving on variety, conversation, and the exchange of ideas.' },
  { key: 'cancer', title: 'Cancer', summary: 'The nurturer -- emotional, protective, intuitive.', body: 'Cancer is ruled by the Moon, a water sign deeply attuned to emotional currents and the need for security at home.' },
  { key: 'leo', title: 'Leo', summary: 'The performer -- confident, generous, dramatic.', body: 'Leo is ruled by the Sun, a fixed fire sign that shines through creative self-expression and a need to be seen.' },
  { key: 'virgo', title: 'Virgo', summary: 'The analyst -- meticulous, practical, helpful.', body: 'Virgo is ruled by Mercury, an earth sign focused on refinement, service, and attention to detail.' },
  { key: 'libra', title: 'Libra', summary: 'The diplomat -- harmonious, fair, relational.', body: 'Libra is ruled by Venus, an air sign seeking balance, beauty, and meaningful partnership.' },
  { key: 'scorpio', title: 'Scorpio', summary: 'The alchemist -- intense, private, transformative.', body: 'Scorpio is ruled by Pluto (traditionally Mars), a fixed water sign drawn to depth, intimacy, and hidden truths.' },
  { key: 'sagittarius', title: 'Sagittarius', summary: 'The explorer -- adventurous, philosophical, optimistic.', body: 'Sagittarius is ruled by Jupiter, a fire sign seeking expansion through travel, learning, and big-picture meaning.' },
  { key: 'capricorn', title: 'Capricorn', summary: 'The achiever -- ambitious, disciplined, enduring.', body: 'Capricorn is ruled by Saturn, an earth sign building long-term success through patience and structure.' },
  { key: 'aquarius', title: 'Aquarius', summary: 'The innovator -- independent, idealistic, unconventional.', body: 'Aquarius is ruled by Uranus (traditionally Saturn), an air sign focused on collective progress and individuality.' },
  { key: 'pisces', title: 'Pisces', summary: 'The dreamer -- compassionate, imaginative, intuitive.', body: 'Pisces is ruled by Neptune (traditionally Jupiter), a mutable water sign attuned to empathy, art, and the unseen.' },
];

const houses = [
  { key: 'house_1', title: '1st House -- Self', summary: 'Identity, appearance, first impressions.', body: 'The 1st House, ruled by the Ascendant, governs your outward identity, physical presentation, and how you initiate new experiences.' },
  { key: 'house_2', title: '2nd House -- Resources', summary: 'Money, possessions, self-worth.', body: 'The 2nd House relates to material security, personal finances, and your sense of self-worth.' },
  { key: 'house_3', title: '3rd House -- Communication', summary: 'Siblings, learning, local environment.', body: 'The 3rd House covers everyday communication, short trips, siblings, and early education.' },
  { key: 'house_4', title: '4th House -- Home', summary: 'Family, roots, emotional foundation.', body: 'The 4th House, at the bottom of the chart, represents home, family lineage, and your private emotional foundation.' },
  { key: 'house_5', title: '5th House -- Creativity', summary: 'Romance, pleasure, self-expression.', body: 'The 5th House governs creative self-expression, romance, joy, and recreation.' },
  { key: 'house_6', title: '6th House -- Routine', summary: 'Health, work, daily habits.', body: 'The 6th House relates to daily routines, health habits, and service-oriented work.' },
  { key: 'house_7', title: '7th House -- Partnership', summary: 'Marriage, contracts, significant others.', body: 'The 7th House, opposite the Ascendant, governs committed partnerships, marriage, and one-on-one relationships.' },
  { key: 'house_8', title: '8th House -- Transformation', summary: 'Intimacy, shared resources, death/rebirth.', body: 'The 8th House covers deep intimacy, shared finances, and themes of transformation and loss.' },
  { key: 'house_9', title: '9th House -- Philosophy', summary: 'Travel, higher education, belief systems.', body: 'The 9th House relates to long-distance travel, higher learning, and the search for meaning.' },
  { key: 'house_10', title: '10th House -- Career', summary: 'Public reputation, vocation, achievement.', body: 'The 10th House, at the top of the chart (Midheaven), represents career, public reputation, and life direction.' },
  { key: 'house_11', title: '11th House -- Community', summary: 'Friendships, groups, future hopes.', body: 'The 11th House governs friendships, social networks, and collective aspirations.' },
  { key: 'house_12', title: '12th House -- The Unconscious', summary: 'Endings, solitude, the hidden self.', body: 'The 12th House relates to the subconscious, spirituality, solitude, and what remains hidden or unresolved.' },
];

const aspects = [
  { key: 'conjunction', title: 'Conjunction (0 degrees)', summary: 'Fusion of energies.', body: 'A conjunction occurs when two planets sit at the same degree, blending their energies intensely -- for better or worse depending on the planets involved.' },
  { key: 'sextile', title: 'Sextile (60 degrees)', summary: 'Easy, supportive flow.', body: 'A sextile creates a gentle, opportunity-rich connection between two planets, offering ease without requiring much effort.' },
  { key: 'square', title: 'Square (90 degrees)', summary: 'Tension that drives growth.', body: 'A square creates friction between two planets, often experienced as challenge or obstacle -- but one that motivates growth and action.' },
  { key: 'trine', title: 'Trine (120 degrees)', summary: 'Harmonious, natural talent.', body: 'A trine is a flowing, harmonious aspect that often points to natural talent and ease between the energies involved.' },
  { key: 'opposition', title: 'Opposition (180 degrees)', summary: 'Polarity requiring balance.', body: 'An opposition places two planets directly across from each other, creating tension between opposing needs that calls for conscious balance.' },
];

module.exports = { planets, signs, houses, aspects };
