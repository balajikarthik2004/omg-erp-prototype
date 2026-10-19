import { format } from 'date-fns'
import QRCode from 'qrcode'

import { createRng, type Rng } from '@/lib/rng'
import { formatMoney } from '@/lib/format'
import type { EventRecord, ImageProviderType, PosterDesign, PosterVariant, SectorId } from '@/types'
import { resolvePosterPhoto, type PosterPhoto } from './posterPhotos'
import { PHOTO_BRIEF_SUFFIX, POSTER_THEMES, selectPosterTheme, type PosterTheme } from './posterThemes'

/**
 * Poster pipeline. The picture is background only, with no words in it. Every
 * word, the logo and the QR code are drawn by the app from the event record, so
 * the text is always exact and Tamil never goes through an image model.
 *
 * Each theme is a template with one fixed photograph behind it, so every
 * Traditional poster reads as the same house style and only the event's words
 * change. See `posterPhotos.ts` for the templates, the alternates and
 * for the seam where a stock or generation service would plug in. If the bytes
 * cannot be fetched the poster falls back to the drawn art further down this
 * file, so a preview is never blank.
 */

export const POSTER_W = 1024
export const POSTER_H = 1448

export const VARIANTS: { id: PosterVariant; label: string }[] = [
  { id: 'traditional', label: 'Traditional Heritage' },
  { id: 'modern', label: 'Modern Minimal' },
  { id: 'festive', label: 'Festive Celebration' },
]

/** Palettes for the drawn fallback art only. The themed poster uses `posterThemes.ts`. */
const PALETTE: Record<SectorId, { bg: string; main: string; accent: string; soft: string }> = {
  temple: { bg: '#FBF3E4', main: '#9A1F18', accent: '#D4971A', soft: '#F2E4C9' },
  sevalaya: { bg: '#EEF5EC', main: '#1F5A38', accent: '#D4971A', soft: '#CFE6D5' },
  sangam: { bg: '#E9F2F6', main: '#134E64', accent: '#D4971A', soft: '#CFE3EC' },
}
const PAPER = '#FFFBF4'

const SECTOR_LABEL: Record<SectorId, string> = {
  temple: 'கோயில் · Temple',
  sevalaya: 'சேவாலயா · Sevalaya',
  sangam: 'தமிழ்ச் சங்கம் · Tamil Heritage',
}

/* ---------------------------------------------------------------- prompt */

const SECTOR_BRIEF: Record<SectorId, string> = {
  temple: 'Set in and around a working South Indian temple.',
  sevalaya: 'Set at a community service hall: volunteers, banana-leaf meals, open daylight.',
  sangam: 'Set at a Tamil Sangam cultural hall: veena and mridangam, palm-leaf manuscripts, stage lighting.',
}

/** The art direction a photo service would be given for this theme and event. */
export function buildPosterPrompt(variant: PosterVariant, sectorId: SectorId, eventType: string): string {
  const theme = POSTER_THEMES[variant]
  return `${theme.brief} ${SECTOR_BRIEF[sectorId]} The occasion is a ${eventType.toLowerCase().replace(/_/g, ' ')}. ${PHOTO_BRIEF_SUFFIX}`
}

/* ----------------------------------------------- drawn fallback artwork */

type Pal = (typeof PALETTE)[SectorId]

function petalRing(cx: number, cy: number, count: number, r0: number, r1: number, w: number, turn: number, pal: Pal, fillOpacity: number): string {
  const len = r1 - r0
  const path = `M0 ${-r0}C${-w} ${-(r0 + len * 0.3)} ${-w * 0.55} ${-(r1 - len * 0.25)} 0 ${-r1}C${w * 0.55} ${-(r1 - len * 0.25)} ${w} ${-(r0 + len * 0.3)} 0 ${-r0}Z`
  return Array.from({ length: count })
    .map((_, i) => `<path d="${path}" transform="translate(${cx} ${cy}) rotate(${turn + (360 / count) * i})" fill="${pal.accent}" fill-opacity="${fillOpacity}" stroke="${pal.main}" stroke-width="1.6"/>`)
    .join('')
}

