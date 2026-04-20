import { format } from 'date-fns'
import { Message } from '@/lib/types'

interface Props {
  message: Message
  isOwn: boolean
}

export function ChatMessage({ message, isOwn }: Props) {
  const firstName = (message.sender as any)?.full_name?.split(' ')[0] || 'User'
  const time = format(new Date(message.created_at), 'h:mm aa')

  return (
    <div className={`flex flex-col gap-1 ${isOwn ? 'items-end' : 'items-start'}`}>
      <p className="text-[11px] text-gray-400 px-1">
        {isOwn ? `${time}  You` : `${firstName}  ${time}`}
      </p>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isOwn
            ? 'bg-[#6b1d2b] text-white rounded-br-sm'
            : 'bg-white text-gray-900 border border-gray-100 rounded-bl-sm shadow-sm'
        }`}
      >
        {message.content}
      </div>
    </div>
  )
}
