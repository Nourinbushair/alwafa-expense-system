'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'

const menuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: '▦' },
  { name: 'Expenses', href: '/expenses', icon: '◈' },
  { name: 'Reports', href: '/reports', icon: '▤' },
  { name: 'Settings', href: '/settings', icon: '⚙' },
]

export default function SettingsPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('admin')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    setEmail(user.email || '')

    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error(error)
      setError('Unable to load profile.')
      setLoading(false)
      return
    }

    setFullName(data?.full_name || '')
    setRole(data?.role || 'admin')
    setLoading(false)
  }

  async function handleSaveProfile() {
    setSaving(true)
    setMessage('')
    setError('')

    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
      })
      .eq('id', user.id)

    if (error) {
      console.error(error)
      setError('Unable to update profile.')
      setSaving(false)
      return
    }

    setMessage('Profile updated successfully.')
    setSaving(false)
  }

  async function handleLogout() {
    const supabase = createClient()

    await supabase.auth.signOut()

    window.location.href = '/login'
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">
          Loading settings...
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* SIDEBAR */}
      <aside className="fixed left-0 top-0 flex h-screen w-60 flex-col border-r border-slate-200 bg-white">

        {/* LOGO */}
        <div className="flex h-20 items-center border-b border-slate-100 px-6">

          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
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

        {/* NAVIGATION */}
        <nav className="flex-1 px-4 py-6">

          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Main Menu
          </p>

          <div className="space-y-1">

            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center rounded-lg px-3 py-3 text-sm ${
                  item.href === '/settings'
                    ? 'bg-blue-50 font-medium text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="mr-3 w-5 text-center">
                  {item.icon}
                </span>

                {item.name}
              </Link>
            ))}

          </div>

        </nav>

        {/* SIDEBAR BOTTOM */}
        <div className="border-t border-slate-100 p-4">

          <div className="mb-3 flex items-center rounded-lg bg-emerald-50 px-3 py-2">

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

      {/* MAIN CONTENT */}
      <main className="ml-60 min-h-screen">

        {/* HEADER */}
        <header className="border-b border-slate-200 bg-white px-8 py-6">

          <h1 className="text-2xl font-semibold text-slate-800">
            Settings
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage your account and system settings
          </p>

        </header>

        {/* PAGE CONTENT */}
        <div className="max-w-4xl p-8">

          {/* PROFILE */}
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 px-6 py-5">

              <h2 className="text-lg font-semibold text-slate-800">
                Account Information
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Manage your account details
              </p>

            </div>

            <div className="space-y-6 p-6">

              {/* FULL NAME */}
              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Full Name
                </label>

                <input
                  type="text"
                  value={fullName}
                  onChange={(event) =>
                    setFullName(event.target.value)
                  }
                  placeholder="Enter your full name"
                  className="w-full max-w-xl rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

              </div>

              {/* EMAIL */}
              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Email Address
                </label>

                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full max-w-xl rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500"
                />

                <p className="mt-2 text-xs text-slate-400">
                  Email address is managed through authentication.
                </p>

              </div>

              {/* ROLE */}
              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Account Role
                </label>

                <input
                  type="text"
                  value={role}
                  disabled
                  className="w-full max-w-xl rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm capitalize text-slate-500"
                />

              </div>

              {/* MESSAGE */}
              {message && (
                <div className="max-w-xl rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {message}
                </div>
              )}

              {error && (
                <div className="max-w-xl rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* SAVE */}
              <div className="border-t border-slate-100 pt-5">

                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? 'Saving...'
                    : 'Save Changes'}
                </button>

              </div>

            </div>

          </section>

          {/* SYSTEM INFORMATION */}
          <section className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 px-6 py-5">

              <h2 className="text-lg font-semibold text-slate-800">
                System Information
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Current application details
              </p>

            </div>

            <div className="divide-y divide-slate-100">

              <div className="flex items-center justify-between px-6 py-5">

                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Company
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Organization using this system
                  </p>
                </div>

                <p className="text-sm font-medium text-slate-700">
                  Al-Wafa International
                </p>

              </div>

              <div className="flex items-center justify-between px-6 py-5">

                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Currency
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Default transaction currency
                  </p>
                </div>

                <p className="text-sm font-medium text-slate-700">
                  OMR
                </p>

              </div>

              <div className="flex items-center justify-between px-6 py-5">

                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Application Version
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Current system version
                  </p>
                </div>

                <p className="text-sm font-medium text-slate-700">
                  v1.0
                </p>

              </div>

              <div className="flex items-center justify-between px-6 py-5">

                <div>
                  <p className="text-sm font-medium text-slate-700">
                    System Status
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Application availability
                  </p>
                </div>

                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  Online
                </span>

              </div>

            </div>

          </section>

          {/* SECURITY */}
          <section className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 px-6 py-5">

              <h2 className="text-lg font-semibold text-slate-800">
                Security
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Account security information
              </p>

            </div>

            <div className="p-6">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm font-medium text-slate-700">
                    Authentication
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Your account is protected by Supabase authentication.
                  </p>

                </div>

                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  Protected
                </span>

              </div>

            </div>

          </section>

        </div>

      </main>

    </div>
  )
}