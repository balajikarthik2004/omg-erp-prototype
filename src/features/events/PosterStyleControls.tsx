import { Check, Sparkles } from 'lucide-react'

import { Select } from '@/components/ui/Select'
import { cn } from '@/lib/cn'
import type { EventRecord, PosterVariant } from '@/types'
import { POSTER_PHOTOS, TEMPLATE_PHOTO, photoIsUsable } from './logic/posterPhotos'
import { POSTER_THEME_LIST, selectPosterTheme } from './logic/posterThemes'

/** What an admin has overridden on top of the automatic choices. */
export interface PosterStyle {
  /** 'auto' runs the category mapping. */
  themeId: PosterVariant | 'auto'
  /** A library photograph picked by hand. Undefined means the automatic one. */
  photoSrc?: string
  /** Print the event's own image rather than a library photograph. */
  useEventImage: boolean
}

export const AUTO_POSTER_STYLE: PosterStyle = { themeId: 'auto', useEventImage: false }

/**
 * The theme and photograph an admin can override.
 *
 * The automatic choice is always shown with the reason behind it, so overriding
 * is a decision rather than a guess.
 */
export function PosterStyleControls({
  event,
  value,
  onChange,
  disabled,
  className,
}: {
  event: Pick<EventRecord, 'eventType' | 'name' | 'image'>
  value: PosterStyle
  onChange: (next: PosterStyle) => void
  disabled?: boolean
  className?: string
}) {
  const auto = selectPosterTheme(event)
  const effective = value.themeId === 'auto' ? auto.theme : POSTER_THEME_LIST.find((t) => t.id === value.themeId)!
  const gallery = POSTER_PHOTOS.filter((p) => p.themes.includes(effective.id))
  const eventImageUsable = photoIsUsable(event.image)

  const set = (patch: Partial<PosterStyle>) => onChange({ ...value, ...patch })

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="grid gap-4 sm:grid-cols-[minmax(0,260px)_1fr] sm:items-start">
        <Select
          label="Poster theme"
          value={value.themeId}
          disabled={disabled}
          onChange={(e) => set({ themeId: e.target.value as PosterStyle['themeId'], photoSrc: undefined })}
          options={[
            { value: 'auto', label: `Automatic — ${auto.theme.label}` },
            ...POSTER_THEME_LIST.map((t) => ({ value: t.id, label: t.label })),
          ]}
        />

        <div className="rounded-lg border border-sandal-200 bg-sandal-50 px-4 py-3">
          <p className="flex items-center gap-1.5 text-[13px] font-medium text-stone-700">
            <Sparkles className="size-3.5 text-turmeric-500" aria-hidden />
            {value.themeId === 'auto' ? `Chosen automatically: ${auto.theme.label}` : `Overriding the automatic ${auto.theme.label}`}
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-stone-500">
            {value.themeId === 'auto' ? auto.reason : effective.description}
          </p>
          <div className="mt-2 flex items-center gap-1.5" aria-hidden>
            {[effective.palette.primary, effective.palette.secondary, effective.palette.accent, effective.palette.background].map((hex) => (
              <span key={hex} className="size-4 rounded-full border border-black/10" style={{ background: hex }} />
            ))}
            <span className="ml-1 font-mono text-[11px] text-stone-400">{effective.palette.primary}</span>
          </div>
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[13px] font-medium text-stone-700">Photograph</p>
          {eventImageUsable ? (
            <label className="flex items-center gap-2 text-[12px] text-stone-600">
              <input
                type="checkbox"
                className="size-3.5 accent-kumkum-600"
                checked={value.useEventImage}
                disabled={disabled}
                onChange={(e) => set({ useEventImage: e.target.checked, photoSrc: undefined })}
              />
              Use this event&rsquo;s own image
            </label>
          ) : event.image ? (
            <span className="text-[12px] text-stone-400">
              This event&rsquo;s image has a banner printed on it, so it cannot back a poster.
            </span>
          ) : null}
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          <PhotoChip
            src={TEMPLATE_PHOTO[effective.id]}
            label={`${effective.label} template photograph`}
            badge="Template"
            selected={!value.photoSrc && !value.useEventImage}
            disabled={disabled}
            onClick={() => set({ photoSrc: undefined, useEventImage: false })}
          />
          {gallery
            .filter((p) => p.src !== TEMPLATE_PHOTO[effective.id])
            .map((p) => (
              <PhotoChip
                key={p.src}
                src={p.src}
                label={p.alt}
                selected={value.photoSrc === p.src && !value.useEventImage}
                disabled={disabled}
                onClick={() => set({ photoSrc: p.src, useEventImage: false })}
              />
            ))}
        </div>
        <p className="mt-2 text-[12px] text-stone-500">
          Each theme prints on one fixed template photograph, so the look stays consistent and only the event&rsquo;s details change. Swap in an alternate here when a particular event needs it. All of them are real photographs with no lettering in them &mdash; the words, the logo and the QR are drawn on top by the app.
        </p>
      </div>
    </div>
  )
}

function PhotoChip({ src, label, badge, selected, disabled, onClick }: {
  src: string
  label: string
  badge?: string
  selected: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'relative size-16 overflow-hidden rounded-lg border bg-sandal-100 transition disabled:cursor-not-allowed disabled:opacity-50',
        selected ? 'border-turmeric-500 ring-2 ring-turmeric-500/40' : 'border-sandal-200 hover:border-sandal-300',
      )}
    >
      <img src={src} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
      {badge ? (
        <span className="absolute inset-x-0 bottom-0 bg-black/55 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
          {badge}
        </span>
      ) : null}
      {selected ? (
        <span className="absolute left-1 top-1 rounded-full bg-turmeric-500 p-0.5 text-white">
          <Check className="size-2.5" aria-hidden />
        </span>
      ) : null}
    </button>
  )
}
