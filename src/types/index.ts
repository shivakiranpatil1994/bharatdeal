import { z } from 'zod'

export const CreateOrderSchema = z.object({
  productId: z.string().uuid(),
  buyerPhone: z.string().regex(/^[6-9]\d{9}$/),
  buyerName: z.string().min(2).max(100).transform((s) => s.trim()),
  buyerPincode: z.string().regex(/^[1-9][0-9]{5}$/),
  buyerAddress: z.string().min(10).max(500).transform((s) => s.trim()),
  quantity: z.number().int().min(1).max(10),
  size: z.string().max(10).optional(),
  color: z.string().max(30).optional(),
  paymentMethod: z.enum(['upi', 'cod', 'card']),
})

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>

export const SearchEventSchema = z.object({
  term: z.string().min(1).max(200).transform((s) => s.trim().toLowerCase()),
  resultsCount: z.number().int().min(0),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/).optional(),
  productId: z.string().uuid().optional(),
})

export type SearchEventInput = z.infer<typeof SearchEventSchema>

export const VerifyPaymentSchema = z.object({
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
  orderId: z.string().uuid(),
})

export type VerifyPaymentInput = z.infer<typeof VerifyPaymentSchema>

export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'rto'
  | 'cancelled'

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export type PaymentMethod = 'upi' | 'cod' | 'card'

export type ReturnReason =
  | 'size'
  | 'quality'
  | 'colour_diff'
  | 'wrong_item'
  | 'changed_mind'

export type AlertType =
  | 'quality-spike'
  | 'low-stock'
  | 'trend'
  | 'opportunity'
  | 'stockout'
  | 'pricing'

export type InsightType =
  | 'daily_summary'
  | 'opportunity'
  | 'alert'
  | 'trend'
  | 'production_plan'
