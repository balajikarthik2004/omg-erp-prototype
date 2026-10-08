import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

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
}

export type SectorFilter = SectorId | 'all'

interface SessionState {
  /** Demo control: whose console we are looking at. */
  personaId: string
  sectorFilter: SectorFilter
  signedIn: boolean
  cart: CartLine[]
  sidebarOpen: boolean

  setPersona: (id: string) => void
  setSectorFilter: (value: SectorFilter) => void
  signIn: () => void
  signOut: () => void
  setSidebarOpen: (open: boolean) => void

  addToCart: (line: Omit<CartLine, 'key'>) => void
  removeFromCart: (key: string) => void
  updateCartAmount: (key: string, amount: number) => void
  clearCart: () => void
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      personaId: 'u-cap',
      sectorFilter: 'all',
      signedIn: false,
      cart: [],
      sidebarOpen: false,

      setPersona: (id) => set({ personaId: id }),
      setSectorFilter: (value) => set({ sectorFilter: value }),
      signIn: () => set({ signedIn: true }),
      signOut: () => set({ signedIn: false, cart: [] }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

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
      // Only the demo controls persist. Business data never does.
      partialize: (s) => ({ personaId: s.personaId, sectorFilter: s.sectorFilter }),
    },
  ),
)

export function currentUser(personaId: string) {
  return USERS.find((u) => u.id === personaId) ?? USERS[5]!
}

export function useCurrentUser() {
  return useSession((s) => currentUser(s.personaId))
}

export function useCurrentRole(): Role {
  return useSession((s) => currentUser(s.personaId).role)
}

export const CONSOLE_ROLES: Role[] = [
  'sector_admin',
  'store_keeper',
  'procurement_officer',
  'ca_staff',
  'ca_partner',
  'trustee',
]

export function cartTotal(cart: CartLine[]): number {
  return cart.reduce((sum, line) => sum + line.amount, 0)
}
