import { motion } from 'framer-motion'
import { SectionHeading } from '../components/primitives'
import { staggerContainer, fadeUpItem } from '../components/motionVariants'

/**
 * Shared shell for the sections whose written content is still to come.
 *
 * Set as a numbered editorial list rather than a grid of cards: each entry
 * hangs its number in the left margin, the heading sits in the serif, and the
 * pending body is a ruled block that says plainly it is empty. Card titles and
 * ordering are final; only the prose is missing.
 */
export default function PlaceholderSection({ eyebrow, title, lead, cards, note }) {
  return (
    <div className="mx-auto max-w-[1360px] px-5 pb-24 pt-12 sm:px-8">
      <SectionHeading eyebrow={eyebrow} title={title} lead={lead} />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="mt-12 space-y-10"
      >
        {cards.map((card, i) => (
          <motion.article
            key={card.title}
            variants={fadeUpItem}
            className="rule grid gap-x-8 gap-y-4 pt-5 lg:grid-cols-12"
          >
            <div className="lg:col-span-1">
              <span className="font-mono text-[12px] text-ink-4">
                {String(i + 1).padStart(2, '0')}
              </span>
            </div>

            <div className="lg:col-span-5">
              <h3 className="font-serif text-[22px] font-medium leading-snug tracking-tight text-ink">
                {card.title}
              </h3>
              {card.summary && (
                <p className="mt-3 text-[13px] leading-[1.65] text-ink-2">{card.summary}</p>
              )}
            </div>

            <div className="lg:col-span-6">
              <div className="plate-sunk h-full min-h-[112px] p-5">
                <p className="font-mono text-[11.5px] text-ink-3">
                  {card.placeholder ?? '[CONTENT TO BE ADDED]'}
                </p>
              </div>
            </div>
          </motion.article>
        ))}
      </motion.div>

      {note && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="rule mt-10 pt-5"
        >
          <h3 className="font-serif text-[22px] font-medium tracking-tight text-ink">
            {note.title}
          </h3>
          <div className="plate-sunk mt-4 p-5">
            <p className="font-mono text-[11.5px] text-ink-3">{note.placeholder}</p>
          </div>
        </motion.div>
      )}
    </div>
  )
}
