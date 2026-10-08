import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { useDb } from '@/store/db'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function ConsoleLayout() {
  const load = useDb((s) => s.load)
  const { pathname } = useLocation()

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <div className="flex min-h-screen bg-sandal-50">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
