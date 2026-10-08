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

type FormState = {
  expense_date: string
  main_category: string
  subcategory: string
  description: string
  amount: string
  paid_amount: string
  company_name: string
  receipt_number: string
  payee_name: string
}

const categories: Record<string, string[]> = {
  Company: ['Purchase', 'Payment'],

  Personal: [
    'Food',
    'Shopping',
    'Travel',
    'Other',
  ],

  'Bills & Utilities': [
    'Electricity',
    'Water',
    'Internet',
    'Phone',
    'Rent',
    'Other',
  ],

  Finance: [
    'Loan',
    'Other Payment',
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
}

const emptyForm: FormState = {
  expense_date: new Date().toISOString().split('T')[0],
  main_category: 'Personal',
  subcategory: 'Food',
  description: '',
  amount: '',
  paid_amount: '0',
  company_name: '',
  receipt_number: '',
  payee_name: '',
}

export default function ExpensesPage() {
  const supabase = createClient()

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [search, setSearch] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editingExpense, setEditingExpense] =
    useState<Expense | null>(null)

  const [form, setForm] = useState<FormState>(emptyForm)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [deleteExpense, setDeleteExpense] =
    useState<Expense | null>(null)

  const [paymentExpense, setPaymentExpense] =
    useState<Expense | null>(null)

  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentSaving, setPaymentSaving] = useState(false)

  useEffect(() => {
    loadExpenses()
  }, [])

  async function loadExpenses() {
    setLoading(true)
    setError('')

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
      .order('expense_date', {
        ascending: false,
      })
      .order('created_at', {
        ascending: false,
      })

    if (error) {
      setError(error.message)
    } else {
      setExpenses((data || []) as Expense[])
    }

    setLoading(false)
  }

  function updateForm(
    field: keyof FormState,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  function openAddModal() {
    setEditingExpense(null)
    setForm(emptyForm)
    setError('')
    setSuccess('')
    setShowModal(true)
  }

  function startEdit(expense: Expense) {
    if (
      expense.main_category === 'Company' &&
      expense.subcategory === 'Payment'
    ) {
      return
    }

    setEditingExpense(expense)

    setForm({
      expense_date: expense.expense_date,
      main_category: expense.main_category,
      subcategory: expense.subcategory,
      description: expense.description || '',
      amount: String(expense.amount),
      paid_amount: String(expense.paid_amount),
      company_name: expense.company_name || '',
      receipt_number: expense.receipt_number || '',
      payee_name: expense.payee_name || '',
    })

    setError('')
    setSuccess('')
    setShowModal(true)
  }

  function closeModal() {
    if (saving) return

    setShowModal(false)
    setEditingExpense(null)
    setForm(emptyForm)
    setError('')
  }

  function handleCategoryChange(value: string) {
    setForm((previous) => ({
      ...previous,
      main_category: value,
      subcategory: categories[value][0],
    }))
  }

  const calculatedBalance =
    Math.max(
      Number(form.amount || 0) -
        Number(form.paid_amount || 0),
      0
    )

  async function saveExpense(
    event: React.FormEvent
  ) {
    event.preventDefault()

    setError('')
    setSuccess('')

    const amount = Number(form.amount)
    const paidAmount = Number(form.paid_amount || 0)

    if (!form.expense_date) {
      setError('Please select a date.')
      return
    }

    if (!form.main_category) {
      setError('Please select a category.')
      return
    }

    if (!form.subcategory) {
      setError('Please select a subcategory.')
      return
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Please enter a valid amount.')
      return
    }

    if (!Number.isFinite(paidAmount) || paidAmount < 0) {
      setError('Please enter a valid paid amount.')
      return
    }

    if (paidAmount > amount) {
      setError(
        'Paid amount cannot be greater than the total amount.'
      )
      return
    }

    if (
      form.main_category === 'Company' &&
      form.subcategory === 'Payment'
    ) {
      setError(
        'Company Payment should be made using Pay Balance on an existing purchase.'
      )
      return
    }

    if (
      form.main_category === 'Company' &&
      form.subcategory === 'Purchase' &&
      !form.receipt_number.trim()
    ) {
      setError(
        'Receipt No. is required for Company Purchase.'
      )
      return
    }

    if (
      form.main_category === 'Company' &&
      form.subcategory === 'Purchase' &&
      !form.company_name.trim()
    ) {
      setError(
        'Company Name is required for Company Purchase.'
      )
      return
    }

    if (
      form.main_category === 'Finance' &&
      form.subcategory === 'Other Payment' &&
      !form.payee_name.trim()
    ) {
      setError(
        'Person Name / Payee is required.'
      )
      return
    }

    setSaving(true)

    try {
      /*
       * IMPORTANT:
       * Get the currently logged-in Supabase user.
       * created_by is required by the RLS INSERT policy.
       */
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        throw new Error(userError.message)
      }

      if (!user) {
        throw new Error(
          'Your session has expired. Please sign in again.'
        )
      }

      const expenseData = {
        expense_date: form.expense_date,
        main_category: form.main_category,
        subcategory: form.subcategory,
        description:
          form.description.trim() || null,
        amount,
        paid_amount: paidAmount,
        company_name:
          form.company_name.trim() || null,
        receipt_number:
          form.receipt_number.trim() || null,
        payee_name:
          form.payee_name.trim() || null,
        transaction_type: 'expense',
      }

      if (editingExpense) {
        const { error: updateError } = await supabase
          .from('expenses')
          .update(expenseData)
          .eq('id', editingExpense.id)
          .eq('created_by', user.id)

        if (updateError) {
          throw new Error(updateError.message)
        }

        setSuccess('Expense updated successfully.')
      } else {
        /*
         * THIS IS THE RLS FIX:
         * created_by must equal auth.uid().
         */
        const { error: insertError } = await supabase
          .from('expenses')
          .insert({
            ...expenseData,
            created_by: user.id,
          })

        if (insertError) {
          throw new Error(insertError.message)
        }

        setSuccess('Expense added successfully.')
      }

      setShowModal(false)
      setEditingExpense(null)
      setForm(emptyForm)

      await loadExpenses()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!deleteExpense) return

    setError('')
    setSuccess('')

    if (Number(deleteExpense.paid_amount) > 0) {
      setError(
        'This expense cannot be deleted because payment has already been made.'
      )
      setDeleteExpense(null)
      return
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError(
          'Your session has expired. Please sign in again.'
        )
        return
      }

      const { error: deleteError } = await supabase
        .from('expenses')
        .delete()
        .eq('id', deleteExpense.id)
        .eq('created_by', user.id)

      if (deleteError) {
        setError(deleteError.message)
        return
      }

      setSuccess('Expense deleted successfully.')
      setDeleteExpense(null)

      await loadExpenses()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to delete expense.'
      )
    }
  }

  function openPayment(expense: Expense) {
    if (Number(expense.balance_amount) <= 0) {
      return
    }

    setPaymentExpense(expense)
    setPaymentAmount('')
    setError('')
    setSuccess('')
  }

  async function savePayment() {
    if (!paymentExpense) return

    const amount = Number(paymentAmount)

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a valid payment amount.')
      return
    }

    const currentPaid =
      Number(paymentExpense.paid_amount || 0)

    const currentBalance =
      Number(paymentExpense.balance_amount || 0)

    if (amount > currentBalance) {
      setError(
        `Payment cannot be greater than the current balance of ${formatOMR(
          currentBalance
        )}.`
      )
      return
    }

    setPaymentSaving(true)
    setError('')
    setSuccess('')

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error(
          'Your session has expired. Please sign in again.'
        )
      }

      const newPaidAmount =
        currentPaid + amount

      const { error: updateError } = await supabase
        .from('expenses')
        .update({
          paid_amount: newPaidAmount,
        })
        .eq('id', paymentExpense.id)
        .eq('created_by', user.id)

      if (updateError) {
        throw new Error(updateError.message)
      }

      setPaymentExpense(null)
      setPaymentAmount('')

      setSuccess(
        `Payment of ${formatOMR(
          amount
        )} recorded successfully.`
      )

      await loadExpenses()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to save payment.'
      )
    } finally {
      setPaymentSaving(false)
    }
  }

  const filteredExpenses = useMemo(() => {
    const value = search.trim().toLowerCase()

    if (!value) {
      return expenses
    }

    return expenses.filter((expense) => {
      return (
        expense.main_category
          .toLowerCase()
          .includes(value) ||
        expense.subcategory
          .toLowerCase()
          .includes(value) ||
        (expense.description || '')
          .toLowerCase()
          .includes(value) ||
        (expense.company_name || '')
          .toLowerCase()
          .includes(value) ||
        (expense.receipt_number || '')
          .toLowerCase()
          .includes(value) ||
        (expense.payee_name || '')
          .toLowerCase()
          .includes(value)
      )
    })
  }, [expenses, search])

  function formatOMR(value: number) {
    return `OMR ${Number(value || 0).toFixed(3)}`
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

        {/* Header */}
        <header className="border-b border-slate-200 bg-white px-4 pb-5 pt-20 sm:px-6 md:px-8 md:py-6 md:pt-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-xl font-semibold text-slate-800 sm:text-2xl">
                Expenses
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage Al-Wafa International expenses
              </p>
            </div>

            <button
              onClick={openAddModal}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 sm:w-auto"
            >
              + Add Expense
            </button>
          </div>
        </header>

        <div className="space-y-6 p-4 sm:p-6 md:p-8">

          {/* Messages */}
          {error && (
            <div className="flex items-start justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <span>{error}</span>

              <button
                onClick={() => setError('')}
                className="font-semibold text-red-500"
              >
                ×
              </button>
            </div>
          )}

          {success && (
            <div className="flex items-start justify-between gap-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <span>{success}</span>

              <button
                onClick={() => setSuccess('')}
                className="font-semibold text-emerald-500"
              >
                ×
              </button>
            </div>
          )}

          {/* Search / Refresh */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search expenses..."
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <button
                onClick={loadExpenses}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Refresh
              </button>
            </div>
          </section>

          {/* Expense list */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="font-semibold text-slate-800">
                  Expense Records
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  {filteredExpenses.length} record
                  {filteredExpenses.length !== 1
                    ? 's'
                    : ''}
                </p>
              </div>
            </div>

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
                  Add your first expense to get started.
                </p>
              </div>
            ) : (
              <>
                {/* Mobile */}
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

                          <p className="mt-1 text-xs text-slate-400">
                            {formatDate(
                              expense.expense_date
                            )}
                          </p>

                          {expense.company_name && (
                            <p className="mt-1 text-xs text-slate-400">
                              {expense.company_name}
                            </p>
                          )}

                          {expense.receipt_number && (
                            <p className="mt-1 text-xs text-slate-400">
                              Receipt:{' '}
                              {expense.receipt_number}
                            </p>
                          )}

                          {expense.payee_name && (
                            <p className="mt-1 text-xs text-slate-400">
                              Payee:{' '}
                              {expense.payee_name}
                            </p>
                          )}
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
                              Number(
                                expense.paid_amount
                              )
                            )}
                          </p>
                        </div>

                        <div className="rounded-lg bg-red-50 p-2">
                          <p className="text-[11px] text-red-600">
                            Balance
                          </p>

                          <p className="text-xs font-semibold text-red-700">
                            {formatOMR(
                              Number(
                                expense.balance_amount
                              )
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {Number(
                          expense.balance_amount
                        ) > 0 &&
                          expense.main_category ===
                            'Company' &&
                          expense.subcategory ===
                            'Purchase' && (
                            <button
                              onClick={() =>
                                openPayment(expense)
                              }
                              className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                            >
                              Pay Balance
                            </button>
                          )}

                        <button
                          onClick={() =>
                            startEdit(expense)
                          }
                          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                        >
                          Edit
                        </button>

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

                {/* Desktop */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[1100px] text-left">
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
                      {filteredExpenses.map(
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

                            <td className="max-w-[280px] px-5 py-4">
                              {expense.company_name && (
                                <p className="text-sm text-slate-700">
                                  {expense.company_name}
                                </p>
                              )}

                              {expense.receipt_number && (
                                <p className="mt-1 text-xs text-slate-400">
                                  Receipt:{' '}
                                  {
                                    expense.receipt_number
                                  }
                                </p>
                              )}

                              {expense.payee_name && (
                                <p className="mt-1 text-xs text-slate-400">
                                  Payee:{' '}
                                  {expense.payee_name}
                                </p>
                              )}

                              <p className="mt-1 truncate text-xs text-slate-500">
                                {expense.description ||
                                  '-'}
                              </p>
                            </td>

                            <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-semibold text-slate-800">
                              {formatOMR(
                                Number(
                                  expense.amount
                                )
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

                            <td className="px-5 py-4">
                              <div className="flex justify-end gap-2">
                                {Number(
                                  expense.balance_amount
                                ) > 0 &&
                                  expense.main_category ===
                                    'Company' &&
                                  expense.subcategory ===
                                    'Purchase' && (
                                    <button
                                      onClick={() =>
                                        openPayment(
                                          expense
                                        )
                                      }
                                      className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                                    >
                                      Pay
                                    </button>
                                  )}

                                <button
                                  onClick={() =>
                                    startEdit(expense)
                                  }
                                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                                >
                                  Edit
                                </button>

                                <button
                                  onClick={() =>
                                    setDeleteExpense(
                                      expense
                                    )
                                  }
                                  className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                                >
                                  Delete
                                </button>
                              </div>
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

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">

            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
              <div>
                <h2 className="font-semibold text-slate-800">
                  {editingExpense
                    ? 'Edit Expense'
                    : 'Add Expense'}
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Enter the expense details below
                </p>
              </div>

              <button
                onClick={closeModal}
                className="rounded-lg px-3 py-2 text-xl text-slate-400 hover:bg-slate-100"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={saveExpense}
              className="space-y-5 p-5"
            >
              {/* Category */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Main Category
                  </label>

                  <select
                    value={form.main_category}
                    onChange={(e) =>
                      handleCategoryChange(
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                    value={form.subcategory}
                    onChange={(e) =>
                      updateForm(
                        'subcategory',
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    {categories[
                      form.main_category
                    ].map((subcategory) => (
                      <option
                        key={subcategory}
                        value={subcategory}
                      >
                        {subcategory}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Company Purchase */}
              {form.main_category === 'Company' &&
                form.subcategory ===
                  'Purchase' && (
                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <h3 className="mb-3 text-sm font-semibold text-blue-800">
                      Company Purchase
                    </h3>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Receipt No.
                        </label>

                        <input
                          type="text"
                          value={
                            form.receipt_number
                          }
                          onChange={(e) =>
                            updateForm(
                              'receipt_number',
                              e.target.value
                            )
                          }
                          placeholder="INV-105"
                          required
                          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Company Name
                        </label>

                        <input
                          type="text"
                          value={
                            form.company_name
                          }
                          onChange={(e) =>
                            updateForm(
                              'company_name',
                              e.target.value
                            )
                          }
                          placeholder="ABC Trading"
                          required
                          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

              {/* Finance Other Payment */}
              {form.main_category ===
                'Finance' &&
                form.subcategory ===
                  'Other Payment' && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Person Name / Payee
                    </label>

                    <input
                      type="text"
                      value={form.payee_name}
                      onChange={(e) =>
                        updateForm(
                          'payee_name',
                          e.target.value
                        )
                      }
                      placeholder="Enter person name"
                      required
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                )}

              {/* Date */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Date
                </label>

                <input
                  type="date"
                  value={form.expense_date}
                  onChange={(e) =>
                    updateForm(
                      'expense_date',
                      e.target.value
                    )
                  }
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              {/* Amount */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Amount
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={form.amount}
                    onChange={(e) =>
                      updateForm(
                        'amount',
                        e.target.value
                      )
                    }
                    placeholder="500.000"
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Paid
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={form.paid_amount}
                    onChange={(e) =>
                      updateForm(
                        'paid_amount',
                        e.target.value
                      )
                    }
                    placeholder="20.000"
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Balance
                  </label>

                  <div className="flex h-[42px] items-center rounded-lg bg-red-50 px-3 text-sm font-semibold text-red-700">
                    {formatOMR(
                      calculatedBalance
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Description
                </label>

                <textarea
                  value={form.description}
                  onChange={(e) =>
                    updateForm(
                      'description',
                      e.target.value
                    )
                  }
                  placeholder="Enter description"
                  rows={3}
                  className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
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
                    : editingExpense
                    ? 'Update Expense'
                    : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteExpense && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-800">
              Delete Expense?
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Are you sure you want to delete this expense?
              This action cannot be undone.
            </p>

            {Number(
              deleteExpense.paid_amount
            ) > 0 && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                This expense already has a payment and
                cannot be deleted.
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() =>
                  setDeleteExpense(null)
                }
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600"
              >
                Cancel
              </button>

              <button
                onClick={confirmDelete}
                disabled={
                  Number(
                    deleteExpense.paid_amount
                  ) > 0
                }
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT MODAL */}
      {paymentExpense && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">

            <div className="border-b border-slate-200 p-5">
              <h2 className="font-semibold text-slate-800">
                Pay Balance
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                {paymentExpense.company_name ||
                  'Company Purchase'}
              </p>
            </div>

            <div className="space-y-4 p-5">

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">
                    Original Amount
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {formatOMR(
                      Number(
                        paymentExpense.amount
                      )
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
                  min="0"
                  max={Number(
                    paymentExpense.balance_amount
                  )}
                  step="0.001"
                  value={paymentAmount}
                  onChange={(e) =>
                    setPaymentAmount(
                      e.target.value
                    )
                  }
                  placeholder="100.000"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {paymentAmount &&
                Number(paymentAmount) > 0 && (
                  <div className="rounded-lg bg-blue-50 p-3">
                    <p className="text-xs text-blue-600">
                      Remaining Balance
                    </p>

                    <p className="mt-1 text-sm font-bold text-blue-700">
                      {formatOMR(
                        Math.max(
                          Number(
                            paymentExpense.balance_amount
                          ) -
                            Number(
                              paymentAmount
                            ),
                          0
                        )
                      )}
                    </p>
                  </div>
                )}

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  onClick={() =>
                    setPaymentExpense(null)
                  }
                  disabled={paymentSaving}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600"
                >
                  Cancel
                </button>

                <button
                  onClick={savePayment}
                  disabled={paymentSaving}
                  className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
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
    </div>
  )
}