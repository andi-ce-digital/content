import { useMemo } from 'react'
import { cn } from '../../lib/utils'
import { type AiStudioReelSlide } from '../../data/aiStudioReelSlides'

type Props = {
  slides: AiStudioReelSlide[]
  loading?: boolean
  className?: string
  /** Überschrift über den Streifen */
  title?: string
}

export function StudioReelShowcase({
  slides,
  loading = false,
  className,
  title = 'Deine Reels',
}: Props) {
  const list = slides
  const doubled = useMemo(() => [...list, ...list], [list])

  if (loading) {
    return (
      <div className={cn('w-full min-w-0 max-w-full', className)} aria-busy="true" aria-label="Reels werden geladen">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
          {title}
        </p>
        <div className="studio-reel-fade-x relative overflow-hidden py-1">
          <div className="flex gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={`sk-l-${i}`}
                className="h-[76px] w-[52px] shrink-0 animate-pulse rounded-2xl bg-slate-200/90 ring-1 ring-slate-200/80 sm:h-[88px] sm:w-[64px]"
              />
            ))}
          </div>
        </div>
        <div className="studio-reel-fade-x relative mt-2 overflow-hidden py-1">
          <div className="flex gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={`sk-r-${i}`}
                className="h-[76px] w-[52px] shrink-0 animate-pulse rounded-2xl bg-slate-200/90 ring-1 ring-slate-200/80 sm:h-[88px] sm:w-[64px]"
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (list.length === 0) {
    return null
  }

  return (
    <div className={cn('w-full min-w-0 max-w-full', className)}>
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
        {title}
      </p>

      {/* Zwei gegenläufige Reel-Streifen (nur Marquee, kein großes Video) */}
      <div className="studio-reel-fade-x relative overflow-hidden py-1">
        <div
          className="studio-reel-marquee-l flex w-max gap-3 pr-3 motion-reduce:animate-none"
          aria-hidden
        >
          {doubled.map((slide, i) => (
            <ReelThumb key={`l-${slide.id}-${i}`} slide={slide} />
          ))}
        </div>
      </div>
      <div className="studio-reel-fade-x relative mt-2 overflow-hidden py-1">
        <div
          className="studio-reel-marquee-r flex w-max gap-3 pr-3 motion-reduce:animate-none"
          aria-hidden
        >
          {[...doubled].reverse().map((slide, i) => (
            <ReelThumb key={`r-${slide.id}-${i}`} slide={slide} small />
          ))}
        </div>
      </div>
    </div>
  )
}

function ReelThumb({
  slide,
  small,
}: {
  slide: AiStudioReelSlide
  small?: boolean
}) {
  return (
    <div
      className={cn(
        'shrink-0 overflow-hidden rounded-2xl bg-slate-200/90 shadow-md ring-1 ring-slate-200/80',
        small ? 'w-[52px] sm:w-[64px]' : 'w-[64px] sm:w-[76px]',
      )}
    >
      <div className="aspect-[9/16]">
        {slide.imageUrl ? (
          <img
            src={slide.imageUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : slide.videoUrl ? (
          <video
            src={slide.videoUrl}
            muted
            loop
            playsInline
            preload="none"
            autoPlay
            className="pointer-events-none h-full w-full object-cover"
            aria-hidden
          />
        ) : null}
      </div>
    </div>
  )
}
