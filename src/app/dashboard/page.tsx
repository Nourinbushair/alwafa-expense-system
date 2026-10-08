'use client'

import { useEffect, useState } from 'react'
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

export default function DashboardPage() {
  const supabase = createClient()

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

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

  const totalPaid = expenses.reduce(
    (sum, expense) =>
      sum + Number(expense.paid_amount || 0),
    0
  )

  const totalBalance = expenses.reduce(
    (sum, expense) =>
      sum + Number(expense.balance_amount || 0),
    0
  )

  const totalAmount = expenses.reduce(
    (sum, expense) =>
      sum + Number(expense.amount || 0),
    0
  )

  function categoryPaid(category: string) {
    return expenses
      .filter(
        (expense) =>
          expense.main_category === category
      )
      .reduce(
        (sum, expense) =>
          sum + Number(expense.paid_amount || 0),
        0
      )
  }

  function categoryBalance(category: string) {
    return expenses
      .filter(
        (expense) =>
          expense.main_category === category
      )
      .reduce(
        (sum, expense) =>
          sum + Number(expense.balance_amount || 0),
        0
      )
  }

  function formatOMR(value: number) {
    return `OMR ${value.toFixed(3)}`
  }

  function formatDate(date: string) {
    if (!date) return '-'

    return new Date(
      `${date}T00:00:00`
    ).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
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
                Dashboard
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Al-Wafa International
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

          {/* SUMMARY */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <p className="text-sm font-medium text-slate-500">
                Total Expenses
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-800">
                {formatOMR(totalAmount)}
              </p>

            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">

              <p className="text-sm font-medium text-emerald-700">
                Total Paid
              </p>

              <p className="mt-2 text-2xl font-bold text-emerald-700">
                {formatOMR(totalPaid)}
              </p>

            </div>

            <div className="rounded-2xl border border-red-100 bg-red-50 p-5 shadow-sm">

              <p className="text-sm font-medium text-red-700">
                Balance Payable
              </p>

              <p className="mt-2 text-2xl font-bold text-red-700">
                {formatOMR(totalBalance)}
              </p>

            </div>

          </section>

          {/* CATEGORY SUMMARY */}
          <section>

            <div className="mb-4">

              <h2 className="text-lg font-semibold text-slate-800">
                Category Summary
              </h2>

            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

              {categoryList.map((category) => {

                const paid = categoryPaid(category)
                const balance = categoryBalance(category)

                const count = expenses.filter(
                  (expense) =>
                    expense.main_category === category
                ).length

                return (
                  <div
                    key={category}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >

                    <div className="flex items-start justify-between">

                      <div>

                        <h3 className="font-semibold text-slate-800">
                          {category}
                        </h3>

                        <p className="mt-1 text-xs text-slate-400">
                          {count} transaction
                          {count !== 1 ? 's' : ''}
                        </p>

                      </div>

                      <span className="rounded-lg bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                        OMR
                      </span>

                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">

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

          {/* RECENT EXPENSES */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-100 p-5">

              <h2 className="font-semibold text-slate-800">
                Recent Expenses
              </h2>

            </div>

            {loading ? (

              <div className="p-8 text-center text-sm text-slate-500">
                Loading...
              </div>

            ) : expenses.length === 0 ? (

              <div className="p-8 text-center text-sm text-slate-500">
                No expenses recorded yet.
              </div>

            ) : (

              <>

                {/* MOBILE */}
                <div className="divide-y divide-slate-100 md:hidden">

                  {expenses.slice(0, 8).map((expense) => (

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

                          <p className="mt-1 text-xs text-slate-400">
                            {formatDate(
                              expense.expense_date
                            )}
                          </p>

                        </div>

                        <p className="whitespace-nowrap text-sm font-semibold text-slate-800">
                          {formatOMR(
                            Number(expense.amount)
                          )}
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

                  <table className="w-full min-w-[800px] text-left">

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
                          Paid
                        </th>

                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Balance
                        </th>

                      </tr>

                    </thead>

                    <tbody className="divide-y divide-slate-100">

                      {expenses.slice(0, 10).map(
                        (expense) => (

                          <tr
                            key={expense.id}
                            className="hover:bg-slate-50"
                          >

                            <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                              {formatDate(
                                expense.expense_date
                              )}
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

                              <p className="truncate text-sm text-slate-600">
                                {expense.description ||
                                  '-'}
                              </p>

                              {expense.company_name && (
                                <p className="mt-1 text-xs text-slate-400">
                                  {expense.company_name}
                                </p>
                              )}

                            </td>

                            <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-semibold text-emerald-600">
                              {formatOMR(
                                Number(
                                  expense.paid_amount
                                )
                              )}
                            </td>

                            <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-semibold text-red-600">
                              {formatOMR(
                                Number(
                                  expense.balance_amount
                                )
                              )}
                            </td>

                          </tr>

                        )
                      )}

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