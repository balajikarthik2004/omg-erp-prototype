/**
 * Signed ticket tokens. A token is `tkt-<registrationId>.<signature>`, and the
 * signature covers the event, the registration and the party size, so a ticket
 * cannot be forged or moved to another event.
 *
 * The real service uses HMAC-SHA256 with a server secret. A browser prototype
 * has no server secret and Web Crypto is async, so this uses a keyed 106-bit
 * hash instead. It behaves the same for the demo; it is not cryptographically strong.
 */

const SECRET = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)

function cyrb53(text: string, seed: number): number {
  let h1 = 0xdeadbeef ^ seed
  let h2 = 0x41c6ce57 ^ seed
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return 4294967296 * (2097151 & h2) + (h1 >>> 0)
}

function sign(eventId: string, regId: string, qty: number): string {
  const body = `${SECRET}|${eventId}|${regId}|${qty}`
  return cyrb53(body, 1).toString(36) + cyrb53(body, 2).toString(36)
}

export function issueTicketToken(eventId: string, regId: string, qty: number): string {
  return `tkt-${regId}.${sign(eventId, regId, qty)}`
}

export function verifyTicketToken(
  eventId: string,
  token: string,
  lookupQty: (regId: string) => number | undefined,
): { valid: true; regId: string } | { valid: false } {
  const clean = token.trim()
  if (!clean.startsWith('tkt-')) return { valid: false }
  const body = clean.slice(4)
  const dot = body.lastIndexOf('.')
  if (dot <= 0) return { valid: false }
  const regId = body.slice(0, dot)
  const qty = lookupQty(regId)
  if (qty === undefined) return { valid: false }
  return sign(eventId, regId, qty) === body.slice(dot + 1) ? { valid: true, regId } : { valid: false }
}
