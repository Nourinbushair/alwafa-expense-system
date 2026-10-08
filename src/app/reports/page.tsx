'use client'

import { useEffect, useMemo, useState } from 'react'
import Sidebar from '../../components/Sidebar'
import { createClient } from '../../lib/supabase/client'

type Expense = {
  id: string
  expense_date: string
  main_category: string
  subcategory: string
  description: string | null
  amount: number
  paid_amount: number
  balance_amount: number
  company_name: string | null
  receipt_number: string | null
}

const categoryList = [
  'Company',
  'Personal',
  'Bills & Utilities',
  'Salary & Payroll',
  'Transport & Vehicle',
  'Finance',
]

export default function ReportsPage() {
  const supabase = createClient()

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [category, setCategory] = useState('All')
  const [subcategory, setSubcategory] = useState('All')

  useEffect(() => {
    loadExpenses()
  }, [])

  async function loadExpenses() {
    setLoading(true)

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
        paid_amount,
        balance_amount,
        company_name,
        receipt_number
        `
      )
      .eq('transaction_type', 'expense')
      .order('expense_date', { ascending: false })

    if (!error && data) {
      setExpenses(data as Expense[])
    }

    setLoading(false)
  }

  const subcategoryList = useMemo(() => {
    if (category === 'All') return []

    return Array.from(
      new Set(
        expenses
          .filter((expense) => expense.main_category === category)
          .map((expense) => expense.subcategory)
      )
    ).sort()
  }, [expenses, category])

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const matchesFromDate =
        !fromDate || expense.expense_date >= fromDate

      const matchesToDate =
        !toDate || expense.expense_date <= toDate

      const matchesCategory =
        category === 'All' ||
        expense.main_category === category

      const matchesSubcategory =
        subcategory === 'All' ||
        expense.subcategory === subcategory

      return (
        matchesFromDate &&
        matchesToDate &&
        matchesCategory &&
        matchesSubcategory
      )
    })
  }, [expenses, fromDate, toDate, category, subcategory])

  const totalAmount = filteredExpenses.reduce(
    (sum, expense) => sum + Number(expense.amount || 0),
    0
  )

  const totalPaid = filteredExpenses.reduce(
    (sum, expense) => sum + Number(expense.paid_amount || 0),
    0
  )

  const totalBalance = filteredExpenses.reduce(
    (sum, expense) => sum + Number(expense.balance_amount || 0),
    0
  )

  function formatOMR(value: number) {
    return `OMR ${value.toFixed(3)}`
  }

  function formatDate(date: string) {
    if (!date) return '-'

    return new Date(`${date}T00:00:00`).toLocaleDateString(
      'en-GB',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    )
  }

  function categoryPaid(mainCategory: string) {
    return filteredExpenses
      .filter(
        (expense) => expense.main_category === mainCategory
      )
      .reduce(
        (sum, expense) =>
          sum + Number(expense.paid_amount || 0),
        0
      )
  }

  function categoryBalance(mainCategory: string) {
    return filteredExpenses
      .filter(
        (expense) => expense.main_category === mainCategory
      )
      .reduce(
        (sum, expense) =>
          sum + Number(expense.balance_amount || 0),
        0
      )
  }

  function clearFilters() {
    setFromDate('')
    setToDate('')
    setCategory('All')
    setSubcategory('All')
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50">
      <Sidebar />

      <main className="min-h-screen md:ml-64">

        {/* HEADER */}
        <header className="border-b border-slate-200 bg-white px-4 pb-5 pt-20 sm:px-6 md:px-8 md:py-6 md:pt-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-xl font-semibold text-slate-800 sm:text-2xl">
                Reports
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Expense reports and financial overview
              </p>
            </div>

            <button
              onClick={loadExpenses}
              className="w-fit rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>
        </header>

        <div className="space-y-6 p-4 sm:p-6 md:p-8">

          {/* FILTERS */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="font-semibold text-slate-800">
                Report Filters
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Filter transactions to generate a specific report.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  From Date
                </label>

                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  To Date
                </label>

                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Main Category
                </label>

                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value)
                    setSubcategory('All')
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="All">All Categories</option>

                  {categoryList.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Subcategory
                </label>

                <select
                  value={subcategory}
                  onChange={(e) =>
                    setSubcategory(e.target.value)
                  }
                  disabled={category === 'All'}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none disabled:bg-slate-100 disabled:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="All">
                    All Subcategories
                  </option>

                  {subcategoryList.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={clearFilters}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Clear Filters
              </button>
            </div>
          </section>

          {/* SUMMARY */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Total Expenses
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-800">
                {formatOMR(totalAmount)}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                Total transaction value
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
              <p className="text-sm font-medium text-emerald-700">
                Total Paid
              </p>

              <p className="mt-2 text-2xl font-bold text-emerald-700">
                {formatOMR(totalPaid)}
              </p>

              <p className="mt-2 text-xs text-emerald-600">
                Actual amount paid
              </p>
            </div>

            <div className="rounded-2xl border border-red-100 bg-red-50 p-5 shadow-sm">
              <p className="text-sm font-medium text-red-700">
                Total Balance
              </p>

              <p className="mt-2 text-2xl font-bold text-red-700">
                {formatOMR(totalBalance)}
              </p>

              <p className="mt-2 text-xs text-red-600">
                Amount still payable
              </p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
              <p className="text-sm font-medium text-blue-700">
                Transactions
              </p>

              <p className="mt-2 text-2xl font-bold text-blue-700">
                {filteredExpenses.length}
              </p>

              <p className="mt-2 text-xs text-blue-600">
                Filtered transactions
              </p>
            </div>

          </section>

          {/* CATEGORY REPORT */}
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-800">
                Category Report
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Paid and outstanding amounts by category
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

              {categoryList.map((item) => {

                const paid = categoryPaid(item)
                const balance = categoryBalance(item)

                const count = filteredExpenses.filter(
                  (expense) =>
                    expense.main_category === item
                ).length

                return (
                  <div
                    key={item}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-800">
                          {item}
                        </h3>

                        <p className="mt-1 text-xs text-slate-400">
                          {count} transaction(s)
                        </p>
                      </div>

                      <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                        OMR
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">

                      <div className="rounded-lg bg-emerald-50 p-3">
                        <p className="text-xs text-emerald-600">
                          Paid
                        </p>

                        <p className="mt-1 text-sm font-bold text-emerald-700">
                          {formatOMR(paid)}
                        </p>
                      </div>

                      <div className="rounded-lg bg-red-50 p-3">
                        <p className="text-xs text-red-600">
                          Balance
                        </p>

                        <p className="mt-1 text-sm font-bold text-red-700">
                          {formatOMR(balance)}
                        </p>
                      </div>

                    </div>
                  </div>
                )
              })}

            </div>
          </section>

          {/* TRANSACTION REPORT */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-100 p-5 sm:p-6">
              <h2 className="font-semibold text-slate-800">
                Transaction Report
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Detailed list of filtered expenses
              </p>
            </div>

            {loading ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Loading report...
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm font-medium text-slate-600">
                  No transactions found.
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Try changing your filters.
                </p>
              </div>
            ) : (
              <>
                {/* MOBILE */}
                <div className="divide-y divide-slate-100 md:hidden">

                  {filteredExpenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="p-4"
                    >
                      <div className="flex items-start justify-between gap-3">

                        <div>
                          <p className="font-medium text-slate-800">
                            {expense.subcategory}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {expense.main_category}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {formatDate(expense.expense_date)}
                          </p>

                          {expense.company_name && (
                            <p className="mt-1 text-xs text-slate-400">
                              {expense.company_name}
                            </p>
                          )}

                          {expense.receipt_number && (
                            <p className="mt-1 text-xs text-slate-400">
                              Receipt: {expense.receipt_number}
                            </p>
                          )}
                        </div>

                        <p className="whitespace-nowrap text-sm font-semibold text-slate-800">
                          {formatOMR(Number(expense.amount))}
                        </p>

                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">

                        <div className="rounded-lg bg-emerald-50 p-2">
                          <p className="text-[11px] text-emerald-600">
                            Paid
                          </p>

                          <p className="text-xs font-semibold text-emerald-700">
                            {formatOMR(
                              Number(expense.paid_amount)
                            )}
                          </p>
                        </div>

                        <div className="rounded-lg bg-red-50 p-2">
                          <p className="text-[11px] text-red-600">
                            Balance
                          </p>

                          <p className="text-xs font-semibold text-red-700">
                            {formatOMR(
                              Number(expense.balance_amount)
                            )}
                          </p>
                        </div>

                      </div>
                    </div>
                  ))}

                </div>

                {/* DESKTOP */}
                <div className="hidden overflow-x-auto md:block">

                  <table className="w-full min-w-[950px] text-left">

                    <thead className="border-b border-slate-100 bg-slate-50">
                      <tr>

                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Date
                        </th>

                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Category
                        </th>

                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Description
                        </th>

                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Amount
                        </th>

                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Paid
                        </th>

                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Balance
                        </th>

                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">

                      {filteredExpenses.map((expense) => (
                        <tr
                          key={expense.id}
                          className="hover:bg-slate-50"
                        >

                          <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                            {formatDate(expense.expense_date)}
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-medium text-slate-800">
                              {expense.subcategory}
                            </p>

                            <p className="text-xs text-slate-400">
                              {expense.main_category}
                            </p>

                            {expense.receipt_number && (
                              <p className="mt-1 text-xs text-slate-400">
                                {expense.receipt_number}
                              </p>
                            )}
                          </td>

                          <td className="max-w-[300px] px-5 py-4">
                            <p className="truncate text-sm text-slate-600">
                              {expense.description || '-'}
                            </p>

                            {expense.company_name && (
                              <p className="mt-1 text-xs text-slate-400">
                                {expense.company_name}
                              </p>
                            )}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-medium text-slate-800">
                            {formatOMR(Number(expense.amount))}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-medium text-emerald-600">
                            {formatOMR(
                              Number(expense.paid_amount)
                            )}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-medium text-red-600">
                            {formatOMR(
                              Number(expense.balance_amount)
                            )}
                          </td>

                        </tr>
                      ))}

                    </tbody>
                  </table>

                </div>
              </>
            )}

          </section>

        </div>
      </main>
    </div>
  )
}