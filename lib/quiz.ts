import { resolveQuizCountry, type Country } from '@/lib/geolocation';
import type { Question } from '@/components/QuizQuestion';
import { getLink } from '@/lib/links';

// Use-case first: the yard and the people come before product attributes.
// Every question is single-tap and advances on its own; there is no Next button.
export function buildQuestions(country: Country): Question[] {
  const resolvedCountry = resolveQuizCountry(country);

  const standardsTitle =
    resolvedCountry === 'US'
      ? 'Does it need to meet ASTM safety standards?'
      : 'Does it need to meet the Australian Trampoline Standards?';

  const standardsLinks: Question['links'] =
    resolvedCountry === 'US'
      ? undefined
      : {
          intro: 'Read more:',
          items: [
            {
              text: 'What AS 4989:2015 covers (opens in a new tab)',
              href: '/go/trampoline-standards/',
            },
          ],
        };

  return [
    // Q1 — Backyard size
    {
      id: 'backyardSize',
      title: 'How big is your backyard?',
      type: 'single',
      options: [
        { id: 'small', label: 'Small', description: 'Room for a 2.4–3m wide trampoline' },
        { id: 'medium', label: 'Medium', description: 'Room for a 3.7m wide trampoline' },
        { id: 'large', label: 'Large', description: 'Room for a 4.3m+ wide trampoline' },
        { id: 'long-narrow', label: 'Long and narrow', description: 'Suits oval and rectangle trampolines' },
        { id: 'not-sure', label: 'Not sure', description: 'Show all sizes' },
      ],
      links: {
        intro: 'Read more:',
        items: [
          {
            text: 'Vuly size guide',
            href:
              getLink('vuly-size-guide', resolvedCountry) ??
              'https://www.vulyplay.com/aff/100/?url=blog/what-size-trampoline',
          },
          {
            text: 'Springfree space guide',
            href: '/go/how-much-space-do-you-need-for-a-trampoline/',
          },
        ],
      },
    },

    // Q2 — Who will use it (two quick taps on one screen)
    {
      id: 'users',
      title: 'Who will use it?',
      type: 'pair',
      options: [],
      groups: [
        {
          id: 'ages',
          label: 'Ages',
          options: [
            { id: 'under-8', label: 'Under 8' },
            { id: '8-12', label: '8 to 12' },
            { id: 'teens', label: 'Teens or adults' },
            { id: 'mixed', label: 'A mix of ages' },
          ],
        },
        {
          id: 'jumpers',
          label: 'How many will use it',
          options: [
            { id: '1-2', label: '1 or 2' },
            { id: '3-plus', label: '3 or more' },
          ],
        },
      ],
    },

    // Q3 — Shape
    {
      id: 'shape',
      title: 'Which shape do you want?',
      type: 'single',
      cardLayout: true,
      options: [
        {
          id: 'round',
          label: 'Round',
          description: 'Even bounce that tends to send jumpers back to the centre.',
          imageSrc: '/images/geetramp/curve-12-ft.webp',
          imageAlt: 'Round trampoline',
        },
        {
          id: 'rectangle',
          label: 'Rectangle or square',
          description: 'Higher bounce across the whole mat. The shape gymnasts train on.',
          imageSrc: '/images/geetramp/force-9-x-14-ft.webp',
          imageAlt: 'Rectangle trampoline',
        },
        {
          id: 'no-preference',
          label: 'No preference',
          description: 'Show the best match in either shape.',
        },
      ],
      links: {
        intro: 'Read more:',
        items: [
          {
            text: 'Round vs rectangle trampolines: bounce and safety compared, by Web and Warehouse (opens in a new tab)',
            href:
              getLink('webandwarehouse-round-vs-rectangle', resolvedCountry) ??
              'https://webandwarehouse.com.au/blog/posts/round-vs-rectangle-trampolines-the-definitive-guide-to-bounce-safety-and-quality-24?tracking=6a9550e65374c',
          },
        ],
      },
    },

    // Q4 — Budget
    {
      id: 'budget',
      title: "What's your budget?",
      type: 'single',
      options: [
        { id: 'under-500', label: 'Under $500' },
        { id: '500-1000', label: '$500 – $1,000' },
        { id: '1000-1500', label: '$1,000 – $1,500' },
        { id: '1500-2500', label: '$1,500 – $2,500' },
        { id: '2500-plus', label: '$2,500+' },
        { id: 'flexible', label: 'Flexible / not sure' },
      ],
    },

    // Q5 — Spring type
    {
      id: 'springType',
      title: 'What type of spring system do you prefer?',
      type: 'single',
      cardLayout: true,
      options: [
        {
          id: 'traditional',
          label: 'Traditional springs',
          description: 'Metal coil springs under padding. Usually cheaper, and springs are easy to replace.',
          imageSrc: '/images/traditional-springs.png',
          imageAlt: 'Traditional spring trampoline',
        },
        {
          id: 'springless',
          label: 'Springless',
          description: 'No exposed metal coil springs. Uses rods, straps or leaf springs under or inside the frame.',
          imageSrc: '/images/springless-trampoline.png',
          imageAlt: 'Springless trampoline',
        },
        { id: 'not-sure', label: 'Not sure', description: 'Show both.' },
      ],
      links: {
        intro: 'Read more:',
        items: [
          {
            text: 'Spring vs springless trampolines compared (opens in a new tab)',
            href: '/go/spring-vs-springless/',
          },
        ],
      },
    },

    // Q6 — Standards (last step: tapping an answer shows results)
    {
      id: 'standards',
      title: standardsTitle,
      type: 'single',
      submitsQuiz: true,
      options: [
        { id: 'yes', label: 'Yes' },
        { id: 'no', label: 'No' },
      ],
      links: standardsLinks,
    },
  ];
}
