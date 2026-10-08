'use client'

import { useEffect, useState } from 'react'
import Sidebar from '../../components/Sidebar'
import { createClient } from '../../lib/supabase/client'

const categories = {
  Company: ['Purchase', 'Payment'],
  Personal: ['Food', 'Shopping', 'Travel', 'Other'],
  'Bills & Utilities': ['Electricity', 'Water', 'Internet', 'Phone', 'Rent', 'Other'],
  'Salary & Payroll': ['Employee Salary', 'Advance Salary', 'Bonus', 'Other'],
  'Transport & Vehicle': ['Petrol', 'Diesel', 'Taxi', 'Vehicle Repair', 'Other'],
  Finance: ['Loan', 'Other Payment'],
}

type Purchase = {
  id: string
  receipt_number: string
  company_name: string
  amount: number
  paid_amount: number
  balance_amount: number
}

export default function ExpensesPage() {
  const supabase = createClient()

  const [mainCategory, setMainCategory] = useState('Company')
  const [subcategory, setSubcategory] = useState('Purchase')

  const [date, setDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [amount, setAmount] = useState('')
  const [paid, setPaid] = useState('')
  const [description, setDescription] = useState('')

  const [receiptNumber, setReceiptNumber] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [payeeName, setPayeeName] = useState('')

  const [purchase, setPurchase] = useState<Purchase | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [searchingReceipt, setSearchingReceipt] = useState(false)

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const balance =
    Math.max(Number(amount || 0) - Number(paid || 0), 0)

  const selectedSubcategories =
    categories[mainCategory as keyof typeof categories]

  useEffect(() => {
    setSubcategory(selectedSubcategories[0])
    resetFields()
  }, [mainCategory])

  function resetFields() {
    setDate(new Date().toISOString().split('T')[0])
    setAmount('')
    setPaid('')
    setDescription('')
    setReceiptNumber('')
    setCompanyName('')
    setPayeeName('')
    setPurchase(null)
    setPaymentAmount('')
    setMessage('')
    setError('')
  }

  function handleSubcategoryChange(value: string) {
    setSubcategory(value)
    resetFields()
  }

  async function getCurrentUser() {
    const { data } = await supabase.auth.getUser()
    return data.user
  }

  async function handleReceiptLookup() {
    setError('')
    setMessage('')
    setPurchase(null)

    if (!receiptNumber.trim()) {
      setError('Please enter a receipt number.')
      return
    }

    setSearchingReceipt(true)

    const { data, error } = await supabase
      .from('expenses')
      .select(
        'id, receipt_number, company_name, amount, paid_amount, balance_amount'
      )
      .eq('main_category', 'Company')
      .eq('subcategory', 'Purchase')
      .eq('transaction_type', 'expense')
      .eq('receipt_number', receiptNumber.trim())
      .maybeSingle()

    setSearchingReceipt(false)

    if (error) {
      setError(error.message)
      return
    }

    if (!data) {
      setError('No company purchase found with this receipt number.')
      return
    }

    setPurchase(data as Purchase)
  }

  async function handleCompanyPayment() {
    setError('')
    setMessage('')

    if (!purchase) {
      setError('Please search and select a valid receipt number first.')
      return
    }

    const payment = Number(paymentAmount)

    if (!payment || payment <= 0) {
      setError('Enter a valid payment amount.')
      return
    }

    if (payment > Number(purchase.balance_amount)) {
      setError(
        `Payment cannot be more than the current balance of OMR ${Number(
          purchase.balance_amount
        ).toFixed(3)}.`
      )
      return
    }

    setLoading(true)

    const newPaid =
      Number(purchase.paid_amount) + payment

    const { error } = await supabase
      .from('expenses')
      .update({
        paid_amount: newPaid,
      })
      .eq('id', purchase.id)

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    const newBalance =
      Math.max(Number(purchase.amount) - newPaid, 0)

    setPurchase({
      ...purchase,
      paid_amount: newPaid,
      balance_amount: newBalance,
    })

    setPaymentAmount('')
    setMessage(
      `Payment recorded. Remaining balance: OMR ${newBalance.toFixed(3)}`
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    setError('')
    setMessage('')

    if (mainCategory === 'Company' && subcategory === 'Payment') {
      await handleCompanyPayment()
      return
    }

    if (!amount || Number(amount) <= 0) {
      setError('Please enter a valid amount.')
      return
    }

    if (Number(paid || 0) > Number(amount)) {
      setError('Paid amount cannot be greater than the total amount.')
      return
    }

    if (subcategory === 'Purchase' && mainCategory === 'Company') {
      if (!receiptNumber.trim()) {
        setError('Receipt number is required.')
        return
      }

      if (!companyName.trim()) {
        setError('Company name is required.')
        return
      }
    }

    if (
      mainCategory === 'Finance' &&
      subcategory === 'Other Payment' &&
      !payeeName.trim()
    ) {
      setError('Payee name is required.')
      return
    }

    setLoading(true)

    const user = await getCurrentUser()

    if (!user) {
      setLoading(false)
      setError('You are not logged in.')
      return
    }

    const insertData: Record<string, unknown> = {
      expense_date: date,
      main_category: mainCategory,
      subcategory,
      description: description || null,
      amount: Number(amount),
      paid_amount: Number(paid || 0),
      created_by: user.id,
      transaction_type: 'expense',
    }

    if (mainCategory === 'Company' && subcategory === 'Purchase') {
      insertData.receipt_number = receiptNumber.trim()
      insertData.company_name = companyName.trim()
    }

    if (
      mainCategory === 'Finance' &&
      subcategory === 'Other Payment'
    ) {
      insertData.payee_name = payeeName.trim()
    }

    const { error } = await supabase
      .from('expenses')
      .insert(insertData)

    setLoading(false)

    if (error) {
      if (error.code === '23505') {
        setError(
          'This receipt number already exists. Please use a different receipt number.'
        )
      } else {
        setError(error.message)
      }
      return
    }

    setMessage('Expense saved successfully.')
    resetFields()
  }

  const isCompanyPurchase =
    mainCategory === 'Company' && subcategory === 'Purchase'

  const isCompanyPayment =
    mainCategory === 'Company' && subcategory === 'Payment'

  const isOtherFinancePayment =
    mainCategory === 'Finance' && subcategory === 'Other Payment'

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50">
      <Sidebar />

      <main className="min-h-screen md:ml-64">
        <header className="border-b border-slate-200 bg-white px-4 pb-5 pt-20 sm:px-6 md:px-8 md:py-6 md:pt-6">
          <h1 className="text-xl font-semibold text-slate-800 sm:text-2xl">
            Expenses
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Record and manage company expenses and payments
          </p>
        </header>

        <div className="p-4 sm:p-6 md:p-8">
          <div className="mx-auto max-w-5xl">
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="border-b border-slate-100 p-5 sm:p-6">
                <h2 className="text-lg font-semibold text-slate-800">
                  Add Transaction
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Select the category and enter the transaction details.
                </p>
              </div>

              <div className="space-y-6 p-5 sm:p-6">
                {/* Category */}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Main Category
                    </label>

                    <select
                      value={mainCategory}
                      onChange={(e) =>
                        setMainCategory(e.target.value)
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    >
                      {Object.keys(categories).map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Type
                    </label>

                    <select
                      value={subcategory}
                      onChange={(e) =>
                        handleSubcategoryChange(e.target.value)
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    >
                      {selectedSubcategories.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Company Payment */}
                {isCompanyPayment ? (
                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 sm:p-5">
                    <h3 className="mb-4 font-semibold text-blue-900">
                      Company Payment
                    </h3>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <input
                        value={receiptNumber}
                        onChange={(e) =>
                          setReceiptNumber(e.target.value)
                        }
                        placeholder="Enter receipt number"
                        className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                      />

                      <button
                        type="button"
                        onClick={handleReceiptLookup}
                        disabled={searchingReceipt}
                        className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {searchingReceipt ? 'Searching...' : 'Find Receipt'}
                      </button>
                    </div>

                    {purchase && (
                      <div className="mt-5 space-y-4">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <div className="rounded-lg bg-white p-4">
                            <p className="text-xs text-slate-500">
                              Company
                            </p>
                            <p className="mt-1 font-semibold text-slate-800">
                              {purchase.company_name || '-'}
                            </p>
                          </div>

                          <div className="rounded-lg bg-white p-4">
                            <p className="text-xs text-slate-500">
                              Purchase Amount
                            </p>
                            <p className="mt-1 font-semibold text-slate-800">
                              OMR {Number(purchase.amount).toFixed(3)}
                            </p>
                          </div>

                          <div className="rounded-lg bg-white p-4">
                            <p className="text-xs text-slate-500">
                              Current Balance
                            </p>
                            <p className="mt-1 font-semibold text-red-600">
                              OMR{' '}
                              {Number(purchase.balance_amount).toFixed(3)}
                            </p>
                          </div>
                        </div>

                        {Number(purchase.balance_amount) > 0 ? (
                          <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                              Payment Amount
                            </label>

                            <input
                              type="number"
                              step="0.001"
                              min="0"
                              max={Number(purchase.balance_amount)}
                              value={paymentAmount}
                              onChange={(e) =>
                                setPaymentAmount(e.target.value)
                              }
                              placeholder="0.000"
                              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        ) : (
                          <div className="rounded-lg bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
                            This purchase is already fully paid.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Company Purchase */}
                    {isCompanyPurchase && (
                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Receipt No.
                          </label>

                          <input
                            value={receiptNumber}
                            onChange={(e) =>
                              setReceiptNumber(e.target.value)
                            }
                            placeholder="e.g. INV-105"
                            required
                            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Company Name
                          </label>

                          <input
                            value={companyName}
                            onChange={(e) =>
                              setCompanyName(e.target.value)
                            }
                            placeholder="Company name"
                            required
                            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    )}

                    {/* Finance Other Payment */}
                    {isOtherFinancePayment && (
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Person / Payee Name
                        </label>

                        <input
                          value={payeeName}
                          onChange={(e) =>
                            setPayeeName(e.target.value)
                          }
                          placeholder="Person you need to pay"
                          required
                          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
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
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                        className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 md:max-w-sm"
                      />
                    </div>

                    {/* Amounts */}
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Amount
                        </label>

                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                            OMR
                          </span>

                          <input
                            type="number"
                            step="0.001"
                            min="0"
                            value={amount}
                            onChange={(e) =>
                              setAmount(e.target.value)
                            }
                            placeholder="0.000"
                            required
                            className="w-full rounded-lg border border-slate-300 py-3 pl-14 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Paid
                        </label>

                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                            OMR
                          </span>

                          <input
                            type="number"
                            step="0.001"
                            min="0"
                            max={amount || undefined}
                            value={paid}
                            onChange={(e) =>
                              setPaid(e.target.value)
                            }
                            placeholder="0.000"
                            className="w-full rounded-lg border border-slate-300 py-3 pl-14 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Balance
                        </label>

                        <div className="flex h-[46px] items-center rounded-lg border border-slate-200 bg-slate-50 px-4">
                          <span className="mr-2 text-sm text-slate-400">
                            OMR
                          </span>

                          <span
                            className={`font-semibold ${
                              balance > 0
                                ? 'text-red-600'
                                : 'text-emerald-600'
                            }`}
                          >
                            {balance.toFixed(3)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Description
                      </label>

                      <textarea
                        value={description}
                        onChange={(e) =>
                          setDescription(e.target.value)
                        }
                        rows={4}
                        placeholder="Enter transaction description..."
                        className="w-full resize-none rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}

                {/* Messages */}
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {message && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                    {message}
                  </div>
                )}

                {/* Submit */}
                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={resetFields}
                    className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Clear
                  </button>

                  {(!isCompanyPayment ||
                    (purchase &&
                      Number(purchase.balance_amount) > 0)) && (
                    <button
                      type="submit"
                      disabled={loading}
                      className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loading
                        ? 'Saving...'
                        : isCompanyPayment
                          ? 'Record Payment'
                          : 'Save Expense'}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}