import { getRecommendations, type QuizAnswers } from '@/lib/scoring';

const scenarios: Array<{ name: string; answers: QuizAnswers }> = [
  {
    name: 'Premium springless AU family',
    answers: {
      country: 'AU',
      backyardSize: 'medium',
      standards: 'yes',
      safetyFeatures: 'essential',
      springType: 'springless',
      budget: '1500-2500',
      priorities: ['durability', 'warranty'],
    },
  },
  {
    name: 'Low-signal user',
    answers: {
      country: 'AU',
      backyardSize: 'not-sure',
      standards: 'no',
      safetyFeatures: 'not-important',
      springType: 'not-sure',
      budget: 'flexible',
      priorities: [],
    },
  },
  {
    name: 'Long-narrow yard',
    answers: {
      country: 'AU',
      backyardSize: 'long-narrow',
      standards: 'no',
      safetyFeatures: 'nice-to-have',
      springType: 'not-sure',
      budget: '1000-1500',
      priorities: ['bounce', 'value'],
    },
  },
  {
    name: 'Budget medium yard',
    answers: {
      country: 'AU',
      backyardSize: 'medium',
      standards: 'yes',
      safetyFeatures: 'not-important',
      springType: 'traditional',
      budget: '500-1000',
      priorities: ['value', 'assembly'],
    },
  },
];

for (const scenario of scenarios) {
  const results = getRecommendations(scenario.answers);
  console.log(`\n## ${scenario.name}`);
  if (results.length === 0) {
    console.log('No results');
    continue;
  }

  for (const [index, result] of results.entries()) {
    console.log(
      `${index + 1}. ${result.brand} ${result.displayName} | score=${result.rawScore} | price=${result.priceFrom} | size=${result.recommendedSizeDisplay} | slug=${result.slug}`,
    );
  }
}
