interface AvatarProps {
  name?: string | null
  url?: string | null
  size?: 'sm' | 'md' | 'lg'
}

export function Avatar({ name, url, size = 'md' }: AvatarProps) {
  const dim = size === 'lg' ? 'w-12 h-12 text-lg' : size === 'sm' ? 'w-8 h-8 text-xs' : 'w-11 h-11 text-base'
  return (
    <div className={`${dim} rounded-full bg-[#d4a0a8] flex items-center justify-center text-white font-semibold shrink-0 overflow-hidden`}>
      {url ? <img src={url} alt="" className="w-full h-full object-cover" /> : name?.[0]?.toUpperCase() || 'F'}
    </div>
  )
}