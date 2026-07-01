const courses = [
  {
    title: 'Astrology Basics: The Big Three',
    description: 'Learn the foundation of every birth chart: your Sun, Moon, and Rising sign.',
    track: 'beginner',
    coverImageUrl: '/assets/learn/courses/big-three.png',
    order: 1,
    lessons: [
      { title: 'What is a Birth Chart?', contentType: 'text', body: 'A birth chart is a snapshot of the sky at the exact moment you were born...', order: 1 },
      { title: 'Your Sun Sign', contentType: 'text', body: 'Your Sun sign represents your core identity and life force...', order: 2 },
      { title: 'Your Moon Sign', contentType: 'text', body: 'Your Moon sign reveals your emotional inner world...', order: 3 },
      { title: 'Your Rising Sign', contentType: 'text', body: 'Your Rising sign (Ascendant) shapes how others perceive you...', order: 4 },
    ],
  },
  {
    title: 'Understanding the Houses',
    description: 'A deep dive into all 12 houses and what they reveal about different life areas.',
    track: 'intermediate',
    coverImageUrl: '/assets/learn/courses/houses.png',
    order: 1,
    lessons: [
      { title: 'The Angular Houses (1, 4, 7, 10)', contentType: 'text', body: 'The angular houses anchor the chart...', order: 1 },
      { title: 'The Succedent Houses (2, 5, 8, 11)', contentType: 'text', body: 'These houses build on the angular houses...', order: 2 },
      { title: 'The Cadent Houses (3, 6, 9, 12)', contentType: 'text', body: 'The cadent houses relate to transition and learning...', order: 3 },
    ],
  },
  {
    title: 'Reading Synastry Charts',
    description: 'Advanced techniques for comparing two charts to understand relationship dynamics.',
    track: 'advanced',
    coverImageUrl: '/assets/learn/courses/synastry.png',
    order: 1,
    lessons: [
      { title: 'What is Synastry?', contentType: 'text', body: 'Synastry overlays two charts to reveal relationship dynamics...', order: 1 },
      { title: 'Key Synastry Aspects', contentType: 'text', body: 'Certain aspects between two charts carry outsized importance...', order: 2 },
      { title: 'Composite Charts vs. Synastry', contentType: 'text', body: 'A composite chart creates a third, blended chart...', order: 3 },
    ],
  },
];

const quizQuestionPool = [
  { question: 'Which planet rules communication and intellect?', options: ['Venus', 'Mercury', 'Mars', 'Jupiter'], correctIndex: 1 },
  { question: 'What does the Ascendant represent?', options: ['Career path', 'How others perceive you', 'Emotional needs', 'Past life karma'], correctIndex: 1 },
  { question: 'Which house is associated with home and family?', options: ['7th House', '10th House', '4th House', '1st House'], correctIndex: 2 },
  { question: 'A trine is how many degrees apart?', options: ['60', '90', '120', '180'], correctIndex: 2 },
  { question: 'Which sign is ruled by Mars?', options: ['Aries', 'Taurus', 'Cancer', 'Libra'], correctIndex: 0 },
  { question: 'What does retrograde motion mean for a planet?', options: ['It moves faster', "It appears to move backward from Earth's perspective", 'It disappears from the sky', 'It changes signs instantly'], correctIndex: 1 },
];

module.exports = { courses, quizQuestionPool };
