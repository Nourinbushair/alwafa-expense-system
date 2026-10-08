'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'

const menuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: '▦' },
  { name: 'Expenses', href: '/expenses', icon: '◈' },
  { name: 'Reports', href: '/reports', icon: '▤' },
  { name: 'Settings', href: '/settings', icon: '⚙' },
]

const categories: Record<string, string[]> = {
  Company: ['Office', 'Travel', 'Other'],
  Personal: ['Food', 'Shopping', 'Travel', 'Other'],
  'Bills & Utilities': [
    'Electricity',
    'Water',
    'Internet',
    'Phone',
    'Other',
  ],
  Rent: ['Office Rent', 'House Rent', 'Room Rent', 'Other'],
  'Salary & Payroll': [
    'Employee Salary',
    'Advance Salary',
    'Bonus',
    'Other',
  ],
  Purchases: [
    'Equipment',
    'Office Items',
    'Stock',
    'Supplies',
    'Other',
  ],
  'Transport & Vehicle': [
    'Petrol',
    'Diesel',
    'Taxi',
    'Vehicle Repair',
    'Other',
  ],
  Finance: [
    'Loan',
    'Repayment',
    'Bank Transfer',
    'Withdrawal',
    'Deposit',
    'Other',
  ],
}

type Expense = {
  id: string
  expense_date: string
  main_category: string
  subcategory: string
  description: string | null
  amount: number
  company_name: string | null
  vendor_name: string | null
  person_name: string | null
  product_name: string | null
  quantity: number | null
  quantity_unit: string | null
  unit_price: number | null
  invoice_number: string | null
  reference_number: string | null
  payment_method: string | null
  paid_amount: number | null
  balance_amount: number | null
  provider_name: string | null
  due_date: string | null
  employee_name: string | null
  salary_month: string | null
  property_name: string | null
  vehicle_name: string | null
  notes: string | null
}