function diya(cx: number, cy: number, scale: number, pal: Pal): string {
  return `<g transform="translate(${cx} ${cy}) scale(${scale})">
    <path d="M0 -34C9 -22 12 -14 12 -8a12 12 0 1 1-24 0c0-6 3-14 12-26Z" fill="${pal.accent}"/>
    <path d="M0 -22C4 -16 6 -12 6 -8a6 6 0 1 1-12 0c0-4 2-8 6-14Z" fill="${PAPER}"/>
    <path d="M-30 2C-30 -4 -22 -8 0 -8S30 -4 30 2C30 20 14 30 0 30S-30 20 -30 2Z" fill="${pal.main}"/>
    <path d="M-22 4H22" stroke="${PAPER}" stroke-width="2" opacity="0.5"/>
  </g>`
}

function marigoldArc(y: number, sag: number, count: number, rng: Rng, pal: Pal): string {
  const out: string[] = []
  for (let i = 0; i <= count; i++) {
    const t = i / count
    const x = 40 + t * 944
    const yy = y + Math.sin(t * Math.PI) * sag
    const colour = i % 3 === 0 ? '#E07B12' : i % 3 === 1 ? '#E9B12E' : pal.accent
    out.push(`<circle cx="${x.toFixed(1)}" cy="${yy.toFixed(1)}" r="${14 + rng.int(0, 5)}" fill="${colour}"/><circle cx="${x.toFixed(1)}" cy="${yy.toFixed(1)}" r="5" fill="${PAPER}" opacity="0.7"/>`)
    if (i % 2 === 0) out.push(`<path d="M${x} ${yy + 12}q8 18 0 30q-8-12 0-30Z" fill="${pal.main}" opacity="0.55"/>`)
  }
  return out.join('')
}

function artTraditional(pal: Pal, rng: Rng): string {
  const n1 = rng.pick([16, 20, 24])
  const turn = rng.int(0, 10)
  return `<rect width="1024" height="1024" fill="${pal.bg}"/>
  <rect x="28" y="28" width="968" height="968" fill="none" stroke="${pal.accent}" stroke-width="3"/>
  <rect x="46" y="46" width="932" height="932" fill="none" stroke="${pal.main}" stroke-width="1.4" opacity="0.6"/>
  <circle cx="512" cy="430" r="300" fill="${pal.soft}" opacity="0.55"/>
  ${petalRing(512, 430, n1, 150, 290, 52, turn, pal, 0.1)}
  ${petalRing(512, 430, n1 / 2, 100, 210, 44, turn + 360 / n1, pal, 0.16)}
  ${petalRing(512, 430, 12, 54, 130, 30, 0, pal, 0.24)}
  <circle cx="512" cy="430" r="52" fill="${PAPER}" stroke="${pal.main}" stroke-width="2"/>
  ${diya(512, 436, 1.05, pal)}
  <path d="M60 80Q512 210 964 80" fill="none" stroke="${pal.accent}" stroke-width="2.4" stroke-dasharray="2 9" stroke-linecap="round"/>
  ${[120, 250, 774, 904].map((x) => diya(x, 150, 0.45, pal)).join('')}`
}

function artModern(pal: Pal, rng: Rng): string {
  const tiers = rng.int(5, 7)
  let tower = ''
  for (let i = 0; i < tiers; i++) {
    const w = 90 + (tiers - i) * 46
    const y = 250 + i * 62
    tower += `<path d="M${512 - w} ${y + 62}L${512 - w + 16} ${y}H${512 + w - 16}L${512 + w} ${y + 62}Z" fill="${pal.main}" opacity="${0.92 - i * 0.07}"/>`
  }
  return `<rect width="1024" height="1024" fill="${pal.soft}"/>
  <circle cx="512" cy="330" r="230" fill="${pal.accent}" opacity="0.38"/>
  <path d="M0 0H360L0 360Z" fill="${pal.main}" opacity="0.1"/>
  <path d="M1024 0H664L1024 360Z" fill="${pal.accent}" opacity="0.16"/>
  <path d="M492 130h40l8 36h-56z" fill="${pal.main}"/>
  <path d="M512 100v34" stroke="${pal.main}" stroke-width="5"/>
  ${tower}
  <rect x="${512 - 44}" y="${250 + tiers * 62}" width="88" height="70" rx="44" fill="${pal.bg}" opacity="0.9"/>
  <path d="M120 760H904" stroke="${pal.main}" stroke-width="2" opacity="0.35"/>
  ${[0, 1, 2, 3, 4].map((i) => `<circle cx="${352 + i * 80}" cy="760" r="6" fill="${pal.accent}"/>`).join('')}`
}

