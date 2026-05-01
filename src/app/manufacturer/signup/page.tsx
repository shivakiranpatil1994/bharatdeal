'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Factory, Upload, CheckCircle2, ChevronRight, ChevronLeft, Store, Package, Truck, FileText } from 'lucide-react'
import Link from 'next/link'

const STEPS = [
  { id: 1, label: 'Business Info', icon: Store },
  { id: 2, label: 'Seller Details', icon: FileText },
  { id: 3, label: 'Store Setup', icon: Package },
  { id: 4, label: 'Shipping', icon: Truck },
]

const CATEGORIES = ['Cotton Knitwear', 'Sarees', 'Brass Home Decor', 'Leather Goods', 'Wooden Handicrafts', 'Jute Products', 'Silk Fabrics', 'Silver Jewellery', 'Pottery & Ceramics', 'Spices & Food', 'Other']
const CLUSTERS = ['Tirupur', 'Surat', 'Moradabad', 'Ludhiana', 'Agra', 'Jaipur', 'Varanasi', 'Kolkata', 'Coimbatore', 'Other']
const BUSINESS_TYPES = ['Sole Proprietorship', 'Partnership', 'Private Limited', 'LLP', 'Individual Artisan']

interface FormData {
  // Step 1 — Business Info
  businessType: string; businessName: string; gstNumber: string; panNumber: string
  registeredAddress: string; city: string; state: string; pincode: string; cluster: string
  // Step 2 — Seller Details
  contactName: string; contactRole: string; phone: string; email: string; password: string
  whatsappPhone: string; aadhaarNumber: string
  // Step 3 — Store Setup
  storeName: string; category: string; description: string; monthlyCapacity: string; avgPrice: string
  // Step 4 — Shipping
  payoutSchedule: string; shippingFrom: string; processingDays: string; bankAccountName: string
  bankAccountNumber: string; ifscCode: string
}

const EMPTY: FormData = {
  businessType: '', businessName: '', gstNumber: '', panNumber: '',
  registeredAddress: '', city: '', state: '', pincode: '', cluster: '',
  contactName: '', contactRole: '', phone: '', email: '', password: '',
  whatsappPhone: '', aadhaarNumber: '',
  storeName: '', category: '', description: '', monthlyCapacity: '', avgPrice: '',
  payoutSchedule: 'T+2', shippingFrom: '', processingDays: '2',
  bankAccountName: '', bankAccountNumber: '', ifscCode: '',
}

