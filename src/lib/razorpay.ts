import Razorpay from 'razorpay'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export interface CreateOrderParams {
  amountPaise: number
  currency?: string
  receipt: string
  notes?: Record<string, string>
}

export async function createRazorpayOrder(params: CreateOrderParams) {
  return razorpay.orders.create({
    amount: params.amountPaise,
    currency: params.currency ?? 'INR',
    receipt: params.receipt,
    notes: params.notes,
  })
}

export async function fetchPayment(paymentId: string) {
  return razorpay.payments.fetch(paymentId)
}
