import crypto from 'crypto'
import { NextRequest } from 'next/server'

export function verifyRazorpayWebhook(body: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret || !signature) return false
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  } catch {
    return false
  }
}

export function verifyRazorpayPayment(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET
  if (!secret || !signature) return false
  const payload  = `${razorpayOrderId}|${razorpayPaymentId}`
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  } catch {
    return false
  }
}

export function verifyShiprocketWebhook(body: string, token: string): boolean {
  const expected = process.env.SHIPROCKET_WEBHOOK_TOKEN
  if (!expected) return false
  return token === expected
}

export function sanitize(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim()
    .slice(0, 1000)
}

export function validatePhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone.replace(/\D/g, '').slice(-10))
}

export function validatePincode(pincode: string): boolean {
  return /^[1-9][0-9]{5}$/.test(pincode)
}

export function getRateLimit(req: NextRequest) {
  return {
    remaining: req.headers.get('X-RateLimit-Remaining'),
    limit:     req.headers.get('X-RateLimit-Limit'),
  }
}

export function verifyAdminToken(req: NextRequest): boolean {
  const token   = req.cookies.get('admin_token')?.value
  const secret  = process.env.ADMIN_SECRET
  if (!token || !secret) return false
  return token === secret
}

export function validateAmount(amount: number, expectedMin: number, expectedMax: number): boolean {
  return Number.isInteger(amount) && amount >= expectedMin && amount <= expectedMax
}