function Input({ label, value, onChange, type = 'text', placeholder = '', required = false }: {
  label: string; value: string; onChange: (v: string) => void
  type?: string; placeholder?: string; required?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-[#E8450A] focus:bg-white focus:outline-none transition-colors text-sm" />
    </div>
  )
}

function Select({ label, value, onChange, options, required = false }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; required?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:border-[#E8450A] focus:bg-white focus:outline-none transition-colors text-sm">
        <option value="">Select…</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

export default function SellerSignupPage() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>(EMPTY)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function set(key: keyof FormData) { return (v: string) => setForm(f => ({ ...f, [key]: v })) }

  async function handleSubmit() {
    setLoading(true)
    try {
      const res = await fetch('/api/manufacturer/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setSubmitted(true)
      } else {
        const { error } = await res.json()
        toast.error(error ?? 'Submission failed. Try again.')
      }
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border border-gray-100 rounded-3xl shadow-sm p-8 flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Application Submitted!</h2>
        <p className="text-sm text-gray-500 max-w-xs">Our team will review your application within 2–3 business days. You'll receive a WhatsApp notification once approved.</p>
        <div className="bg-gray-50 rounded-2xl p-4 w-full text-left space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">What happens next</p>
          {['Admin reviews your business documents', 'Background check on GST & PAN', 'Store approval & onboarding call', 'Start listing products & earning'].map((s, i) => (
            <div key={s} className="flex items-start gap-2 text-sm text-gray-600">
              <span className="w-5 h-5 rounded-full bg-[#E8450A] text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
              {s}
            </div>
          ))}
        </div>
        <Link href="/" className="text-sm text-[#E8450A] hover:underline">Back to Store</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F5F5F5] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="font-['Syne',sans-serif] font-extrabold text-2xl text-gray-900 mb-1">
            Bharat<span className="text-[#E8450A]">Deal</span>
          </Link>
          <p className="text-sm text-gray-500">Become a Verified Seller</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-between mb-8 px-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                  step > s.id ? 'bg-[#E8450A] border-[#E8450A]' : step === s.id ? 'border-[#E8450A] bg-white' : 'border-gray-200 bg-white'
                }`}>
                  {step > s.id
                    ? <CheckCircle2 className="w-5 h-5 text-white" />
                    : <s.icon className={`w-4 h-4 ${step === s.id ? 'text-[#E8450A]' : 'text-gray-300'}`} />
                  }
                </div>
                <p className={`text-xs mt-1 font-medium whitespace-nowrap ${step === s.id ? 'text-[#E8450A]' : 'text-gray-400'}`}>{s.label}</p>
              </div>
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 mb-4 ${step > s.id ? 'bg-[#E8450A]' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* Form card */}
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 sm:p-8">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Store className="w-5 h-5 text-[#E8450A]" /> Business Information</h2>
              <Select label="Business Type" value={form.businessType} onChange={set('businessType')} options={BUSINESS_TYPES} required />
              <Input label="Business / Brand Name" value={form.businessName} onChange={set('businessName')} placeholder="Tirupur Cotton Co" required />
              <div className="grid grid-cols-2 gap-4">
                <Input label="GST Number" value={form.gstNumber} onChange={set('gstNumber')} placeholder="27AAPFU0939F1ZV" />
                <Input label="PAN Number" value={form.panNumber} onChange={set('panNumber')} placeholder="AAPFU0939F" required />
              </div>
              <Input label="Registered Address" value={form.registeredAddress} onChange={set('registeredAddress')} placeholder="123 Industrial Area" required />
              <div className="grid grid-cols-3 gap-4">
                <Input label="City" value={form.city} onChange={set('city')} placeholder="Tirupur" required />
                <Input label="State" value={form.state} onChange={set('state')} placeholder="Tamil Nadu" required />
                <Input label="Pincode" value={form.pincode} onChange={set('pincode')} placeholder="641601" required />
              </div>
              <Select label="Manufacturing Cluster" value={form.cluster} onChange={set('cluster')} options={CLUSTERS} required />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><FileText className="w-5 h-5 text-[#E8450A]" /> Seller Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Contact Person Name" value={form.contactName} onChange={set('contactName')} placeholder="Rajesh Kumar" required />
                <Input label="Role / Designation" value={form.contactRole} onChange={set('contactRole')} placeholder="Owner / Manager" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Mobile Number" value={form.phone} onChange={set('phone')} type="tel" placeholder="9876543210" required />
                <Input label="WhatsApp Number" value={form.whatsappPhone} onChange={set('whatsappPhone')} type="tel" placeholder="9876543210" required />
              </div>
              <Input label="Email Address" value={form.email} onChange={set('email')} type="email" placeholder="you@factory.com" required />
              <Input label="Password" value={form.password} onChange={set('password')} type="password" placeholder="Min 8 characters" required />
              <Input label="Aadhaar Number (last 4 digits)" value={form.aadhaarNumber} onChange={set('aadhaarNumber')} placeholder="XXXX XXXX 1234" />
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-600">
                <p className="font-semibold mb-0.5">Why we collect this</p>
                <p>Aadhaar and PAN are used for KYC verification and TDS compliance as per Indian tax law.</p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Package className="w-5 h-5 text-[#E8450A]" /> Store Setup</h2>
              <Input label="Store Name" value={form.storeName} onChange={set('storeName')} placeholder="Tirupur Cotton House" required />
              <Select label="Primary Category" value={form.category} onChange={set('category')} options={CATEGORIES} required />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Store Description <span className="text-red-500">*</span></label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Tell buyers about your factory, products, and what makes you unique…"
                  rows={4} className="px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-[#E8450A] focus:bg-white focus:outline-none transition-colors text-sm resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Monthly Production Capacity (units)" value={form.monthlyCapacity} onChange={set('monthlyCapacity')} placeholder="500" required />
                <Input label="Average Product Price (₹)" value={form.avgPrice} onChange={set('avgPrice')} placeholder="499" required />
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
                <p className="font-semibold mb-0.5">Platform Fee Structure</p>
                <p>✅ Zero listing fee · Zero commission · ₹0 monthly subscription</p>
                <p className="mt-1">BharatDeal earns 2–4% referral fee on completed orders. Flash deals are 100% seller-funded.</p>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Truck className="w-5 h-5 text-[#E8450A]" /> Shipping & Payout</h2>
              <Input label="Ship From Address" value={form.shippingFrom} onChange={set('shippingFrom')} placeholder="Factory address or warehouse" required />
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Payout Schedule <span className="text-red-500">*</span></label>
                  <select value={form.payoutSchedule} onChange={e => setForm(f => ({ ...f, payoutSchedule: e.target.value }))}
                    className="px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:border-[#E8450A] focus:bg-white focus:outline-none transition-colors text-sm">
                    <option value="T+7">T+7 (Free)</option>
                    <option value="T+2">T+2 (1% fee)</option>
                    <option value="T+0">T+0 (2% fee)</option>
                  </select>
                </div>
                <Input label="Order Processing Days" value={form.processingDays} onChange={set('processingDays')} placeholder="2" />
              </div>
              <div className="border-t border-gray-100 pt-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">Bank Account Details</p>
                <div className="space-y-3">
                  <Input label="Account Holder Name" value={form.bankAccountName} onChange={set('bankAccountName')} placeholder="As per bank records" required />
                  <Input label="Account Number" value={form.bankAccountNumber} onChange={set('bankAccountNumber')} placeholder="XXXXXXXXXXXXXXXX" required />
                  <Input label="IFSC Code" value={form.ifscCode} onChange={set('ifscCode')} placeholder="SBIN0001234" required />
                </div>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-700">
                <p className="font-semibold mb-0.5">Shipping handled by BharatDeal</p>
                <p>We use Shiprocket to route your orders to the cheapest courier. You only need to pack and hand over to pickup.</p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-5 border-t border-gray-100">
            {step > 1 ? (
              <button onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <Link href="/manufacturer/login" className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors">
                Already registered? Sign In
              </Link>
            )}
            {step < 4 ? (
              <button onClick={() => setStep(s => s + 1)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E8450A] hover:bg-orange-700 text-white text-sm font-semibold transition-colors shadow-sm">
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E8450A] hover:bg-orange-700 text-white text-sm font-semibold transition-colors shadow-sm disabled:opacity-50">
                {loading ? 'Submitting…' : 'Submit Application'}
                {!loading && <ChevronRight className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          By applying you agree to BharatDeal&apos;s{' '}
          <a href="#" className="text-[#E8450A] hover:underline">Seller Terms</a> and{' '}
          <a href="#" className="text-[#E8450A] hover:underline">Privacy Policy</a>.
        </p>
      </div>
    </div>
  )
}