function artFestive(pal: Pal, rng: Rng): string {
  const rays = Array.from({ length: 28 })
    .map((_, i) => `<path d="M512 380L${(512 + Math.cos((i / 28) * Math.PI * 2) * 900).toFixed(0)} ${(380 + Math.sin((i / 28) * Math.PI * 2) * 900).toFixed(0)}L${(512 + Math.cos(((i + 0.5) / 28) * Math.PI * 2) * 900).toFixed(0)} ${(380 + Math.sin(((i + 0.5) / 28) * Math.PI * 2) * 900).toFixed(0)}Z" fill="${pal.accent}" opacity="${i % 2 ? 0.1 : 0.03}"/>`)
    .join('')
  const confetti = Array.from({ length: 34 })
    .map(() => `<circle cx="${rng.int(60, 964)}" cy="${rng.int(250, 700)}" r="${rng.int(3, 7)}" fill="${rng.pick([pal.accent, pal.main, '#E07B12'])}" opacity="0.55"/>`)
    .join('')
  return `<rect width="1024" height="1024" fill="${pal.bg}"/>
  ${rays}
  <circle cx="512" cy="380" r="150" fill="${PAPER}" opacity="0.8" stroke="${pal.accent}" stroke-width="3"/>
  ${diya(512, 388, 2.1, pal)}
  ${marigoldArc(70, 90, 20, rng, pal)}
  ${marigoldArc(30, 60, 14, rng, pal)}
  ${confetti}
  ${[150, 330, 694, 874].map((x) => diya(x, 640, 0.75, pal)).join('')}`
}

function drawArt(variant: PosterVariant, pal: Pal, seed: number): string {
  const rng = createRng(seed)
  if (variant === 'traditional') return artTraditional(pal, rng)
  if (variant === 'modern') return artModern(pal, rng)
  return artFestive(pal, rng)
}

export function renderArt(variant: PosterVariant, sectorId: SectorId, seed: number): string {
  return drawArt(variant, PALETTE[sectorId], seed)
}

/** The theme's own colours expressed as fallback-art colours, so a failed photo still looks on-theme. */
function themeArtPalette(theme: PosterTheme): Pal {
  return { bg: theme.palette.background, main: theme.palette.secondary, accent: theme.palette.primary, soft: theme.palette.accent }
}

/* ------------------------------------------------------------- designs */

/**
 * Three designs for one event, one per theme, led by the theme the event's own
 * category calls for. An admin can still pick either of the other two.
 */
export function generateDesigns(
  event: EventRecord,
  batchNo: number,
  createdBy: string,
  makeId: () => string,
): PosterDesign[] {
  const baseSeed = batchNo * 10_000 + Math.abs(hash(event.id)) % 9_000
  const provider: ImageProviderType = 'template'
  const recommended = selectPosterTheme(event).theme.id
  const ordered = [...VARIANTS].sort((a, b) => Number(b.id === recommended) - Number(a.id === recommended))

  return ordered.map((v, i) => ({
    id: makeId(),
    eventId: event.id,
    batchNo,
    variant: v.id,
    provider,
    prompt: buildPosterPrompt(v.id, event.sectorId, event.eventType),
    seed: baseSeed + i,
    textSnapshot: {
      eventName: event.name,
      startAt: event.startAt,
      endAt: event.endAt,
      venue: event.venue,
      chiefGuest: event.chiefGuest,
      ticketPrice: event.ticketPrice,
      contact: `${event.contactName} ${event.contactPhone}`,
    },
    createdBy,
    createdAt: new Date().toISOString(),
  }))
}

function hash(text: string): number {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (Math.imul(31, h) + text.charCodeAt(i)) | 0
  return h
}

