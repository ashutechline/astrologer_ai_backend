/**
 * Tarot deck seed data. Major Arcana (22 cards) is complete.
 * Minor Arcana includes a representative sample per suit — extend with the remaining
 * cards (each suit runs Ace–10, Page, Knight, Queen, King) following the same shape.
 */
const majorArcana = [
  { name: 'The Fool', arcana: 'major', imageUrl: '/assets/tarot/major/00-the-fool.png', uprightMeaning: 'New beginnings, spontaneity, a leap of faith into the unknown.', reversedMeaning: 'Recklessness, naivety, a missed opportunity due to hesitation.' },
  { name: 'The Magician', arcana: 'major', imageUrl: '/assets/tarot/major/01-the-magician.png', uprightMeaning: 'Manifestation, resourcefulness, having the tools to make things happen.', reversedMeaning: 'Manipulation, untapped potential, poor planning.' },
  { name: 'The High Priestess', arcana: 'major', imageUrl: '/assets/tarot/major/02-the-high-priestess.png', uprightMeaning: 'Intuition, mystery, inner knowing beyond logic.', reversedMeaning: 'Secrets withheld, disconnection from intuition.' },
  { name: 'The Empress', arcana: 'major', imageUrl: '/assets/tarot/major/03-the-empress.png', uprightMeaning: 'Abundance, nurturing, creativity in full bloom.', reversedMeaning: 'Creative block, dependence, neglect of self-care.' },
  { name: 'The Emperor', arcana: 'major', imageUrl: '/assets/tarot/major/04-the-emperor.png', uprightMeaning: 'Structure, authority, stable foundations.', reversedMeaning: 'Rigidity, excessive control, lack of discipline.' },
  { name: 'The Hierophant', arcana: 'major', imageUrl: '/assets/tarot/major/05-the-hierophant.png', uprightMeaning: 'Tradition, shared belief systems, guidance from established wisdom.', reversedMeaning: 'Breaking from convention, questioning authority.' },
  { name: 'The Lovers', arcana: 'major', imageUrl: '/assets/tarot/major/06-the-lovers.png', uprightMeaning: 'Union, alignment of values, meaningful connection.', reversedMeaning: 'Disharmony, misaligned values, a difficult choice.' },
  { name: 'The Chariot', arcana: 'major', imageUrl: '/assets/tarot/major/07-the-chariot.png', uprightMeaning: 'Willpower, determination, pushing through obstacles.', reversedMeaning: 'Lack of direction, aggression, loss of control.' },
  { name: 'Strength', arcana: 'major', imageUrl: '/assets/tarot/major/08-strength.png', uprightMeaning: 'Inner courage, patience, gentle power over force.', reversedMeaning: 'Self-doubt, low energy, raw emotion overtaking reason.' },
  { name: 'The Hermit', arcana: 'major', imageUrl: '/assets/tarot/major/09-the-hermit.png', uprightMeaning: 'Introspection, solitude, seeking inner truth.', reversedMeaning: 'Isolation, withdrawal, avoiding needed connection.' },
  { name: 'Wheel of Fortune', arcana: 'major', imageUrl: '/assets/tarot/major/10-wheel-of-fortune.png', uprightMeaning: 'Cycles, fate, a turning point arriving.', reversedMeaning: 'Resistance to change, feeling stuck in a cycle.' },
  { name: 'Justice', arcana: 'major', imageUrl: '/assets/tarot/major/11-justice.png', uprightMeaning: 'Fairness, truth, cause and effect playing out.', reversedMeaning: 'Unfairness, avoiding accountability, imbalance.' },
  { name: 'The Hanged Man', arcana: 'major', imageUrl: '/assets/tarot/major/12-the-hanged-man.png', uprightMeaning: 'Surrender, a new perspective, pause before action.', reversedMeaning: 'Stalling, resistance to letting go, indecision.' },
  { name: 'Death', arcana: 'major', imageUrl: '/assets/tarot/major/13-death.png', uprightMeaning: 'Transformation, endings that make way for new beginnings.', reversedMeaning: 'Resistance to necessary change, stagnation.' },
  { name: 'Temperance', arcana: 'major', imageUrl: '/assets/tarot/major/14-temperance.png', uprightMeaning: 'Balance, moderation, blending opposites harmoniously.', reversedMeaning: 'Excess, imbalance, impatience.' },
  { name: 'The Devil', arcana: 'major', imageUrl: '/assets/tarot/major/15-the-devil.png', uprightMeaning: 'Attachment, restriction, confronting a shadow pattern.', reversedMeaning: 'Breaking free, reclaiming personal power.' },
  { name: 'The Tower', arcana: 'major', imageUrl: '/assets/tarot/major/16-the-tower.png', uprightMeaning: 'Sudden upheaval, revelation, the collapse of false structures.', reversedMeaning: 'Avoiding disaster narrowly, fear of change.' },
  { name: 'The Star', arcana: 'major', imageUrl: '/assets/tarot/major/17-the-star.png', uprightMeaning: 'Hope, renewal, healing after hardship.', reversedMeaning: 'Discouragement, lack of faith in the future.' },
  { name: 'The Moon', arcana: 'major', imageUrl: '/assets/tarot/major/18-the-moon.png', uprightMeaning: 'Illusion, intuition, the subconscious surfacing.', reversedMeaning: 'Confusion clearing, releasing fear.' },
  { name: 'The Sun', arcana: 'major', imageUrl: '/assets/tarot/major/19-the-sun.png', uprightMeaning: 'Joy, vitality, success and clarity.', reversedMeaning: 'Temporary setback, delayed happiness.' },
  { name: 'Judgement', arcana: 'major', imageUrl: '/assets/tarot/major/20-judgement.png', uprightMeaning: 'Awakening, reckoning, a call to a higher purpose.', reversedMeaning: 'Self-doubt, avoiding a necessary reckoning.' },
  { name: 'The World', arcana: 'major', imageUrl: '/assets/tarot/major/21-the-world.png', uprightMeaning: 'Completion, fulfillment, a cycle reaching its end.', reversedMeaning: 'Incompletion, delay, unfinished business.' },
];

