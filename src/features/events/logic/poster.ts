import { format } from 'date-fns'
import QRCode from 'qrcode'

import { createRng, type Rng } from '@/lib/rng'
import { formatMoney } from '@/lib/format'
import type { EventRecord, ImageProviderType, PosterDesign, PosterVariant, SectorId } from '@/types'

/**
 * Poster pipeline. The artwork is background only, with no words. Every word,
 * the logo and the QR code are drawn by the app from the event record, so the
 * text is always exact and Tamil never goes through an image model.
 *
 * The real service asks Cloudflare FLUX, then Pollinations, then falls back to
 * bundled templates. A prototype has no keys and no server, so the provider
 * here is the bundled-template one (drawn from a seed), and the prompt that
 * would be sent is still built and shown.
 */

export const POSTER_W = 1024
export const POSTER_H = 1448

export const VARIANTS: { id: PosterVariant; label: string }[] = [
  { id: 'traditional', label: 'Traditional' },
  { id: 'modern', label: 'Modern minimal' },
  { id: 'festive', label: 'Festive' },
]

/** Poster colours. A poster is an exported file, so these are fixed values rather than theme variables. */
const PALETTE: Record<SectorId, { bg: string; main: string; accent: string; soft: string }> = {
  temple: { bg: '#FBF3E4', main: '#9A1F18', accent: '#D4971A', soft: '#F2E4C9' },
  sevalaya: { bg: '#EEF5EC', main: '#1F5A38', accent: '#D4971A', soft: '#CFE6D5' },
  sangam: { bg: '#E9F2F6', main: '#134E64', accent: '#D4971A', soft: '#CFE3EC' },
}
const INK = '#2B1A12'
const PAPER = '#FFFBF4'
const RULE = '#E3CDA4'

const SECTOR_LABEL: Record<SectorId, string> = {
  temple: 'கோயில் · Temple',
  sevalaya: 'சேவாலயா · Sevalaya',
  sangam: 'தமிழ்ச் சங்கம் · Tamil Heritage',
}

/* ---------------------------------------------------------------- prompt */

export function buildPosterPrompt(variant: PosterVariant, sectorId: SectorId, eventType: string): string {
  const style: Record<PosterVariant, string> = {
    traditional: 'Rich traditional South Indian art style with ornate brass lamps and sacred kolam borders',
    modern: 'Clean modern minimal flat illustration with a soft temple gopuram silhouette and geometric borders',
    festive: 'Vibrant festive artwork with flowing marigold garlands, deepam lamps and toran banners',
  }
  const motifs: Record<SectorId, string> = {
    temple: 'warm turmeric gold and kumkum red palette',
    sevalaya: 'sandalwood and tulsi green tones, nurturing hands, banyan tree canopy',
    sangam: 'palm-leaf manuscript texture, veena strings, Tamil geometric border',
  }
  return `${style[variant]}, background artwork for a ${sectorId} ${eventType.toLowerCase()} celebration, ${motifs[sectorId]}, soft empty area in the lower third, print quality. No text, no letters, no words, no numbers, no logos, no human faces, no deities.`
}

/* ------------------------------------------------------------------- art */

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

export function renderArt(variant: PosterVariant, sectorId: SectorId, seed: number): string {
  const rng = createRng(seed)
  const pal = PALETTE[sectorId]
  if (variant === 'traditional') return artTraditional(pal, rng)
  if (variant === 'modern') return artModern(pal, rng)
  return artFestive(pal, rng)
}

/**
 * Three designs for one event. Cloudflare and Pollinations need keys and a
 * network, so a prototype always lands on the bundled-template provider.
 */
