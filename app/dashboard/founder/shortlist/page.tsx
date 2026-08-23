import { getShortlistData } from '@/app/actions/founder'
import { ShortlistClient } from './ShortlistClient'

export default async function ShortlistPage() {
  const items = await getShortlistData()

  return <ShortlistClient initialItems={items} />
}