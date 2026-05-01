import Razorpay from 'razorpay'

// Lazy init — avoid throwing at module evaluation when env vars are absent (e.g. build time)
function getRazorpay() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  })
}

export interface CreateOrderParams {
  amountPaise: number
  currency?: string
  receipt: string
  notes?: Record<string, string>
}

export async function createRazorpayOrder(params: CreateOrderParams) {
  return getRazorpay().orders.create({
    amount: params.amountPaise,
    currency: params.currency ?? 'INR',
    receipt: params.receipt,
    notes: params.notes,
  })
}

export async function fetchPayment(paymentId: string) {
  return getRazorpay().payments.fetch(paymentId)
}
