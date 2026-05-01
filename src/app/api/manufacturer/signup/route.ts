import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import { z } from 'zod'

const SignupSchema = z.object({
  businessName: z.string().min(2),
  businessType: z.string().min(1),
  gstNumber: z.string().optional(),
  panNumber: z.string().min(1),
  registeredAddress: z.string().min(5),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/),
  cluster: z.string().min(1),
  contactName: z.string().min(2),
  contactRole: z.string().min(1),
  phone: z.string().min(10),
  whatsappPhone: z.string().min(10),
  email: z.string().email(),
  password: z.string().min(8),
  storeName: z.string().min(2),
  category: z.string().min(1),
  description: z.string().min(10),
  monthlyCapacity: z.string(),
  avgPrice: z.string(),
  payoutSchedule: z.string(),
  shippingFrom: z.string(),
  bankAccountName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = SignupSchema.safeParse(await req.json())
    if (!body.success) {
      return NextResponse.json({ error: 'Invalid input. Please fill all required fields.' }, { status: 400 })
    }

    const d = body.data
    const supabase = createSupabaseAdmin()

    // Check if email already applied
    const { data: existing } = await supabase.from('manufacturer_applications').select('id').eq('email', d.email).single()
    if (existing) return NextResponse.json({ error: 'An application with this email already exists.' }, { status: 409 })

    // Save application
    const { error } = await supabase.from('manufacturer_applications').insert({
      business_name: d.businessName,
      business_type: d.businessType,
      gst_number: d.gstNumber ?? null,
      pan_number: d.panNumber,
      registered_address: d.registeredAddress,
      city: d.city,
      state: d.state,
      pincode: d.pincode,
      cluster: d.cluster,
      contact_name: d.contactName,
      contact_role: d.contactRole,
      phone: d.phone,
      whatsapp_phone: d.whatsappPhone,
      email: d.email,
      password_hash: d.password, // admin will create auth user on approval
      store_name: d.storeName,
      category: d.category,
      description: d.description,
      monthly_capacity: parseInt(d.monthlyCapacity) || 0,
      avg_price_paise: Math.round((parseFloat(d.avgPrice) || 0) * 100),
      payout_schedule: d.payoutSchedule,
      shipping_from: d.shippingFrom,
      bank_account: { name: d.bankAccountName, number: d.bankAccountNumber, ifsc: d.ifscCode },
      status: 'pending',
    })

    if (error) {
      console.error(error)
      return NextResponse.json({ error: 'Failed to submit application.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
