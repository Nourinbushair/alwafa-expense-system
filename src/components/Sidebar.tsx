'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '../lib/supabase/client'

const menuItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: '▦',
  },
  {
    name: 'Expenses',
    href: '/expenses',
    icon: '◈',
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: '▤',
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: '⚙',
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()

    await supabase.auth.signOut()

    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-64 flex-col border-r border-slate-200 bg-white">
      
      {/* Logo */}
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
      </div>

      {/* Navigation */}
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

      {/* Bottom section */}
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
  )
}