export function generateDesigns(
  event: EventRecord,
  batchNo: number,
  createdBy: string,
  makeId: () => string,
): PosterDesign[] {
  const baseSeed = batchNo * 10_000 + Math.abs(hash(event.id)) % 9_000
  const provider: ImageProviderType = 'template'
  return VARIANTS.map((v, i) => ({
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

const SERIF = "'Cormorant Garamond','Hind Madurai',Georgia,serif"
const SANS = "'Hind Madurai','Segoe UI',sans-serif"

export interface PosterInput {
  event: EventRecord
  design: PosterDesign
  organisation: string
  /** What the QR opens: the public registration page. */
  registrationUrl: string
}

/** The finished poster as one SVG: art, then the exact words, the logo and the QR. */
export async function renderPosterSvg({ event, design, organisation, registrationUrl }: PosterInput): Promise<string> {
  const pal = PALETTE[event.sectorId]
  const W = POSTER_W
  const H = POSTER_H
  const text = design.textSnapshot

  const titleLines = wrap(text.eventName, 20, 3)
  const titleY = 800
  const title = titleLines
    .map((line, i) => `<text x="${W / 2}" y="${titleY + i * 74}" text-anchor="middle" font-family="${SERIF}" font-size="64" font-weight="700" fill="${INK}">${xmlEscape(line)}</text>`)
    .join('')

  const top = titleY + titleLines.length * 74 + 8
  const rows: [string, string][] = [['WHEN', when(text.startAt, text.endAt)], ['WHERE', text.venue]]
  if (text.chiefGuest) rows.push(['CHIEF GUEST', text.chiefGuest])
  rows.push(['ENTRY', text.ticketPrice ? `${formatMoney(text.ticketPrice)} per person` : 'Free entry'])
  rows.push(['CONTACT', text.contact])
  const body = rows
    .map(([label, value], i) => {
      const y = top + i * 52
      return `<text x="70" y="${y}" font-family="${SANS}" font-size="15" font-weight="700" letter-spacing="2" fill="${pal.accent}">${label}</text>
      <text x="236" y="${y}" font-family="${SANS}" font-size="24" fill="${INK}">${xmlEscape(wrap(value, 44, 1)[0] ?? '')}</text>`
    })
    .join('')

  const size = 200
  const qrX = W - 70 - size
  const qrY = H - 70 - size - 34
  const code = await qr(registrationUrl, qrX, qrY, size)

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${xmlEscape(text.eventName)} poster">
  <defs><linearGradient id="pf-${design.id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${PAPER}" stop-opacity="0"/><stop offset="1" stop-color="${PAPER}"/></linearGradient></defs>
  <rect width="${W}" height="${H}" fill="${PAPER}"/>
  <svg x="0" y="0" width="${W}" height="${W}" viewBox="0 0 1024 1024" preserveAspectRatio="xMidYMid slice">${renderArt(design.variant, event.sectorId, design.seed)}</svg>
  <rect x="0" y="${W - 220}" width="${W}" height="220" fill="url(#pf-${design.id})"/>
  <rect x="0" y="${W}" width="${W}" height="${H - W}" fill="${PAPER}"/>
  <rect x="0" y="0" width="${W}" height="104" fill="${PAPER}" opacity="0.9"/>
  <g transform="translate(40 16)">
    <circle cx="36" cy="36" r="34" fill="${PAPER}" stroke="${pal.accent}" stroke-width="3"/>
    <path d="M36 14C43 25 45 31 36 38C27 31 29 25 36 14Z" fill="${pal.main}"/>
    <path d="M19 44Q36 60 53 44Z" fill="${pal.accent}"/>
    <text x="84" y="36" font-family="${SERIF}" font-size="32" font-weight="700" fill="${INK}">${xmlEscape(wrap(organisation, 26, 1)[0] ?? '')}</text>
    <text x="84" y="62" font-family="${SANS}" font-size="16" fill="${pal.main}">${xmlEscape(SECTOR_LABEL[event.sectorId])}</text>
  </g>
  ${title}
  <line x1="70" y1="${top - 40}" x2="${W - 70}" y2="${top - 40}" stroke="${RULE}" stroke-width="2"/>
  ${body}
  <rect x="${qrX - 10}" y="${qrY - 10}" width="${size + 20}" height="${size + 20}" rx="10" fill="#FFFFFF" stroke="${RULE}" stroke-width="2"/>
  ${code}
  <text x="${qrX + size / 2}" y="${qrY + size + 38}" text-anchor="middle" font-family="${SANS}" font-size="18" font-weight="600" fill="${INK}">Scan to register</text>
</svg>`
}
