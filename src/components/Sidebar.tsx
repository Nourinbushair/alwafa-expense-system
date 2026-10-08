'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '../lib/supabase/client'

const menuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: '▦' },
  { name: 'Expenses', href: '/expenses', icon: '◈' },
  { name: 'Reports', href: '/reports', icon: '▤' },
  { name: 'Settings', href: '/settings', icon: '⚙' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    const supabase = createClient()

    await supabase.auth.signOut()

    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* MOBILE TOP BAR */}
      <header className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden">
        <div className="flex items-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-xs font-semibold text-white">
            AW
          </div>

          <div className="ml-2">
            <h1 className="text-sm font-semibold text-slate-800">
              Al-Wafa
            </h1>

            <p className="text-[10px] text-slate-400">
              International
            </p>
          </div>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          aria-label="Toggle menu"
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
      </header>

      {/* MOBILE OVERLAY */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ${
          mobileOpen
            ? 'translate-x-0'
            : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* LOGO */}
        <div className="flex h-20 items-center border-b border-slate-100 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-sm font-semibold text-white">
            AW
          </div>

          <div className="ml-3">
            <h1 className="text-sm font-semibold text-slate-800">
              Al-Wafa
            </h1>

            <p className="text-xs text-slate-400">
              International
            </p>
          </div>

          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto rounded-lg p-2 text-slate-400 hover:bg-slate-100 md:hidden"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 px-4 py-6">
          <p className="mb-3 px-3 text-xs font-medium uppercase tracking-wide text-slate-400">
            Main Menu
          </p>

          <div className="space-y-1">
            {menuItems.map((item) => {
              const active = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center rounded-lg px-3 py-3 text-sm transition ${
                    active
                      ? 'bg-blue-50 font-medium text-blue-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className="mr-3 w-5 text-center text-base">
                    {item.icon}
                  </span>

                  {item.name}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* BOTTOM */}
        <div className="border-t border-slate-100 p-4">
          <div className="mb-4 flex items-center rounded-lg bg-emerald-50 px-3 py-2">
            <span className="mr-2 h-2 w-2 rounded-full bg-emerald-500" />

            <span className="text-xs font-medium text-emerald-700">
              System Online
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center rounded-lg px-3 py-3 text-sm text-slate-500 transition hover:bg-red-50 hover:text-red-600"
          >
            <span className="mr-3 w-5 text-center">
              ↪
            </span>

            Sign Out
          </button>

          <p className="mt-4 px-3 text-xs text-slate-300">
            Al-Wafa Expense System v1.0
          </p>
        </div>
      </aside>
    </>
  )
}