import PlaceholderSection from './PlaceholderSection'

export default function Theory() {
  return (
    <PlaceholderSection
      eyebrow="Section 03 / Theory"
      title="Theoretical framework"
      lead="The economic reasoning the simulator puts to work. How efficiency is capitalised into house prices, why the market under-provides it, and why the rental share of a neighbourhood decides whether a subsidy ever reaches the dwellings that need it."
      cards={[
        {
          title: 'Hedonic Pricing Model',
          summary:
            'Decomposing a dwelling’s price into its attributes, then locating the energy label among them.',
        },
        {
          title: 'Market Failures and Negative Externalities',
          summary:
            'Unpriced carbon, imperfect information, and the wedge this opens between private and social returns to renovation.',
        },
        {
          title: 'The Split-Incentive Problem (Landlord–Tenant)',
          summary:
            'Why the party who can invest is not the party paying the energy bill, and what that implies for how the instrument should be designed.',
        },
      ]}
    />
  )
}
