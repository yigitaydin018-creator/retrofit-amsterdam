import { APP_NAME } from '../config/coefficients'

/**
 * Fixed left rail. Four destinations, no scroll, no nesting: this is a tool
 * with four screens, and the rail should say so at a glance.
 */
export default function SideNav({ views, active, onChange, onHome }) {
  return (
    <nav className="hidden w-[180px] shrink-0 flex-col border-r border-line bg-base-2 md:flex">
      {/* The wordmark is the way back to the intro. */}
      <button
        onClick={onHome}
        className="block w-full border-b border-line px-5 py-4 text-left transition-colors hover:bg-white/[0.03]"
        title="Back to the opening screen"
      >
        <p className="text-[13px] font-semibold leading-tight tracking-tight text-ink">{APP_NAME}</p>
        <p className="label-dim mt-1">Policy lab</p>
      </button>

      <div className="flex-1 py-2">
        {views.map((v) => {
          const on = v.id === active
          return (
            <button
              key={v.id}
              onClick={() => onChange(v.id)}
              className={`relative block w-full px-5 py-2.5 text-left text-[12.5px] transition-colors ${on ? 'text-ink' : 'text-ink-4 hover:text-ink-2'}`}
            >
              {on && <span className="absolute inset-y-1.5 left-0 w-[2px] bg-accent" />}
              {v.label}
            </button>
          )
        })}
      </div>

      <div className="border-t border-line px-5 py-3">
        <p className="text-[10px] leading-[1.6] text-ink-4">
          Gemeente Amsterdam
          <br />
          decision support
        </p>
      </div>
    </nav>
  )
}
