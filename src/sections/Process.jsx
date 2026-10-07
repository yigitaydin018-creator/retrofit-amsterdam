import PlaceholderSection from './PlaceholderSection'

export default function Process() {
  return (
    <PlaceholderSection
      eyebrow="Section 05 / Process"
      title="Team process & AI statement"
      lead="Division of work, the methodological calls taken along the way, and a statement on how AI tools were used in preparing this project."
      cards={[
        {
          title: 'Division of Work',
          summary: 'Who did what, and how the work was coordinated across the team.',
        },
        {
          title: 'Methodological Decisions',
          summary:
            'Choices made about data, coefficients and scope, including what was deliberately left out.',
        },
        {
          title: 'AI Usage Statement',
          summary: 'Which tools were used, for what, and how the output was checked.',
        },
      ]}
      note={{ title: 'Reflection', placeholder: '[CONTENT TO BE ADDED]' }}
    />
  )
}
