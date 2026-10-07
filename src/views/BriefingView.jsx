import { useState } from 'react'
import { ViewHeader } from '../components/primitives'

/**
 * The written argument. Tab titles are fixed; the team writes the content.
 * Nothing here pretends to be a draft.
 */
const TABS = [
  { id: 'theory', label: 'Theory' },
  { id: 'recommendations', label: 'Recommendations' },
  { id: 'limitations', label: 'Limitations' },
  { id: 'team', label: 'Team & AI' },
]

export default function BriefingView() {
  const [tab, setTab] = useState('theory')

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ViewHeader
        title="Briefing"
        right={
          <div className="flex shrink-0 items-center gap-6">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`relative pb-1 text-[10px] font-medium uppercase tracking-[0.1em] transition-colors ${tab === t.id ? 'text-ink' : 'text-ink-4 hover:text-ink-2'}`}
              >
                {t.label}
                {tab === t.id && <span className="absolute inset-x-0 -bottom-px h-px bg-accent" />}
              </button>
            ))}
          </div>
        }
      />
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <p className="text-[12px] tracking-[0.12em] text-ink-4 uppercase">Content in progress</p>
      </div>
    </div>
  )
}
