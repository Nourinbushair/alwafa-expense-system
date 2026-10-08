'use client'

import { useEffect, useState } from 'react'
import Sidebar from '../../components/Sidebar'
import { createClient } from '../../lib/supabase/client'

export default function SettingsPage() {
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUser()
  }, [])

  async function loadUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user?.email) {
      setEmail(user.email)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50">
      <Sidebar />

      <main className="min-h-screen md:ml-64">

        {/* HEADER */}
        <header className="border-b border-slate-200 bg-white px-4 pb-5 pt-20 sm:px-6 md:px-8 md:py-6 md:pt-6">
          <h1 className="text-xl font-semibold text-slate-800 sm:text-2xl">
            Settings
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage system and account information
          </p>
        </header>

        <div className="space-y-6 p-4 sm:p-6 md:p-8">

          {/* COMPANY INFORMATION */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h2 className="font-semibold text-slate-800">
                Company Information
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Basic information about the expense management system.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Company Name
                </p>

                <p className="mt-2 font-semibold text-slate-800">
                  Al-Wafa International
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  System
                </p>

                <p className="mt-2 font-semibold text-slate-800">
                  Expense Management System
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Currency
                </p>

                <p className="mt-2 font-semibold text-slate-800">
                  OMR — Omani Rial
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Version
                </p>

                <p className="mt-2 font-semibold text-slate-800">
                  v1.0
                </p>
              </div>

            </div>
          </section>

          {/* ACCOUNT */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h2 className="font-semibold text-slate-800">
                Account
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Current signed-in account information.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
                AW
              </div>

              <div>
                <p className="text-sm font-medium text-slate-800">
                  {loading ? 'Loading...' : email || 'No email available'}
                </p>

                <div className="mt-1 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />

                  <span className="text-xs text-emerald-600">
                    Account Active
                  </span>
                </div>
              </div>

            </div>
          </section>

          {/* SYSTEM */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h2 className="font-semibold text-slate-800">
                System Information
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Technical information about this application.
              </p>
            </div>

            <div className="space-y-3">

              <div className="flex flex-col justify-between gap-1 border-b border-slate-100 py-3 sm:flex-row sm:items-center">
                <span className="text-sm text-slate-500">
                  Application
                </span>

                <span className="text-sm font-medium text-slate-800">
                  Al-Wafa Expense System
                </span>
              </div>

              <div className="flex flex-col justify-between gap-1 border-b border-slate-100 py-3 sm:flex-row sm:items-center">
                <span className="text-sm text-slate-500">
                  Database
                </span>

                <span className="text-sm font-medium text-slate-800">
                  Supabase PostgreSQL
                </span>
              </div>

              <div className="flex flex-col justify-between gap-1 border-b border-slate-100 py-3 sm:flex-row sm:items-center">
                <span className="text-sm text-slate-500">
                  Authentication
                </span>

                <span className="text-sm font-medium text-emerald-600">
                  Secure Authentication
                </span>
              </div>

              <div className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center">
                <span className="text-sm text-slate-500">
                  Currency Format
                </span>

                <span className="text-sm font-medium text-slate-800">
                  OMR 0.000
                </span>
              </div>

            </div>
          </section>

          {/* SECURITY */}
          <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5 sm:p-6">
            <h2 className="font-semibold text-blue-800">
              Security
            </h2>

            <p className="mt-2 text-sm leading-6 text-blue-700">
              This system uses authenticated access and Supabase
              Row Level Security to protect expense data.
            </p>
          </section>

        </div>
      </main>
    </div>
  )
}