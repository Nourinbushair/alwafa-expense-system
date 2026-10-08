'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'

type Expense = {
  id: string
  expense_date: string
  main_category: string
  subcategory: string
  description: string | null
  amount: number
  company_name: string | null
  product_name: string | null
  paid_amount: number | null
  balance_amount: number | null
  invoice_number: string | null
}

const menuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: '▦' },
  { name: 'Expenses', href: '/expenses', icon: '◈' },
  { name: 'Reports', href: '/reports', icon: '▤' },
  { name: 'Settings', href: '/settings', icon: '⚙' },
]

export default function ReportsPage() {
  const router = useRouter()

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  )

  useEffect(() => {
    loadExpenses()
  }, [])

  async function loadExpenses() {
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { data, error } = await supabase
      .from('expenses')
      .select(
        `
        id,
        expense_date,
        main_category,
        subcategory,
        description,
        amount,
        company_name,
        product_name,
        paid_amount,
        balance_amount,
        invoice_number
        `
      )
      .order('expense_date', { ascending: false })

    if (error) {
      console.error(error)
      setLoading(false)
      return
    }

    setExpenses(data || [])
    setLoading(false)
  }

  async function handleLogout() {
    const supabase = createClient()

    await supabase.auth.signOut()

    window.location.href = '/login'
  }

  const monthlyExpenses = expenses.filter((expense) =>
    expense.expense_date.startsWith(selectedMonth)
  )

  const totalExpenses = monthlyExpenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0
  )

  const totalPaid = monthlyExpenses.reduce(
    (sum, expense) =>
      sum + Number(expense.paid_amount || 0),
    0
  )

  const totalBalance = monthlyExpenses.reduce(
    (sum, expense) =>
      sum + Number(expense.balance_amount || 0),
    0
  )

  function getMonthName() {
    const date = new Date(`${selectedMonth}-01`)

    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })
  }

  function downloadCSV() {
    if (monthlyExpenses.length === 0) {
      alert('No expenses found for the selected month.')
      return
    }

    const headers = [
      'Date',
      'Category',
      'Subcategory',
      'Company / Supplier',
      'Product',
      'Invoice Number',
      'Amount (OMR)',
      'Paid (OMR)',
      'Balance (OMR)',
      'Description',
    ]

    const rows = monthlyExpenses.map((expense) => [
      expense.expense_date,
      expense.main_category,
      expense.subcategory,
      expense.company_name || '',
      expense.product_name || '',
      expense.invoice_number || '',
      Number(expense.amount).toFixed(3),
      Number(expense.paid_amount || 0).toFixed(3),
      Number(expense.balance_amount || 0).toFixed(3),
      expense.description || '',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row
          .map((value) =>
            `"${String(value).replace(/"/g, '""')}"`
          )
          .join(',')
      ),
    ].join('\n')

    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `Al-Wafa-Expense-Report-${selectedMonth}.csv`

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }

  function printReport() {
    if (monthlyExpenses.length === 0) {
      alert('No expenses found for the selected month.')
      return
    }

    window.print()
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* SIDEBAR */}
      <aside className="fixed left-0 top-0 flex h-screen w-60 flex-col border-r border-slate-200 bg-white print:hidden">

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
                  item.href === '/reports'
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
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-6 print:hidden">

          <div>
            <h1 className="text-2xl font-semibold text-slate-800">
              Reports
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Generate monthly expense reports
            </p>
          </div>

          <Link
            href="/expenses"
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
          >
            + Add Expense
          </Link>

        </header>

        {/* PAGE CONTENT */}
        <div className="p-8">

          {/* MONTH SELECTION */}
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm print:hidden">

            <div className="border-b border-slate-200 px-6 py-5">

              <h2 className="text-lg font-semibold text-slate-800">
                Monthly Report
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Select a month to generate the expense report
              </p>

            </div>

            <div className="flex flex-col gap-4 p-6 md:flex-row md:items-end md:justify-between">

              <div className="w-full md:w-80">

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Select Month
                </label>

                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(event) =>
                    setSelectedMonth(event.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

              </div>

              <div className="flex gap-3">

                <button
                  onClick={downloadCSV}
                  disabled={monthlyExpenses.length === 0}
                  className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ↓ Download Excel
                </button>

                <button
                  onClick={printReport}
                  disabled={monthlyExpenses.length === 0}
                  className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ↓ Download PDF
                </button>

              </div>

            </div>

          </section>

          {/* REPORT */}
          <section className="mt-8 rounded-xl border border-slate-200 bg-white shadow-sm">

            {/* REPORT HEADER */}
            <div className="border-b border-slate-200 px-8 py-6">

              <div className="flex items-start justify-between">

                <div>

                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                    Al-Wafa International
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold text-slate-800">
                    Monthly Expense Report
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {getMonthName()}
                  </p>

                </div>

                <div className="hidden text-right md:block">

                  <p className="text-xs text-slate-400">
                    Currency
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    OMR
                  </p>

                </div>

              </div>

            </div>

            {/* SUMMARY */}
            <div className="grid border-b border-slate-200 md:grid-cols-4">

              <div className="border-b border-slate-200 p-6 md:border-b-0 md:border-r">

                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Transactions
                </p>

                <p className="mt-2 text-2xl font-semibold text-slate-800">
                  {monthlyExpenses.length}
                </p>

              </div>

              <div className="border-b border-slate-200 p-6 md:border-b-0 md:border-r">

                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Total Expenses
                </p>

                <p className="mt-2 text-2xl font-semibold text-slate-800">
                  OMR {totalExpenses.toFixed(3)}
                </p>

              </div>

              <div className="border-b border-slate-200 p-6 md:border-b-0 md:border-r">

                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Total Paid
                </p>

                <p className="mt-2 text-2xl font-semibold text-emerald-600">
                  OMR {totalPaid.toFixed(3)}
                </p>

              </div>

              <div className="p-6">

                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Outstanding
                </p>

                <p className="mt-2 text-2xl font-semibold text-orange-600">
                  OMR {totalBalance.toFixed(3)}
                </p>

              </div>

            </div>

            {/* TABLE */}
            {loading ? (
              <div className="px-8 py-12 text-center text-sm text-slate-500">
                Loading report...
              </div>
            ) : monthlyExpenses.length === 0 ? (

              <div className="px-8 py-12 text-center">

                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-400">
                  —
                </div>

                <p className="mt-4 text-sm font-medium text-slate-700">
                  No expenses recorded
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  There are no expenses for {getMonthName()}.
                </p>

              </div>

            ) : (

              <div className="overflow-x-auto">

                <table className="w-full min-w-[1000px] text-left">

                  <thead className="bg-slate-50">

                    <tr className="border-b border-slate-200">

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Date
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Category
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Company / Product
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Invoice
                      </th>

                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Amount
                      </th>

                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Paid
                      </th>

                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Balance
                      </th>

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-slate-100">

                    {monthlyExpenses.map((expense) => (

                      <tr
                        key={expense.id}
                        className="hover:bg-slate-50"
                      >

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {expense.expense_date}
                        </td>

                        <td className="px-6 py-4">

                          <p className="text-sm font-medium text-slate-700">
                            {expense.main_category}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {expense.subcategory}
                          </p>

                        </td>

                        <td className="px-6 py-4">

                          <p className="text-sm font-medium text-slate-700">
                            {expense.company_name || '—'}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {expense.product_name ||
                              expense.description ||
                              '—'}
                          </p>

                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {expense.invoice_number || '—'}
                        </td>

                        <td className="px-6 py-4 text-right text-sm font-semibold text-slate-700">
                          OMR {Number(expense.amount).toFixed(3)}
                        </td>

                        <td className="px-6 py-4 text-right text-sm font-medium text-emerald-600">
                          OMR {Number(expense.paid_amount || 0).toFixed(3)}
                        </td>

                        <td className="px-6 py-4 text-right text-sm font-medium text-orange-600">
                          OMR {Number(expense.balance_amount || 0).toFixed(3)}
                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            )}

          </section>

        </div>

      </main>

      {/* PRINT STYLES */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          @page {
            margin: 15mm;
          }

          table {
            page-break-inside: auto;
          }

          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      `}</style>

    </div>
  )
}