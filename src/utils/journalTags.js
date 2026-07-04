/**
 * Predefined journal tag constants.
 * These are the only tags accepted by the API (enforced by Joi validation).
 * Each tag has an emoji for display in the mobile UI.
 */
const JOURNAL_TAGS = [
  'Dream',
  'Gratitude',
  'Love',
  'Career',
  'Health',
  'Spiritual',
  'Fear',
  'Insight',
  'Manifestation',
  'Shadow Work',
  'Relationship',
  'Creativity',
  'Abundance',
  'Healing',
  'Intention',
  'Past Life',
  'Synchronicity',
  'Moon Energy',
  'Anxiety',
  'Growth',
];

/** Emoji map for UI display — keyed by tag name */
const JOURNAL_TAG_EMOJIS = {
  'Dream':          '🌙',
  'Gratitude':      '🙏',
  'Love':           '❤️',
  'Career':         '💼',
  'Health':         '🌿',
  'Spiritual':      '✨',
  'Fear':           '😰',
  'Insight':        '💡',
  'Manifestation':  '🌟',
  'Shadow Work':    '🌑',
  'Relationship':   '🤝',
  'Creativity':     '🎨',
  'Abundance':      '💰',
  'Healing':        '🦋',
  'Intention':      '🎯',
  'Past Life':      '🌀',
  'Synchronicity':  '🔮',
  'Moon Energy':    '🌕',
  'Anxiety':        '🌊',
  'Growth':         '🌱',
};

module.exports = { JOURNAL_TAGS, JOURNAL_TAG_EMOJIS };
