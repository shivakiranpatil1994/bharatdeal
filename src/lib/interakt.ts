import axios from 'axios'

const BASE_URL = 'https://api.interakt.ai/v1/public/message/'

function headers() {
  return {
    Authorization: `Basic ${process.env.INTERAKT_API_KEY}`,
    'Content-Type': 'application/json',
  }
}

export async function sendWhatsApp(
  phoneNumber: string,
  templateName: string,
  bodyValues: string[]
) {
  await axios.post(
    BASE_URL,
    {
      countryCode: '+91',
      phoneNumber,
      callbackData: 'bharatdeal',
      type: 'Template',
      template: {
        name: templateName,
        languageCode: 'en',
        bodyValues,
      },
    },
    { headers: headers() }
  )
}

export async function sendOrderConfirmation(
  phone: string,
  buyerName: string,
  orderId: string,
  productName: string,
  amountINR: string
) {
  return sendWhatsApp(phone, 'order_confirmation', [
    buyerName,
    orderId,
    productName,
    amountINR,
  ])
}

export async function sendNewOrderToManufacturer(
  phone: string,
  manufacturerName: string,
  orderId: string,
  productName: string,
  quantity: string,
  buyerCity: string
) {
  return sendWhatsApp(phone, 'manufacturer_new_order', [
    manufacturerName,
    orderId,
    productName,
    quantity,
    buyerCity,
  ])
}

export async function sendShipmentUpdate(
  phone: string,
  buyerName: string,
  orderId: string,
  status: string,
  trackingUrl: string
) {
  return sendWhatsApp(phone, 'shipment_update', [
    buyerName,
    orderId,
    status,
    trackingUrl,
  ])
}

export async function sendWhatsAppText(phoneNumber: string, text: string) {
  await axios.post(
    BASE_URL,
    {
      countryCode: '+91',
      phoneNumber,
      callbackData: 'bharatdeal',
      type: 'Text',
      data: { message: text },
    },
    { headers: headers() }
  )
}
