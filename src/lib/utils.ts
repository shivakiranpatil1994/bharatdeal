import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatINR(paise: number): string {
  const rupees = paise / 100
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rupees)
}

export function getPincodeInfo(pincode: string): Promise<{ city: string; state: string } | null> {
  return fetch(`https://api.postalpincode.in/pincode/${pincode}`)
    .then((r) => r.json())
    .then((data) => {
      const post = data?.[0]?.PostOffice?.[0]
      if (!post) return null
      return { city: post.District, state: post.State }
    })
    .catch(() => null)
}