/* --------------------------------------------------------------- compose */

export function xmlEscape(value: unknown): string {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

function wrap(text: string, maxChars: number, maxLines: number): string[] {
  const lines: string[] = []
  let current = ''
  for (const word of text.trim().split(/\s+/)) {
    if (current && `${current} ${word}`.length > maxChars) {
      lines.push(current)
      current = word
    } else {
      current = current ? `${current} ${word}` : word
    }
  }
  if (current) lines.push(current)
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines)
    kept[maxLines - 1] = kept[maxLines - 1]!.replace(/.{0,2}$/, '…')
    return kept
  }
  return lines
}

function when(startAt: string, endAt: string): string {
  const start = new Date(startAt)
  const end = new Date(endAt)
  if (Number.isNaN(start.getTime())) return startAt
  const head = format(start, 'EEE, d MMMM yyyy · h:mm a')
  if (Number.isNaN(end.getTime())) return head
  return format(start, 'yyyyMMdd') === format(end, 'yyyyMMdd') ? `${head} – ${format(end, 'h:mm a')}` : `${head} → ${format(end, 'd MMM')}`
}

async function qr(data: string, x: number, y: number, size: number): Promise<string> {
  const svg = await QRCode.toString(data, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' })
  const viewBox = /viewBox="([^"]+)"/.exec(svg)?.[1] ?? '0 0 29 29'
  const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
  return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="${viewBox}" shape-rendering="crispEdges">${inner}</svg>`
}

export async function qrSvg(data: string, size = 240): Promise<string> {
  return QRCode.toString(data, { type: 'svg', margin: 2, width: size, errorCorrectionLevel: 'M' })
}

/** Keeps the focal point of the photograph inside the crop. */
function slice(focusY: number): string {
  if (focusY <= 0.42) return 'xMidYMin slice'
  if (focusY >= 0.62) return 'xMidYMax slice'
  return 'xMidYMid slice'
}

function ornament(theme: PosterTheme, photoBottom: number): string {
  const c = theme.palette
  if (theme.ornament === 'double-rule') {
    return `<rect x="22" y="22" width="${POSTER_W - 44}" height="${POSTER_H - 44}" fill="none" stroke="${c.primary}" stroke-width="3"/>
    <rect x="34" y="34" width="${POSTER_W - 68}" height="${POSTER_H - 68}" fill="none" stroke="${c.accent}" stroke-width="1.2" opacity="0.65"/>`
  }
  if (theme.ornament === 'hairline') {
    return `<rect x="32" y="32" width="${POSTER_W - 64}" height="${POSTER_H - 64}" fill="none" stroke="${c.secondary}" stroke-width="1.2"/>`
  }
  // garland: a scalloped swag of marigold-sized dots hung under the photograph
  const dots = Array.from({ length: 23 }, (_, i) => {
    const t = i / 22
    const x = 26 + t * (POSTER_W - 52)
    const y = photoBottom + 6 + Math.sin(t * Math.PI) * 16
    const fill = i % 3 === 0 ? c.primary : i % 3 === 1 ? c.accent : c.secondary
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7" fill="${fill}" opacity="0.9"/>`
  }).join('')
  return `<rect x="22" y="22" width="${POSTER_W - 44}" height="${POSTER_H - 44}" fill="none" stroke="${c.primary}" stroke-width="2.5"/>${dots}`
}

const SERIF_FALLBACK = "'Hind Madurai','Segoe UI',sans-serif"

export interface PosterInput {
  event: EventRecord
  design: PosterDesign
  organisation: string
  /** What the QR opens: the public registration page. */
  registrationUrl: string
  /** Admin override. Defaults to the design's own theme. */
  themeId?: PosterVariant
  /** A photograph the admin picked by hand, instead of the automatic one. */
  photoSrc?: string
  /** Print the event's own `image` instead of a library photograph. */
  useEventImage?: boolean
}

export interface RenderedPoster {
  svg: string
  theme: PosterTheme
  photo: PosterPhoto
  /** False when the photograph could not be fetched and the drawn art was used. */
  photoEmbedded: boolean
}

