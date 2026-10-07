import { SectionHeading } from '../components/primitives'

/**
 * A heading and an empty block. The team writes these, so nothing here
 * pretends to be draft copy.
 */
export default function PlaceholderSection({ eyebrow, title, id }) {
  return (
    <section id={id} className="mx-auto max-w-[1280px] px-5 py-14 sm:px-8">
      <SectionHeading eyebrow={eyebrow} title={title} />
      <div className="plate-sunk mt-6 p-8">
        <p className="font-mono text-[12px] text-ink-3">[Text to be added by the team]</p>
      </div>
    </section>
  )
}