/** Representative minor arcana sample — extend per suit (Cups, Pentacles, Swords, Wands) up through King. */
const minorArcanaSample = [
  { name: 'Ace of Cups', arcana: 'minor', imageUrl: '/assets/tarot/minor/cups-ace.png', uprightMeaning: 'New emotional beginnings, an open heart, intuitive insight.', reversedMeaning: 'Emotional block, suppressed feelings.' },
  { name: 'Ten of Cups', arcana: 'minor', imageUrl: '/assets/tarot/minor/cups-10.png', uprightMeaning: 'Emotional fulfillment, harmonious relationships, lasting happiness.', reversedMeaning: 'Disconnection within a relationship, broken harmony.' },
  { name: 'Ace of Pentacles', arcana: 'minor', imageUrl: '/assets/tarot/minor/pentacles-ace.png', uprightMeaning: 'A new opportunity for material or financial growth.', reversedMeaning: 'A missed opportunity, financial instability.' },
  { name: 'Ten of Pentacles', arcana: 'minor', imageUrl: '/assets/tarot/minor/pentacles-10.png', uprightMeaning: 'Lasting abundance, legacy, family wealth.', reversedMeaning: 'Financial loss, family conflict over resources.' },
  { name: 'Ace of Swords', arcana: 'minor', imageUrl: '/assets/tarot/minor/swords-ace.png', uprightMeaning: 'Mental clarity, breakthrough, truth cutting through confusion.', reversedMeaning: 'Confusion, miscommunication, a clouded mind.' },
  { name: 'Ten of Swords', arcana: 'minor', imageUrl: '/assets/tarot/minor/swords-10.png', uprightMeaning: 'A painful ending that clears the way for recovery.', reversedMeaning: "Resisting an ending that's already happened." },
  { name: 'Ace of Wands', arcana: 'minor', imageUrl: '/assets/tarot/minor/wands-ace.png', uprightMeaning: 'Inspiration, a spark of new creative or entrepreneurial energy.', reversedMeaning: 'Delays, lack of motivation, a stalled idea.' },
  { name: 'Ten of Wands', arcana: 'minor', imageUrl: '/assets/tarot/minor/wands-10.png', uprightMeaning: 'Burden, nearing completion under heavy responsibility.', reversedMeaning: 'Delegating, releasing an unnecessary burden.' },
];

module.exports = [...majorArcana, ...minorArcanaSample];
