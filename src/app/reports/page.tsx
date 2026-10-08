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
  payee_name: string | null
  transaction_type: string
}

const categories = [
  'All',
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
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  useEffect(() => {
    loadExpenses()
  }, [])

  async function loadExpenses() {
    setLoading(true)

    const { data, error } = await supabase
      .from('expenses')
      .select(`
        id,
        expense_date,
        main_category,
        subcategory,
        description,
        amount,
        paid_amount,
        balance_amount,
        company_name,
        receipt_number,
        payee_name,
        transaction_type
      `)
      .eq('transaction_type', 'expense')
      .order('expense_date', { ascending: false })

    if (!error && data) {
      setExpenses(data as Expense[])
    }

    setLoading(false)
  }

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const categoryMatch =
        selectedCategory === 'All' ||
        expense.main_category === selectedCategory

      const fromMatch =
        !fromDate || expense.expense_date >= fromDate

      const toMatch =
        !toDate || expense.expense_date <= toDate

      return categoryMatch && fromMatch && toMatch
    })
  }, [expenses, selectedCategory, fromDate, toDate])

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

    return new Date(`${date}T00:00:00`).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  function clearFilters() {
    setSelectedCategory('All')
    setFromDate('')
    setToDate('')
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50">
      <Sidebar />

      <main className="min-h-screen md:ml-64">
        <header className="border-b border-slate-200 bg-white px-4 pb-5 pt-20 sm:px-6 md:px-8 md:py-6 md:pt-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-xl font-semibold text-slate-800 sm:text-2xl">
                Reports
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Expense summary and financial overview
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

          {/* Filters */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="font-semibold text-slate-800">
                Report Filters
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Filter expenses by category or date
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Category
                </label>

                <select
                  value={selectedCategory}
                  onChange={(e) =>
                    setSelectedCategory(e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

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

              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </section>

          {/* Summary */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Total Amount
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-800">
                {formatOMR(totalAmount)}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {filteredExpenses.length} transaction
                {filteredExpenses.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
              <p className="text-sm font-medium text-emerald-700">
                Total Paid
              </p>

              <p className="mt-2 text-2xl font-bold text-emerald-700">
                {formatOMR(totalPaid)}
              </p>

              <p className="mt-1 text-xs text-emerald-600">
                Amount already paid
              </p>
            </div>

            <div className="rounded-2xl border border-red-100 bg-red-50 p-5 shadow-sm">
              <p className="text-sm font-medium text-red-700">
                Balance Payable
              </p>

              <p className="mt-2 text-2xl font-bold text-red-700">
                {formatOMR(totalBalance)}
              </p>

              <p className="mt-1 text-xs text-red-600">
                Outstanding amount
              </p>
            </div>
          </section>

          {/* Report Table */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <h2 className="font-semibold text-slate-800">
                    Expense Report
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Detailed transaction report
                  </p>
                </div>

                <span className="w-fit rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
                  {filteredExpenses.length} Records
                </span>
              </div>
            </div>

            {loading ? (
              <div className="p-10 text-center text-sm text-slate-500">
                Loading report...
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-500">
                No expenses found for the selected filters.
              </div>
            ) : (
              <>
                {/* Mobile */}
                <div className="divide-y divide-slate-100 md:hidden">
                  {filteredExpenses.map((expense) => (
                    <div key={expense.id} className="p-4">
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

                          {expense.payee_name && (
                            <p className="mt-1 text-xs text-slate-400">
                              Payee: {expense.payee_name}
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

                {/* Desktop */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[900px] text-left">
                    <thead className="border-b border-slate-100 bg-slate-50">
                      <tr>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Date
                        </th>

                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Category
                        </th>

                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Details
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
                          </td>

                          <td className="max-w-[300px] px-5 py-4">
                            {expense.company_name && (
                              <p className="text-sm text-slate-700">
                                {expense.company_name}
                              </p>
                            )}

                            {expense.receipt_number && (
                              <p className="mt-1 text-xs text-slate-400">
                                Receipt: {expense.receipt_number}
                              </p>
                            )}

                            {expense.payee_name && (
                              <p className="mt-1 text-xs text-slate-400">
                                Payee: {expense.payee_name}
                              </p>
                            )}

                            <p className="mt-1 truncate text-xs text-slate-500">
                              {expense.description || '-'}
                            </p>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-semibold text-slate-800">
                            {formatOMR(Number(expense.amount))}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-semibold text-emerald-600">
                            {formatOMR(
                              Number(expense.paid_amount)
                            )}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-semibold text-red-600">
                            {formatOMR(
                              Number(expense.balance_amount)
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>

                    <tfoot className="border-t-2 border-slate-200 bg-slate-50">
                      <tr>
                        <td
                          colSpan={3}
                          className="px-5 py-4 text-sm font-semibold text-slate-700"
                        >
                          Total
                        </td>

                        <td className="px-5 py-4 text-right text-sm font-bold text-slate-800">
                          {formatOMR(totalAmount)}
                        </td>

                        <td className="px-5 py-4 text-right text-sm font-bold text-emerald-700">
                          {formatOMR(totalPaid)}
                        </td>

                        <td className="px-5 py-4 text-right text-sm font-bold text-red-700">
                          {formatOMR(totalBalance)}
                        </td>
                      </tr>
                    </tfoot>
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