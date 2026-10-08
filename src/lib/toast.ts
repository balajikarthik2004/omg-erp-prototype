import { create } from 'zustand'

export type ToastTone = 'success' | 'info' | 'warning' | 'danger'

export interface ToastItem {
  id: string
  title: string
  detail?: string
  tone: ToastTone
}

interface ToastState {
  items: ToastItem[]
  push: (toast: Omit<ToastItem, 'id'>) => void
  dismiss: (id: string) => void
}

export const useToasts = create<ToastState>((set) => ({
  items: [],
  push: (toast) =>
    set((s) => ({
      items: [...s.items, { ...toast, id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }],
    })),
  dismiss: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}))

/**
 * Imperative helper, so a store action can say exactly what it changed without
 * the store having to reach into the component layer.
 */
export const toast = {
  success: (title: string, detail?: string) => useToasts.getState().push({ title, detail, tone: 'success' }),
  info: (title: string, detail?: string) => useToasts.getState().push({ title, detail, tone: 'info' }),
  warning: (title: string, detail?: string) => useToasts.getState().push({ title, detail, tone: 'warning' }),
  danger: (title: string, detail?: string) => useToasts.getState().push({ title, detail, tone: 'danger' }),
  soon: () => useToasts.getState().push({ title: 'Coming in the next build', tone: 'info' }),
}
