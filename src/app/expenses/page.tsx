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

const categories = {
  Company: ['Purchase', 'Payment'],
  Personal: ['Food', 'Shopping', 'Travel', 'Other'],
  'Bills & Utilities': [
    'Electricity',
    'Water',
    'Internet',
    'Phone',
    'Rent',
    'Other',
  ],
  'Salary & Payroll': [
    'Employee Salary',
    'Advance Salary',
    'Bonus',
    'Other',
  ],
  'Transport & Vehicle': [
    'Petrol',
    'Diesel',
    'Taxi',
    'Vehicle Repair',
    'Other',
  ],
  Finance: ['Loan', 'Other Payment'],
}

type CategoryName = keyof typeof categories

export default function ExpensesPage() {
  const supabase = createClient()

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [mainCategory, setMainCategory] =
    useState<CategoryName>('Company')

  const [subcategory, setSubcategory] = useState('Purchase')
  const [date, setDate] = useState('')
  const [amount, setAmount] = useState('')
  const [paidAmount, setPaidAmount] = useState('')
  const [description, setDescription] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [receiptNumber, setReceiptNumber] = useState('')
  const [payeeName, setPayeeName] = useState('')

  const [search, setSearch] = useState('')

  const [paymentExpense, setPaymentExpense] =
    useState<Expense | null>(null)

  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentSaving, setPaymentSaving] = useState(false)

  const [deleteExpense, setDeleteExpense] =
    useState<Expense | null>(null)

  const availableSubcategories =
    categories[mainCategory]

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
        receipt_number,
        payee_name,
        transaction_type
        `
      )
      .eq('transaction_type', 'expense')
      .order('expense_date', { ascending: false })

    if (!error && data) {
      setExpenses(data as Expense[])
    }

    setLoading(false)
  }

  function resetForm() {
    setMainCategory('Company')
    setSubcategory('Purchase')
    setDate(new Date().toISOString().split('T')[0])
    setAmount('')
    setPaidAmount('')
    setDescription('')
    setCompanyName('')
    setReceiptNumber('')
    setPayeeName('')
    setEditingId(null)
  }

  function openAddForm() {
    resetForm()
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    resetForm()
  }

  function startEdit(expense: Expense) {
    setEditingId(expense.id)
    setShowForm(true)

    setMainCategory(
      expense.main_category as CategoryName
    )

    setSubcategory(expense.subcategory)
    setDate(expense.expense_date)
    setAmount(String(expense.amount))
    setPaidAmount(String(expense.paid_amount))
    setDescription(expense.description || '')
    setCompanyName(expense.company_name || '')
    setReceiptNumber(expense.receipt_number || '')
    setPayeeName(expense.payee_name || '')
  }

  async function saveExpense(
    e: React.FormEvent
  ) {
    e.preventDefault()

    setSaving(true)

    const numericAmount = Number(amount || 0)
    const numericPaid = Number(paidAmount || 0)

    if (numericAmount <= 0) {
      alert('Please enter a valid amount.')
      setSaving(false)
      return
    }

    if (numericPaid < 0 || numericPaid > numericAmount) {
      alert(
        'Paid amount cannot be greater than the total amount.'
      )
      setSaving(false)
      return
    }

    if (
      mainCategory === 'Company' &&
      subcategory === 'Payment'
    ) {
      alert(
        'Use the Pay Balance button for Company Payments.'
      )
      setSaving(false)
      return
    }

    if (
      mainCategory === 'Company' &&
      subcategory === 'Purchase' &&
      !receiptNumber.trim()
    ) {
      alert('Receipt number is required for Company Purchase.')
      setSaving(false)
      return
    }

    const payload = {
      expense_date: date,
      main_category: mainCategory,
      subcategory,
      description: description || null,
      amount: numericAmount,
      paid_amount: numericPaid,
      company_name:
        mainCategory === 'Company'
          ? companyName || null
          : null,
      receipt_number:
        mainCategory === 'Company' &&
        subcategory === 'Purchase'
          ? receiptNumber || null
          : null,
      payee_name:
        mainCategory === 'Finance' &&
        subcategory === 'Other Payment'
          ? payeeName || null
          : null,
      transaction_type: 'expense',
    }

    let error

    if (editingId) {
      const result = await supabase
        .from('expenses')
        .update(payload)
        .eq('id', editingId)

      error = result.error
    } else {
      const result = await supabase
        .from('expenses')
        .insert(payload)

      error = result.error
    }

    if (error) {
      alert(error.message)
      setSaving(false)
      return
    }

    await loadExpenses()

    closeForm()
    setSaving(false)
  }

  async function confirmDelete() {
    if (!deleteExpense) return

    const expense = deleteExpense

    if (
      expense.main_category === 'Company' &&
      expense.subcategory === 'Purchase' &&
      Number(expense.paid_amount) > 0
    ) {
      alert(
        'This purchase already has a payment. Please do not delete it until the payment is reviewed.'
      )
      setDeleteExpense(null)
      return
    }

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expense.id)

    if (error) {
      alert(error.message)
      return
    }

    setDeleteExpense(null)
    await loadExpenses()
  }

  async function savePayment() {
    if (!paymentExpense) return

    const payment = Number(paymentAmount || 0)
    const currentBalance = Number(
      paymentExpense.balance_amount || 0
    )

    if (payment <= 0) {
      alert('Enter a valid payment amount.')
      return
    }

    if (payment > currentBalance) {
      alert(
        `Payment cannot be greater than the balance of ${formatOMR(
          currentBalance
        )}.`
      )
      return
    }

    setPaymentSaving(true)

    const newPaid =
      Number(paymentExpense.paid_amount || 0) + payment

    const { error } = await supabase
      .from('expenses')
      .update({
        paid_amount: newPaid,
      })
      .eq('id', paymentExpense.id)

    if (error) {
      alert(error.message)
      setPaymentSaving(false)
      return
    }

    setPaymentExpense(null)
    setPaymentAmount('')
    setPaymentSaving(false)

    await loadExpenses()
  }

  function formatOMR(value: number) {
    return `OMR ${value.toFixed(3)}`
  }

  function formatDate(value: string) {
    if (!value) return '-'

    return new Date(
      `${value}T00:00:00`
    ).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const filteredExpenses = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    if (!keyword) return expenses

    return expenses.filter((expense) => {
      return (
        expense.main_category
          .toLowerCase()
          .includes(keyword) ||
        expense.subcategory
          .toLowerCase()
          .includes(keyword) ||
        (expense.description || '')
          .toLowerCase()
          .includes(keyword) ||
        (expense.company_name || '')
          .toLowerCase()
          .includes(keyword) ||
        (expense.receipt_number || '')
          .toLowerCase()
          .includes(keyword) ||
        (expense.payee_name || '')
          .toLowerCase()
          .includes(keyword)
      )
    })
  }, [expenses, search])

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50">
      <Sidebar />

      <main className="min-h-screen md:ml-64">

        {/* HEADER */}
        <header className="border-b border-slate-200 bg-white px-4 pb-5 pt-20 sm:px-6 md:px-8 md:py-6 md:pt-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

            <div>
              <h1 className="text-xl font-semibold text-slate-800 sm:text-2xl">
                Expenses
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage company expenses and payments
              </p>
            </div>

            <button
              onClick={openAddForm}
              className="w-fit rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              + Add Expense
            </button>

          </div>
        </header>

        <div className="p-4 sm:p-6 md:p-8">

          {/* SEARCH */}
          <div className="mb-5 flex flex-col gap-3 sm:flex-row">

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search expenses..."
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:max-w-md"
            />

            <button
              onClick={loadExpenses}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Refresh
            </button>

          </div>

          {/* EXPENSE TABLE */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

            {loading ? (
              <div className="p-10 text-center text-sm text-slate-500">
                Loading expenses...
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-sm font-medium text-slate-600">
                  No expenses found.
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Add an expense to get started.
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
                          <p className="font-semibold text-slate-800">
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
                            {formatDate(expense.expense_date)}
                          </p>
                        </div>

                        <p className="whitespace-nowrap text-sm font-bold text-slate-800">
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

                      <div className="mt-3 flex flex-wrap gap-2">

                        <button
                          onClick={() =>
                            startEdit(expense)
                          }
                          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                        >
                          Edit
                        </button>

                        {Number(expense.balance_amount) > 0 && (
                          <button
                            onClick={() => {
                              setPaymentExpense(expense)
                              setPaymentAmount('')
                            }}
                            className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700"
                          >
                            Pay Balance
                          </button>
                        )}

                        <button
                          onClick={() =>
                            setDeleteExpense(expense)
                          }
                          className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>

                      </div>

                    </div>
                  ))}

                </div>

                {/* DESKTOP */}
                <div className="hidden overflow-x-auto md:block">

                  <table className="w-full min-w-[1000px] text-left">

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

                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Actions
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

                          <td className="max-w-[260px] px-5 py-4">

                            {expense.company_name && (
                              <p className="text-sm text-slate-600">
                                {expense.company_name}
                              </p>
                            )}

                            {expense.payee_name && (
                              <p className="text-sm text-slate-600">
                                {expense.payee_name}
                              </p>
                            )}

                            {expense.receipt_number && (
                              <p className="mt-1 text-xs text-slate-400">
                                Receipt: {expense.receipt_number}
                              </p>
                            )}

                            <p className="mt-1 truncate text-xs text-slate-400">
                              {expense.description || '-'}
                            </p>

                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-semibold text-slate-800">
                            {formatOMR(
                              Number(expense.amount)
                            )}
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

                          <td className="px-5 py-4">

                            <div className="flex justify-end gap-2">

                              <button
                                onClick={() =>
                                  startEdit(expense)
                                }
                                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                              >
                                Edit
                              </button>

                              {Number(
                                expense.balance_amount
                              ) > 0 && (
                                <button
                                  onClick={() => {
                                    setPaymentExpense(expense)
                                    setPaymentAmount('')
                                  }}
                                  className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700"
                                >
                                  Pay Balance
                                </button>
                              )}

                              <button
                                onClick={() =>
                                  setDeleteExpense(expense)
                                }
                                className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                              >
                                Delete
                              </button>

                            </div>

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

      {/* ADD / EDIT MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">

          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">

            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">

              <div>
                <h2 className="font-semibold text-slate-800">
                  {editingId
                    ? 'Edit Expense'
                    : 'Add Expense'}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Enter the transaction details.
                </p>
              </div>

              <button
                onClick={closeForm}
                className="rounded-lg px-3 py-2 text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>

            </div>

            <form
              onSubmit={saveExpense}
              className="space-y-5 p-5"
            >

              {/* CATEGORY */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Main Category
                  </label>

                  <select
                    value={mainCategory}
                    onChange={(e) => {
                      const value =
                        e.target.value as CategoryName

                      setMainCategory(value)
                      setSubcategory(
                        categories[value][0]
                      )
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  >
                    {Object.keys(categories).map(
                      (category) => (
                        <option
                          key={category}
                          value={category}
                        >
                          {category}
                        </option>
                      )
                    )}
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
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  >
                    {availableSubcategories.map(
                      (item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      )
                    )}
                  </select>
                </div>

              </div>

              {/* COMPANY PURCHASE */}
              {mainCategory === 'Company' &&
                subcategory === 'Purchase' && (
                  <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Receipt No.
                        </label>

                        <input
                          value={receiptNumber}
                          onChange={(e) =>
                            setReceiptNumber(
                              e.target.value
                            )
                          }
                          placeholder="INV-105"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Company Name
                        </label>

                        <input
                          value={companyName}
                          onChange={(e) =>
                            setCompanyName(
                              e.target.value
                            )
                          }
                          placeholder="ABC Trading"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                        />
                      </div>

                    </div>
                  </>
                )}

              {/* FINANCE PAYEE */}
              {mainCategory === 'Finance' &&
                subcategory === 'Other Payment' && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Person / Payee Name
                    </label>

                    <input
                      value={payeeName}
                      onChange={(e) =>
                        setPayeeName(e.target.value)
                      }
                      placeholder="Person name"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                )}

              {/* DATE + AMOUNT */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Date
                  </label>

                  <input
                    type="date"
                    value={date}
                    onChange={(e) =>
                      setDate(e.target.value)
                    }
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Amount
                  </label>

                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={amount}
                    onChange={(e) =>
                      setAmount(e.target.value)
                    }
                    required
                    placeholder="0.000"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Paid
                  </label>

                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={paidAmount}
                    onChange={(e) =>
                      setPaidAmount(e.target.value)
                    }
                    placeholder="0.000"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>

              </div>

              {/* BALANCE PREVIEW */}
              {amount && (
                <div className="rounded-lg bg-slate-50 p-4">

                  <div className="flex justify-between text-sm">

                    <span className="text-slate-500">
                      Balance
                    </span>

                    <span className="font-semibold text-red-600">
                      {formatOMR(
                        Math.max(
                          Number(amount || 0) -
                            Number(paidAmount || 0),
                          0
                        )
                      )}
                    </span>

                  </div>

                </div>
              )}

              {/* DESCRIPTION */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  rows={3}
                  placeholder="Enter description"
                  className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              {/* ACTIONS */}
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">

                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving
                    ? 'Saving...'
                    : editingId
                      ? 'Update Expense'
                      : 'Save Expense'}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

      {/* PAY BALANCE MODAL */}
      {paymentExpense && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">

          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">

            <div className="border-b border-slate-200 px-5 py-4">

              <h2 className="font-semibold text-slate-800">
                Pay Balance
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Record a payment against this expense.
              </p>

            </div>

            <div className="space-y-4 p-5">

              {paymentExpense.company_name && (
                <div>
                  <p className="text-xs text-slate-400">
                    Company
                  </p>

                  <p className="font-medium text-slate-800">
                    {paymentExpense.company_name}
                  </p>
                </div>
              )}

              {paymentExpense.receipt_number && (
                <div>
                  <p className="text-xs text-slate-400">
                    Receipt No.
                  </p>

                  <p className="font-medium text-slate-800">
                    {paymentExpense.receipt_number}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">

                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">
                    Original Amount
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {formatOMR(
                      Number(paymentExpense.amount)
                    )}
                  </p>
                </div>

                <div className="rounded-lg bg-red-50 p-3">
                  <p className="text-xs text-red-600">
                    Current Balance
                  </p>

                  <p className="mt-1 text-sm font-semibold text-red-700">
                    {formatOMR(
                      Number(
                        paymentExpense.balance_amount
                      )
                    )}
                  </p>
                </div>

              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Payment Amount
                </label>

                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  max={Number(
                    paymentExpense.balance_amount
                  )}
                  value={paymentAmount}
                  onChange={(e) =>
                    setPaymentAmount(e.target.value)
                  }
                  placeholder="0.000"
                  className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">

                <button
                  onClick={() => {
                    setPaymentExpense(null)
                    setPaymentAmount('')
                  }}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  onClick={savePayment}
                  disabled={paymentSaving}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {paymentSaving
                    ? 'Saving...'
                    : 'Save Payment'}
                </button>

              </div>

            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {deleteExpense && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4">

          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">

            <h2 className="font-semibold text-slate-800">
              Delete Expense?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              This action cannot be undone. Are you sure you
              want to delete this expense?
            </p>

            <div className="mt-5 flex justify-end gap-3">

              <button
                onClick={() => setDeleteExpense(null)}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                onClick={confirmDelete}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
              >
                Delete
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  )
}