/** The finished poster as one SVG: photograph, then the exact words, the logo and the QR. */
export async function renderPoster(input: PosterInput): Promise<RenderedPoster> {
  const { event, design, organisation, registrationUrl, themeId, photoSrc, useEventImage } = input
  const theme = POSTER_THEMES[themeId ?? design.variant]
  const c = theme.palette
  const W = POSTER_W
  const H = POSTER_H
  const text = design.textSnapshot
  const uid = design.id.replace(/[^a-zA-Z0-9_-]/g, '')

  const { photo, dataUri } = await resolvePosterPhoto({
    event,
    theme: theme.id,
    explicitSrc: photoSrc,
    useEventImage,
  })

  /* ---- the text block is measured from the bottom edge up, so a long event
     name shortens the photograph instead of running off the page. */
  const margin = 64
  const titleLines = wrap(text.eventName, 22, 3)
  const titleSize = titleLines.length >= 3 ? 50 : titleLines.length === 2 ? 58 : 64
  const lineH = Math.round(titleSize * 1.12)
  const titleH = titleLines.length * lineH

  const rows: [string, string][] = [
    ['WHEN', when(text.startAt, text.endAt)],
    ['WHERE', text.venue],
  ]
  if (text.chiefGuest) rows.push(['CHIEF GUEST', text.chiefGuest])
  rows.push(['ENTRY', text.ticketPrice ? `${formatMoney(text.ticketPrice)} per person` : 'Free entry'])
  rows.push(['CONTACT', text.contact])

  const rowH = 46
  const subH = 34
  const ruleGap = 26
  const afterRule = 22
  const blockH = titleH + subH + ruleGap + afterRule + rows.length * rowH
  const blockTop = H - 58 - blockH

  const titleTop = blockTop
  const subY = titleTop + titleH + 26
  const ruleY = titleTop + titleH + subH + 10
  const rowsTop = titleTop + titleH + subH + ruleGap + afterRule

  /* ---- photograph panel */
  const mastheadOnPhoto = theme.photo.scrimOpacity > 0
  const photoTop = mastheadOnPhoto ? 0 : 124
  const photoBottom = Math.min(theme.photo.maxHeight, blockTop - theme.photo.gap)
  const photoH = Math.max(0, photoBottom - photoTop)
  /** A full-bleed photo dissolves into the paper; a framed one keeps its edges. */
  const bleeds = theme.photo.inset === 0
  const photoX = theme.photo.inset
  const photoW = W - theme.photo.inset * 2

  const picture = dataUri
    ? `<image href="${dataUri}" xlink:href="${dataUri}" x="${photoX}" y="${photoTop}" width="${photoW}" height="${photoH}" preserveAspectRatio="${slice(photo.focusY)}"/>`
    : `<svg x="${photoX}" y="${photoTop}" width="${photoW}" height="${photoH}" viewBox="0 0 1024 1024" preserveAspectRatio="xMidYMid slice">${drawArt(theme.id, themeArtPalette(theme), design.seed)}</svg>`

  /* ---- masthead */
  const onPhotoInk = mastheadOnPhoto ? '#FFFFFF' : c.text
  const masthead = `<g transform="translate(${margin} ${mastheadOnPhoto ? 40 : 36})">
    <circle cx="30" cy="30" r="29" fill="${mastheadOnPhoto ? 'rgba(0,0,0,0.28)' : c.background}" stroke="${c.primary}" stroke-width="2.5"/>
    <path d="M30 11C37 22 39 28 30 35C21 28 23 22 30 11Z" fill="${c.primary}"/>
    <path d="M14 40Q30 56 46 40Z" fill="${c.accent}"/>
    <text x="74" y="28" font-family="${theme.fonts.display}, ${SERIF_FALLBACK}" font-size="29" font-weight="700" fill="${onPhotoInk}">${xmlEscape(wrap(organisation, 28, 1)[0] ?? '')}</text>
    <text x="74" y="52" font-family="${theme.fonts.body}" font-size="15" letter-spacing="1.4" fill="${c.primary}">${xmlEscape(SECTOR_LABEL[event.sectorId])}</text>
  </g>`

  /* ---- words */
  const title = titleLines
    .map((line, i) => `<text x="${margin}" y="${titleTop + titleSize + i * lineH}" font-family="${theme.fonts.display}, ${SERIF_FALLBACK}" font-size="${titleSize}" font-weight="700" fill="${c.text}">${xmlEscape(line)}</text>`)
    .join('')

  const kicker = `${POSTER_THEMES[theme.id].tamilLabel} · ${event.eventType.replace(/_/g, ' ')}`
  const subtitle = `<text x="${margin}" y="${subY}" font-family="${theme.fonts.body}" font-size="19" letter-spacing="3" fill="${c.accent}">${xmlEscape(kicker.toUpperCase())}</text>`

  const qrSize = 158
  const qrX = W - margin - qrSize
  const qrY = rowsTop + 2
  const valueMax = Math.floor((qrX - 24 - (margin + 164)) / 11.2)

  const body = rows
    .map(([label, value], i) => {
      const y = rowsTop + 28 + i * rowH
      return `<text x="${margin}" y="${y}" font-family="${theme.fonts.body}" font-size="14" font-weight="700" letter-spacing="2" fill="${c.primary}">${label}</text>
      <text x="${margin + 164}" y="${y}" font-family="${theme.fonts.body}" font-size="22" fill="${c.text}">${xmlEscape(wrap(value, Math.max(18, valueMax), 1)[0] ?? '')}</text>`
    })
    .join('')

  const code = await qr(registrationUrl, qrX, qrY, qrSize)

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${xmlEscape(text.eventName)} poster, ${theme.label} theme">
  <defs>
    <clipPath id="pc-${uid}"><rect x="${photoX}" y="${photoTop}" width="${photoW}" height="${photoH}" rx="${theme.photo.radius}"/></clipPath>
    <linearGradient id="pf-${uid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${c.background}" stop-opacity="0"/>
      <stop offset="0.65" stop-color="${c.background}" stop-opacity="0.72"/>
      <stop offset="1" stop-color="${c.background}"/>
    </linearGradient>
    <linearGradient id="ps-${uid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#140C06" stop-opacity="${theme.photo.scrimOpacity}"/>
      <!-- Held flat past the masthead baseline: a plain top-down fade leaves the sector
           label stranded on whatever the photograph happens to be doing at y=52. -->
      <stop offset="0.45" stop-color="#140C06" stop-opacity="${(theme.photo.scrimOpacity * 0.9).toFixed(3)}"/>
      <stop offset="1" stop-color="#140C06" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="${c.background}"/>

  <g clip-path="url(#pc-${uid})">
    ${picture}
    <rect x="${photoX}" y="${photoTop}" width="${photoW}" height="${photoH}" fill="${c.secondary}" opacity="${theme.photo.washOpacity}"/>
    ${mastheadOnPhoto ? `<rect x="${photoX}" y="${photoTop}" width="${photoW}" height="210" fill="url(#ps-${uid})"/>` : ''}
    ${bleeds ? `<rect x="${photoX}" y="${photoBottom - 240}" width="${photoW}" height="240" fill="url(#pf-${uid})"/>` : ''}
  </g>

  ${ornament(theme, photoBottom)}
  ${masthead}
  ${title}
  ${subtitle}
  <line x1="${margin}" y1="${ruleY}" x2="${W - margin}" y2="${ruleY}" stroke="${c.primary}" stroke-width="2" opacity="0.6"/>
  ${body}

  <rect x="${qrX - 10}" y="${qrY - 10}" width="${qrSize + 20}" height="${qrSize + 20}" rx="8" fill="#FFFFFF" stroke="${c.primary}" stroke-width="2"/>
  ${code}
  <text x="${qrX + qrSize / 2}" y="${qrY + qrSize + 32}" text-anchor="middle" font-family="${theme.fonts.body}" font-size="16" font-weight="600" fill="${c.text}">Scan to register</text>
</svg>`

  return { svg, theme, photo, photoEmbedded: dataUri !== null }
}

/** The poster as a plain SVG string. Kept for the many callers that only want the markup. */
export async function renderPosterSvg(input: PosterInput): Promise<string> {
  return (await renderPoster(input)).svg
}
