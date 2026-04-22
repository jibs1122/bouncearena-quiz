import { resolveQuizCountry, type Country } from '@/lib/geolocation';
import type { Question } from '@/components/QuizQuestion';
import { getLink } from '@/lib/links';

export function buildQuestions(country: Country): Question[] {
  const resolvedCountry = resolveQuizCountry(country);

  const standardsTitle =
    resolvedCountry === 'US'
      ? 'Is it important to you that your trampoline meets ASTM safety standards?'
      : 'Is it important to you that your trampoline meets the Australian Trampoline Standards (AS 4989:2015)?';

  const standardsSubtitle =
    resolvedCountry === 'US'
      ? 'ASTM International standards set widely used safety and durability benchmarks for recreational trampolines, covering design, padding, warning labels, and test methods.'
      : 'Standards Australia sets voluntary safety and durability guidelines for recreational trampolines covering design, construction, safety padding, warning labels, and testing methods.';

  return [
    // Q1 — Safety features
    {
      id: 'safetyFeatures',
      title: 'How important are advanced safety features?',
      subtitle:
        'Advanced features include curved safety poles that angle away from jumpers, springs positioned outside the enclosure, and the frame sitting away from the jumping area.',
      subtitleExtra:
        'If you want to learn more about trampoline safety before answering, we recommend this guide:',
      questionImage: '/images/trampoline-safety-features.png',
      type: 'single',
      affiliateLink: {
        text: 'Trampoline safety guide by Vuly (opens in new tab)',
        href: getLink('vuly-safety-guide', resolvedCountry) ?? 'https://www.vulyplay.com/aff/100/?url=blog/trampoline-safety',
      },
      options: [
        {
          id: 'essential',
          label: 'Essential',
          description: 'I want the safest option available',
        },
        {
          id: 'nice-to-have',
          label: 'Nice to have',
          description: 'Helpful, but not a dealbreaker',
        },
        {
          id: 'not-important',
          label: 'Not important',
          description: "I'm more focused on value",
        },
      ],
    },

    // Q2 — Spring type (with images)
    {
      id: 'springType',
      title: 'What type of spring system do you prefer?',
      subtitle: 'Choose the system you want, or let the quiz compare both.',
      type: 'single',
      cardLayout: true,
      options: [
        {
          id: 'traditional',
          label: 'Traditional springs',
          description:
            'Metal coil springs around the outside of the frame. Generally more affordable and easier to replace. Springs are covered by padding, but the pad can shift over time.',
          imageSrc: '/images/traditional-springs.png',
          imageAlt: 'Traditional spring trampoline',
        },
        {
          id: 'springless',
          label: 'Springless',
          description:
            'No exposed metal springs. Instead uses elastic straps, composite rods, or curved leaf springs attached under or inside the frame — keeping the jumping area clear of pinch points.',
          imageSrc: '/images/springless-trampoline.png',
          imageAlt: 'Springless trampoline',
        },
        {
          id: 'not-sure',
          label: 'Not sure',
          description: 'Show me both and let the quiz weighting decide.',
        },
      ],
    },

    // Q3 — Backyard size
    {
      id: 'backyardSize',
      title: 'What size is your backyard?',
      subtitle:
        'We use this to prefer trampolines that actually fit your space. Allow at least 1 metre of clearance on all sides between the trampoline and fences, walls, or trees.',
      subtitleExtra: `Not sure what size you need? This guide from Vuly walks through it:`,
      affiliateLink: {
        text: 'Trampoline size guide by Vuly (opens in new tab)',
        href: getLink('vuly-size-guide', resolvedCountry) ?? 'https://www.vulyplay.com/aff/100/?url=blog/what-size-trampoline',
      },
      type: 'single',
      options: [
        { id: 'small', label: 'Small', description: 'Room for 8–10ft (≈ 2.4–3m)' },
        { id: 'medium', label: 'Medium', description: 'Room for 12ft (≈ 3.7m)' },
        { id: 'large', label: 'Large', description: 'Room for 14ft+ (≈ 4.3m+)' },
        {
          id: 'long-narrow',
          label: 'Long and narrow',
          description: 'More length than width — suits oval trampolines',
        },
        { id: 'not-sure', label: 'Not sure', description: 'Show me all options' },
      ],
    },

    // Q4 — Standards compliance
    {
      id: 'standards',
      title: standardsTitle,
      subtitle: standardsSubtitle,
      type: 'single',
      options: [
        { id: 'yes', label: 'Yes, this matters to me' },
        { id: 'no', label: "No, it's not a requirement" },
      ],
    },

    // Q5 — Budget
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

    // Q6 — Priorities (multi-select)
    {
      id: 'priorities',
      title: 'What matters most to you?',
      subtitle: 'Choose up to two. These are used to rank your top matches.',
      type: 'multi',
      maxSelect: 2,
      options: [
        { id: 'bounce', label: 'Best bounce quality' },
        { id: 'durability', label: 'Durability / longevity' },
        { id: 'value', label: 'Value for money' },
        { id: 'assembly', label: 'Easy assembly' },
        { id: 'warranty', label: 'Warranty & support' },
      ],
    },
  ];
}
