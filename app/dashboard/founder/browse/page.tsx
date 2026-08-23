import { getCreativesAction } from '@/app/actions/founder'
import { DiscoverClient } from './DiscoverClient'

export default async function DiscoverPage() {
  const initialData = await getCreativesAction()

  return <DiscoverClient initialData={initialData} />
}