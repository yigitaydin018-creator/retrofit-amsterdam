import PlaceholderSection from './PlaceholderSection'

export default function Recommendations() {
  return (
    <PlaceholderSection
      eyebrow="Section 04 / Recommendations"
      title="Policy recommendations"
      lead="What the simulation implies for the design of a municipal top-up. Who should receive it, which neighbourhoods it should reach first, and what it costs the city over the horizon to 2040."
      cards={[
        {
          title: 'Income-Based Tiered Subsidies',
          summary:
            'Varying the top-up rate by household income instead of paying a flat rate to every applicant.',
        },
        {
          title: 'Carbon-Prioritized Targeting',
          summary:
            'Sequencing neighbourhoods by avoided CO₂ per euro of municipal outlay rather than by order of application.',
        },
        {
          title: 'Municipal Budget & Implementation Timeline',
          summary:
            'What full coverage of the E/F/G stock costs, and how it phases against the 2040 gas-free target.',
        },
      ]}
    />
  )
}
