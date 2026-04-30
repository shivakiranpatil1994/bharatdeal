import axios from 'axios'

const BASE_URL = 'https://api.gokwik.co/v1'

export interface RTOScoreParams {
  phone: string
  pincode: string
  orderAmountPaise: number
  paymentMethod: string
}

export interface RTOScoreResult {
  score: number        // 0-100, higher = higher risk
  riskLevel: 'low' | 'medium' | 'high'
  requiresDeposit: boolean
}

export async function getRTOScore(params: RTOScoreParams): Promise<RTOScoreResult> {
  try {
    const { data } = await axios.post(
      `${BASE_URL}/risk/score`,
      {
        merchant_id: process.env.GOKWIK_MERCHANT_ID,
        phone: params.phone,
        pincode: params.pincode,
        order_amount: params.orderAmountPaise / 100,
        payment_method: params.paymentMethod,
      },
      {
        headers: {
          'x-api-key': process.env.GOKWIK_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    )

    const score: number = data.risk_score ?? 50
    const riskLevel: 'low' | 'medium' | 'high' =
      score < 30 ? 'low' : score < 60 ? 'medium' : 'high'

    return {
      score,
      riskLevel,
      requiresDeposit: score > 60,
    }
  } catch {
    // On API failure, default to medium risk — do NOT block order
    return { score: 50, riskLevel: 'medium', requiresDeposit: false }
  }
}
