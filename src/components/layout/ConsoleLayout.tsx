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
    <div className="flex min-h-screen bg-navy-50">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        {/* Capped, so a table does not stretch to 2500px on a wide monitor. */}
        <main className="flex-1 px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-5">
          <div className="mx-auto w-full max-w-[1400px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
