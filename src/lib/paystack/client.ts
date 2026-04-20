declare global {
  interface Window {
    PaystackPop: {
      setup: (options: PaystackOptions) => { openIframe: () => void }
    }
  }
}

interface PaystackOptions {
  key: string
  email: string
  plan?: string
  amount?: number
  currency?: string
  ref?: string
  callback: (response: { reference: string; status: string }) => void
  onClose?: () => void
  metadata?: Record<string, unknown>
}

export function loadPaystackScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.PaystackPop) { resolve(); return }
    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.onload = () => resolve()
    script.onerror = reject
    document.head.appendChild(script)
  })
}

export async function openPaystackCheckout(options: PaystackOptions) {
  await loadPaystackScript()
  const handler = window.PaystackPop.setup(options)
  handler.openIframe()
}
