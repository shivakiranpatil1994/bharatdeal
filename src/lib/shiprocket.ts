import axios from 'axios'

const BASE_URL = 'https://apiv2.shiprocket.in/v1/external'

let cachedToken: string | null = null
let tokenExpiry: number = 0

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken

  const { data } = await axios.post(`${BASE_URL}/auth/login`, {
    email: process.env.SHIPROCKET_EMAIL,
    password: process.env.SHIPROCKET_PASSWORD,
  })

  cachedToken = data.token
  tokenExpiry = Date.now() + 9 * 60 * 60 * 1000 // 9 hours
  return cachedToken!
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

export interface ShiprocketOrderPayload {
  order_id: string
  order_date: string
  pickup_location: string
  billing_customer_name: string
  billing_address: string
  billing_city: string
  billing_pincode: string
  billing_state: string
  billing_country: string
  billing_phone: string
  order_items: Array<{
    name: string
    sku: string
    units: number
    selling_price: number
  }>
  payment_method: 'Prepaid' | 'COD'
  sub_total: number
  length: number
  breadth: number
  height: number
  weight: number
}

export async function createShiprocketOrder(payload: ShiprocketOrderPayload) {
  const token = await getToken()
  const { data } = await axios.post(`${BASE_URL}/orders/create/adhoc`, payload, {
    headers: authHeaders(token),
  })
  return data
}

export async function trackShipment(awb: string) {
  const token = await getToken()
  const { data } = await axios.get(`${BASE_URL}/courier/track/awb/${awb}`, {
    headers: authHeaders(token),
  })
  return data
}

export async function cancelShiprocketOrder(ids: number[]) {
  const token = await getToken()
  const { data } = await axios.post(
    `${BASE_URL}/orders/cancel`,
    { ids },
    { headers: authHeaders(token) }
  )
  return data
}
