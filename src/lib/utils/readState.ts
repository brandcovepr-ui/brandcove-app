const STORAGE_KEY = 'brandcove_read_state'

function load(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

export function markInquiryAsRead(inquiryId: string): void {
  if (typeof window === 'undefined') return
  const state = load()
  state[inquiryId] = new Date().toISOString()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function getReadStateMap(): Record<string, string> {
  return load()
}
