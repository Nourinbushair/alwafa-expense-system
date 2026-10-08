'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '../../lib/supabase/client'

type Expense = {
  id: string
  expense_date: string
  main_category: string
  subcategory: string
  description: string | null
  amount: number
}

const menuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: '▦' },
  { name: 'Expenses', href: '/expenses', icon: '◈' },
  { name: 'Reports', href: '/reports', icon: '▤' },
  { name: 'Settings', href: '/settings', icon: '⚙' },
]

const categories = [
  { name: 'Company', icon: '🏢' },
  { name: 'Personal', icon: '👤' },
  { name: 'Bills & Utilities', icon: '⚡' },
  { name: 'Rent', icon: '🏠' },
  { name: 'Salary & Payroll', icon: '💰' },
  { name: 'Purchases', icon: '🛒' },
  { name: 'Transport & Vehicle', icon: '⛽' },
  { name: 'Finance', icon: '💳' },
]

export default function DashboardPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadExpenses() {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('expenses')
        .select(
          'id, expense_date, main_category, subcategory, description, amount'
        )
        .order('expense_date', { ascending: false })

      if (error) {
        console.error('Expense loading error:', error)
        setLoading(false)
        return
      }

      setExpenses(data || [])
      setLoading(false)
    }

    loadExpenses()
  }, [])

  const total = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0
  )

  function categoryTotal(category: string) {
    return expenses
      .filter((expense) => expense.main_category === category)
      .reduce((sum, expense) => sum + Number(expense.amount), 0)
  }

  async function handleLogout() {
    const supabase = createClient()

    await supabase.auth.signOut()

    window.location.href = '/login'
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
                  item.href === '/dashboard'
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
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-6">

          <div>
            <h1 className="text-2xl font-semibold text-slate-800">
              Dashboard
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Expense overview
            </p>
          </div>

          {/* ADD EXPENSE BUTTON */}
          <Link
            href="/expenses"
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
          >
            <span className="mr-2 text-lg leading-none">
              +
            </span>

            Add Expense
          </Link>

        </header>

        {/* PAGE CONTENT */}
        <div className="p-8">

          {/* TOTAL EXPENSE */}
          <section className="rounded-xl bg-blue-600 p-6 shadow-sm">

            <p className="text-sm text-blue-100">
              Total Expenses
            </p>

            <h2 className="mt-2 text-3xl font-semibold text-white">
              OMR {total.toFixed(3)}
            </h2>

            <p className="mt-2 text-sm text-blue-100">
              Total recorded expenses
            </p>

          </section>

          {/* EXPENSE SUMMARY */}
          <section className="mt-8">

            <div className="mb-4">

              <h2 className="text-lg font-semibold text-slate-800">
                Expense Summary
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Expenses by category
              </p>

            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

              {categories.map((category) => (
                <div
                  key={category.name}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                >

                  <div className="flex items-center gap-3">

                    <span className="text-xl">
                      {category.icon}
                    </span>

                    <span className="text-sm font-medium text-slate-600">
                      {category.name}
                    </span>

                  </div>

                  <p className="mt-4 text-xl font-semibold text-slate-800">
                    OMR {categoryTotal(category.name).toFixed(3)}
                  </p>

                </div>
              ))}

            </div>

          </section>

          {/* RECENT EXPENSES */}
          <section className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

            {/* SECTION HEADER */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div>

                <h2 className="text-lg font-semibold text-slate-800">
                  Recent Expenses
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Latest transactions
                </p>

              </div>

              <Link
                href="/expenses"
                className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
              >
                View All
              </Link>

            </div>

            {/* LOADING */}
            {loading && (
              <div className="px-6 py-10 text-center text-sm text-slate-500">
                Loading expenses...
              </div>
            )}

            {/* EMPTY */}
            {!loading && expenses.length === 0 && (
              <div className="px-6 py-10 text-center">

                <p className="text-sm text-slate-500">
                  No expenses recorded yet.
                </p>

                <Link
                  href="/expenses"
                  className="mt-3 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Add your first expense
                </Link>

              </div>
            )}

            {/* EXPENSE LIST */}
            {!loading && expenses.length > 0 && (
              <div className="divide-y divide-slate-100">

                {expenses.slice(0, 5).map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between px-6 py-4 transition hover:bg-slate-50"
                  >

                    <div>

                      <p className="font-medium text-slate-700">
                        {expense.description || expense.subcategory}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {expense.expense_date} ·{' '}
                        {expense.main_category} ·{' '}
                        {expense.subcategory}
                      </p>

                    </div>

                    <p className="font-semibold text-slate-700">
                      OMR {Number(expense.amount).toFixed(3)}
                    </p>

                  </div>
                ))}

              </div>
            )}

          </section>

        </div>

      </main>

    </div>
  )
}