export default function ExpensesPage() {
  const router = useRouter()

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().slice(0, 10)
  )

  const [mainCategory, setMainCategory] = useState('Company')
  const [subcategory, setSubcategory] = useState('Office')

  const [companyName, setCompanyName] = useState('')
  const [vendorName, setVendorName] = useState('')
  const [personName, setPersonName] = useState('')
  const [productName, setProductName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [quantityUnit, setQuantityUnit] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [amount, setAmount] = useState('')
  const [paidAmount, setPaidAmount] = useState('')
  const [providerName, setProviderName] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [employeeName, setEmployeeName] = useState('')
  const [salaryMonth, setSalaryMonth] = useState('')
  const [propertyName, setPropertyName] = useState('')
  const [vehicleName, setVehicleName] = useState('')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadExpenses()
  }, [])

  useEffect(() => {
    const firstSubcategory = categories[mainCategory]?.[0] || ''
    setSubcategory(firstSubcategory)

    setCompanyName('')
    setVendorName('')
    setPersonName('')
    setProductName('')
    setQuantity('')
    setQuantityUnit('')
    setUnitPrice('')
    setInvoiceNumber('')
    setReferenceNumber('')
    setPaymentMethod('Cash')
    setAmount('')
    setPaidAmount('')
    setProviderName('')
    setDueDate('')
    setEmployeeName('')
    setSalaryMonth('')
    setPropertyName('')
    setVehicleName('')
    setDescription('')
    setNotes('')
  }, [mainCategory])

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
        vendor_name,
        person_name,
        product_name,
        quantity,
        quantity_unit,
        unit_price,
        invoice_number,
        reference_number,
        payment_method,
        paid_amount,
        balance_amount,
        provider_name,
        due_date,
        employee_name,
        salary_month,
        property_name,
        vehicle_name,
        notes
        `
      )
      .order('expense_date', { ascending: false })

    if (error) {
      console.error(error)
      setError('Unable to load expenses.')
      setLoading(false)
      return
    }

    setExpenses(data || [])
    setLoading(false)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

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

    const expenseAmount = Number(amount)
    const paid = Number(paidAmount || 0)

    if (expenseAmount < 0 || paid < 0) {
      setError('Amount values cannot be negative.')
      setSaving(false)
      return
    }

    if (paid > expenseAmount) {
      setError('Paid amount cannot be greater than the total amount.')
      setSaving(false)
      return
    }

    const { error } = await supabase.from('expenses').insert({
      expense_date: expenseDate,
      main_category: mainCategory,
      subcategory,
      description: description || null,

      amount: expenseAmount,

      company_name: companyName || null,
      vendor_name: vendorName || null,
      person_name: personName || null,
      product_name: productName || null,

      quantity: quantity ? Number(quantity) : null,
      quantity_unit: quantityUnit || null,
      unit_price: unitPrice ? Number(unitPrice) : null,

      invoice_number: invoiceNumber || null,
      reference_number: referenceNumber || null,

      payment_method: paymentMethod || null,

      paid_amount: paid,

      provider_name: providerName || null,
      due_date: dueDate || null,

      employee_name: employeeName || null,
      salary_month: salaryMonth
        ? `${salaryMonth}-01`
        : null,

      property_name: propertyName || null,
      vehicle_name: vehicleName || null,

      notes: notes || null,

      created_by: user.id,
    })

    if (error) {
      console.error(error)
      setError(error.message)
      setSaving(false)
      return
    }

    setMessage('Expense added successfully.')

    setExpenseDate(new Date().toISOString().slice(0, 10))
    setCompanyName('')
    setVendorName('')
    setPersonName('')
    setProductName('')
    setQuantity('')
    setQuantityUnit('')
    setUnitPrice('')
    setInvoiceNumber('')
    setReferenceNumber('')
    setPaymentMethod('Cash')
    setAmount('')
    setPaidAmount('')
    setProviderName('')
    setDueDate('')
    setEmployeeName('')
    setSalaryMonth('')
    setPropertyName('')
    setVehicleName('')
    setDescription('')
    setNotes('')

    await loadExpenses()

    setSaving(false)
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this expense?'
    )

    if (!confirmed) return

    const supabase = createClient()

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)

    if (error) {
      console.error(error)
      setError('Unable to delete expense.')
      return
    }

    await loadExpenses()
  }

  async function handleLogout() {
    const supabase = createClient()

    await supabase.auth.signOut()

    window.location.href = '/login'
  }

  const balancePreview =
    Number(amount || 0) - Number(paidAmount || 0)

  return (
    <div className="min-h-screen bg-slate-50">

      {/* SIDEBAR */}

      <aside className="fixed left-0 top-0 flex h-screen w-60 flex-col border-r border-slate-200 bg-white">

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
                  item.href === '/expenses'
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

      {/* MAIN */}

      <main className="ml-60 min-h-screen">

        <header className="border-b border-slate-200 bg-white px-8 py-6">

          <div>
            <h1 className="text-2xl font-semibold text-slate-800">
              Expenses
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Record and manage company expenses
            </p>
          </div>

        </header>

        <div className="p-8">

          {/* FORM */}

          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 px-6 py-5">

              <h2 className="text-lg font-semibold text-slate-800">
                Add Expense
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Enter the details of the transaction
              </p>

            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-8 p-6"
            >

              {/* BASIC INFORMATION */}

              <div>

                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Basic Information
                </h3>

                <div className="grid gap-5 md:grid-cols-3">

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Date
                    </label>

                    <input
                      type="date"
                      required
                      value={expenseDate}
                      onChange={(e) =>
                        setExpenseDate(e.target.value)
                      }
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Main Category
                    </label>

                    <select
                      value={mainCategory}
                      onChange={(e) =>
                        setMainCategory(e.target.value)
                      }
                      className="input"
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
                      className="input"
                    >

                      {categories[mainCategory].map(
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

                </div>

              </div>

              {/* COMPANY */}

              {mainCategory === 'Company' && (

                <div>

                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Company Expense Details
                  </h3>

                  <div className="grid gap-5 md:grid-cols-2">

                    <div>
                      <label className="label">
                        Company Name
                      </label>

                      <input
                        value={companyName}
                        onChange={(e) =>
                          setCompanyName(e.target.value)
                        }
                        placeholder="Enter company name"
                        className="input"
                      />
                    </div>

                    <div>
                      <label className="label">
                        Product Purchased
                      </label>

                      <input
                        value={productName}
                        onChange={(e) =>
                          setProductName(e.target.value)
                        }
                        placeholder="Enter product"
                        className="input"
                      />
                    </div>

                    <div>
                      <label className="label">
                        Quantity
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        value={quantity}
                        onChange={(e) =>
                          setQuantity(e.target.value)
                        }
                        placeholder="0"
                        className="input"
                      />
                    </div>

                    <div>
                      <label className="label">
                        Quantity Unit
                      </label>

                      <input
                        value={quantityUnit}
                        onChange={(e) =>
                          setQuantityUnit(e.target.value)
                        }
                        placeholder="pcs / kg / litre"
                        className="input"
                      />
                    </div>

                    <div>
                      <label className="label">
                        Invoice Number
                      </label>

                      <input
                        value={invoiceNumber}
                        onChange={(e) =>
                          setInvoiceNumber(e.target.value)
                        }
                        placeholder="Invoice number"
                        className="input"
                      />
                    </div>

                    <div>
                      <label className="label">
                        Supplier / Vendor
                      </label>

                      <input
                        value={vendorName}
                        onChange={(e) =>
                          setVendorName(e.target.value)
                        }
                        placeholder="Supplier name"
                        className="input"
                      />
                    </div>

                  </div>

                </div>

              )}

              {/* PERSONAL */}

              {mainCategory === 'Personal' && (

                <div>

                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Personal Expense Details
                  </h3>

                  <div className="grid gap-5 md:grid-cols-2">

                    <div>
                      <label className="label">
                        Person / Name
                      </label>

                      <input
                        value={personName}
                        onChange={(e) =>
                          setPersonName(e.target.value)
                        }
                        placeholder="Enter name"
                        className="input"
                      />
                    </div>

                    <div>
                      <label className="label">
                        Description
                      </label>

                      <input
                        value={description}
                        onChange={(e) =>
                          setDescription(e.target.value)
                        }
                        placeholder="What was the expense for?"
                        className="input"
                      />
                    </div>

                  </div>

                </div>

              )}

              {/* BILLS */}

              {mainCategory === 'Bills & Utilities' && (

                <div>

                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Bill Details
                  </h3>

                  <div className="grid gap-5 md:grid-cols-2">

                    <div>
                      <label className="label">
                        Provider
                      </label>

                      <input
                        value={providerName}
                        onChange={(e) =>
                          setProviderName(e.target.value)
                        }
                        placeholder="Electricity / Internet provider"
                        className="input"
                      />
                    </div>

                    <div>
                      <label className="label">
                        Due Date
                      </label>

                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) =>
                          setDueDate(e.target.value)
                        }
                        className="input"
                      />
                    </div>

                  </div>

                </div>

              )}

              {/* RENT */}

              {mainCategory === 'Rent' && (

                <div>

                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Rent Details
                  </h3>

                  <div className="grid gap-5 md:grid-cols-2">

                    <div>
                      <label className="label">
                        Property / Location
                      </label>

                      <input
                        value={propertyName}
                        onChange={(e) =>
                          setPropertyName(e.target.value)
                        }
                        placeholder="Property or location"
                        className="input"
                      />
                    </div>

                    <div>
                      <label className="label">
                        Due Date
                      </label>

                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) =>
                          setDueDate(e.target.value)
                        }
                        className="input"
                      />
                    </div>

                  </div>

                </div>

              )}

              {/* SALARY */}

              {mainCategory === 'Salary & Payroll' && (

                <div>

                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Salary Details
                  </h3>

                  <div className="grid gap-5 md:grid-cols-2">

                    <div>
                      <label className="label">
                        Employee Name
                      </label>

                      <input
                        value={employeeName}
                        onChange={(e) =>
                          setEmployeeName(e.target.value)
                        }
                        placeholder="Employee name"
                        className="input"
                      />
                    </div>

                    <div>
                      <label className="label">
                        Salary Month
                      </label>

                      <input
                        type="month"
                        value={salaryMonth}
                        onChange={(e) =>
                          setSalaryMonth(e.target.value)
                        }
                        className="input"
                      />
                    </div>

                  </div>

                </div>

              )}

              {/* PURCHASES */}

              {mainCategory === 'Purchases' && (

                <div>

                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Purchase Details
                  </h3>

                  <div className="grid gap-5 md:grid-cols-2">

                    <div>
                      <label className="label">
                        Product
                      </label>

                      <input
                        value={productName}
                        onChange={(e) =>
                          setProductName(e.target.value)
                        }
                        placeholder="Product name"
                        className="input"
                      />
                    </div>

                    <div>
                      <label className="label">
                        Supplier
                      </label>

                      <input
                        value={vendorName}
                        onChange={(e) =>
                          setVendorName(e.target.value)
                        }
                        placeholder="Supplier name"
                        className="input"
                      />
                    </div>

                    <div>
                      <label className="label">
                        Quantity
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        value={quantity}
                        onChange={(e) =>
                          setQuantity(e.target.value)
                        }
                        className="input"
                      />
                    </div>

                    <div>
                      <label className="label">
                        Invoice Number
                      </label>

                      <input
                        value={invoiceNumber}
                        onChange={(e) =>
                          setInvoiceNumber(e.target.value)
                        }
                        placeholder="Invoice number"
                        className="input"
                      />
                    </div>

                  </div>

                </div>

              )}

              {/* TRANSPORT */}

              {mainCategory === 'Transport & Vehicle' && (

                <div>

                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Vehicle Details
                  </h3>

                  <div className="grid gap-5 md:grid-cols-2">

                    <div>
                      <label className="label">
                        Vehicle
                      </label>

                      <input
                        value={vehicleName}
                        onChange={(e) =>
                          setVehicleName(e.target.value)
                        }
                        placeholder="Vehicle name / number"
                        className="input"
                      />
                    </div>

                    <div>
                      <label className="label">
                        Quantity / Litres
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        value={quantity}
                        onChange={(e) =>
                          setQuantity(e.target.value)
                        }
                        placeholder="0"
                        className="input"
                      />
                    </div>

                  </div>

                </div>

              )}

              {/* FINANCE */}

              {mainCategory === 'Finance' && (

                <div>

                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Finance Details
                  </h3>

                  <div className="grid gap-5 md:grid-cols-2">

                    <div>
                      <label className="label">
                        Reference Number
                      </label>

                      <input
                        value={referenceNumber}
                        onChange={(e) =>
                          setReferenceNumber(e.target.value)
                        }
                        placeholder="Reference number"
                        className="input"
                      />
                    </div>

                    <div>
                      <label className="label">
                        Description
                      </label>

                      <input
                        value={description}
                        onChange={(e) =>
                          setDescription(e.target.value)
                        }
                        placeholder="Transaction description"
                        className="input"
                      />
                    </div>

                  </div>

                </div>

              )}

              {/* PAYMENT */}

              <div>

                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Payment Information
                </h3>

                <div className="grid gap-5 md:grid-cols-4">

                  <div>
                    <label className="label">
                      Amount (OMR)
                    </label>

                    <input
                      type="number"
                      required
                      min="0"
                      step="0.001"
                      value={amount}
                      onChange={(e) =>
                        setAmount(e.target.value)
                      }
                      placeholder="0.000"
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="label">
                      Paid (OMR)
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.001"
                      value={paidAmount}
                      onChange={(e) =>
                        setPaidAmount(e.target.value)
                      }
                      placeholder="0.000"
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="label">
                      Balance (OMR)
                    </label>

                    <div className="flex h-[46px] items-center rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-orange-600">
                      OMR {Math.max(balancePreview, 0).toFixed(3)}
                    </div>
                  </div>

                  <div>
                    <label className="label">
                      Payment Method
                    </label>

                    <select
                      value={paymentMethod}
                      onChange={(e) =>
                        setPaymentMethod(e.target.value)
                      }
                      className="input"
                    >

                      <option>Cash</option>
                      <option>Bank Transfer</option>
                      <option>Card</option>
                      <option>Cheque</option>
                      <option>Other</option>

                    </select>

                  </div>

                </div>

              </div>

              {/* NOTES */}

              <div>

                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Additional Information
                </h3>

                <div className="grid gap-5 md:grid-cols-2">

                  <div>
                    <label className="label">
                      Description
                    </label>

                    <textarea
                      value={description}
                      onChange={(e) =>
                        setDescription(e.target.value)
                      }
                      rows={4}
                      placeholder="Enter description"
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="label">
                      Notes
                    </label>

                    <textarea
                      value={notes}
                      onChange={(e) =>
                        setNotes(e.target.value)
                      }
                      rows={4}
                      placeholder="Additional notes"
                      className="input"
                    />
                  </div>

                </div>

              </div>

              {message && (
                <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {message}
                </div>
              )}

              {error && (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="flex justify-end border-t border-slate-100 pt-6">

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-7 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Expense'}
                </button>

              </div>

            </form>

          </section>

          {/* HISTORY */}

          <section className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 px-6 py-5">

              <h2 className="text-lg font-semibold text-slate-800">
                Expense History
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Recently recorded expenses
              </p>

            </div>

            {loading ? (

              <div className="px-6 py-10 text-center text-sm text-slate-500">
                Loading expenses...
              </div>

            ) : expenses.length === 0 ? (

              <div className="px-6 py-10 text-center text-sm text-slate-500">
                No expenses recorded yet.
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

                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Amount
                      </th>

                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Paid
                      </th>

                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Balance
                      </th>

                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Action
                      </th>

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-slate-100">

                    {expenses.map((expense) => (

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
                            {expense.company_name ||
                              expense.vendor_name ||
                              expense.person_name ||
                              '—'}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {expense.product_name ||
                              expense.description ||
                              '—'}
                          </p>

                        </td>

                        <td className="px-6 py-4 text-right text-sm font-semibold text-slate-700">
                          OMR {Number(expense.amount).toFixed(3)}
                        </td>

                        <td className="px-6 py-4 text-right text-sm font-medium text-emerald-600">
                          OMR{' '}
                          {Number(
                            expense.paid_amount || 0
                          ).toFixed(3)}
                        </td>

                        <td className="px-6 py-4 text-right text-sm font-medium text-orange-600">
                          OMR{' '}
                          {Number(
                            expense.balance_amount || 0
                          ).toFixed(3)}
                        </td>

                        <td className="px-6 py-4 text-right">

                          <button
                            onClick={() =>
                              handleDelete(expense.id)
                            }
                            className="text-sm font-medium text-red-500 hover:text-red-700"
                          >
                            Delete
                          </button>

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

      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid rgb(203 213 225);
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          outline: none;
          background: white;
        }

        .input:focus {
          border-color: rgb(59 130 246);
          box-shadow: 0 0 0 2px rgb(219 234 254);
        }

        .label {
          display: block;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: rgb(51 65 85);
        }
      `}</style>

    </div>
  )
}