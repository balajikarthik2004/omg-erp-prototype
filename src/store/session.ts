import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

import {
  SETTLEMENT_CURRENCY,
  currencyForCountry,
  detectCountry,
  type Currency,
} from '@/lib/currency'
import type { Dedication, Role, SectorId } from '@/types'
import { USERS } from '@/mock/seed'

export interface CartLine {
  /** Stable key so the same item with a different dedication stays separate. */
  key: string
  itemId: string
  sectorId: SectorId
  amount: number
  dedication?: Dedication
  serviceDate?: string
  /** Tickets, for ticketed events. */
  quantity?: number
  /** Membership renewal plan. */
  recurring?: 'monthly' | 'annual'
}

export type SectorFilter = SectorId | 'all'

interface SessionState {
  /** Demo control: whose console we are looking at. */
  personaId: string
  sectorFilter: SectorFilter
  signedIn: boolean
  cart: CartLine[]
  sidebarOpen: boolean
  /** Desktop only: the sidebar collapsed to an icon rail. */
  sidebarCollapsed: boolean
  /** Sidebar groups the person has opened or closed, by group label. */
  navOpenGroups: Record<string, boolean>
  /**
   * Where the donor says they are, and the money they are shown. Guessed once
   * from the browser and overridable on the Gaushala page. It decides the
   * prices on screen and the receipt wording, never what the ledger settles.
   */
  donorCountry: string
  displayCurrency: Currency

  setPersona: (id: string) => void
  setSectorFilter: (value: SectorFilter) => void
  signIn: () => void
  signOut: () => void
  setSidebarOpen: (open: boolean) => void
  toggleSidebarCollapsed: () => void
  toggleNavGroup: (label: string, open: boolean) => void
  setDisplayCurrency: (currency: Currency) => void
  setDonorCountry: (country: string) => void

  addToCart: (line: Omit<CartLine, 'key'>) => void
  removeFromCart: (key: string) => void
  updateCartAmount: (key: string, amount: number) => void
  clearCart: () => void
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      personaId: 'u-sup',
      sectorFilter: 'all',
      signedIn: false,
      cart: [],
      sidebarOpen: false,
      sidebarCollapsed: false,
      navOpenGroups: {},
      donorCountry: detectCountry(),
      // Prices open in the settlement currency, so every visitor sees the
      // same dollar figures the ledger and the console are kept in. The
      // switcher on the page still converts for a donor who wants it.
      displayCurrency: SETTLEMENT_CURRENCY,

      setPersona: (id) => set({ personaId: id }),
      setSectorFilter: (value) => set({ sectorFilter: value }),
      signIn: () => set({ signedIn: true }),
      signOut: () => set({ signedIn: false, cart: [] }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebarCollapsed: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      toggleNavGroup: (label, open) =>
        set((s) => ({ navOpenGroups: { ...s.navOpenGroups, [label]: open } })),
      setDisplayCurrency: (currency) => set({ displayCurrency: currency }),
      setDonorCountry: (country) => set({ donorCountry: country, displayCurrency: currencyForCountry(country) }),

      addToCart: (line) =>
        set((s) => ({
          cart: [
            ...s.cart,
            { ...line, key: `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` },
          ],
        })),
      removeFromCart: (key) => set((s) => ({ cart: s.cart.filter((l) => l.key !== key) })),
      updateCartAmount: (key, amount) =>
        set((s) => ({ cart: s.cart.map((l) => (l.key === key ? { ...l, amount } : l)) })),
      clearCart: () => set({ cart: [] }),
    }),
    {
      name: 'omg-session',
      storage: createJSONStorage(() => localStorage),
      // v1 dropped the browser-detected display currency. Without the bump a
      // visitor who had already been shown rupees would keep seeing them.
      version: 1,
      migrate: (state, from) => {
        if (from < 1 && state && typeof state === 'object') {
          return { ...(state as object), displayCurrency: SETTLEMENT_CURRENCY }
        }
        return state
      },
      // Only the demo controls persist. Business data never does.
      partialize: (s) => ({
        personaId: s.personaId,
        sectorFilter: s.sectorFilter,
        sidebarCollapsed: s.sidebarCollapsed,
        navOpenGroups: s.navOpenGroups,
        donorCountry: s.donorCountry,
        displayCurrency: s.displayCurrency,
      }),
    },
  ),
)

export function currentUser(personaId: string) {
  return USERS.find((u) => u.id === personaId) ?? USERS[0]!
}

export function useCurrentUser() {
  return useSession((s) => currentUser(s.personaId))
}

export function useCurrentRole(): Role {
  return useSession((s) => currentUser(s.personaId).role)
}

export const CONSOLE_ROLES: Role[] = [
  'super_admin',
  'sector_admin',
  'store_keeper',
  'procurement_officer',
  'ca_staff',
  'ca_partner',
  'trustee',
  'gaushala_admin',
  'gaushala_accountant',
  'gaushala_caretaker',
  'gaushala_content_editor',
]

export function cartTotal(cart: CartLine[]): number {
  return cart.reduce((sum, line) => sum + line.amount, 0)
}
