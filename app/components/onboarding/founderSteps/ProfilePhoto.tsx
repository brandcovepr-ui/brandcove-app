'use client'

import { useRef } from 'react'
import { Camera, UserCircle2 } from 'lucide-react'
import { ProgressDots } from '../../ui/ProgressDots'

interface Props {
  avatarPreview: string | null
  totalSteps: number
  onFileSelect: (file: File) => void
  onNext: () => void
  onDotClick: (step: number) => void
}

export function Step2ProfilePhoto({
  avatarPreview,
  totalSteps,
  onFileSelect,
  onNext,
  onDotClick,
}: Props) {
  const avatarInputRef = useRef<HTMLInputElement>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onFileSelect(file)
    if (avatarInputRef.current) avatarInputRef.current.value = ''
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-[28px] font-editorial font-thin text-gray-900 mb-1 leading-tight">
        Add a profile photo
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        A photo helps creatives know who they&apos;re working with. You can skip this and add one later.
      </p>

      <input
        ref={avatarInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className="hidden"
      />

      <div className="flex flex-col items-center gap-5 mb-8">
        <button
          type="button"
          onClick={() => avatarInputRef.current?.click()}
          className="relative w-32 h-32 rounded-full overflow-hidden bg-[#f0e8ea] border-2 border-dashed border-[#6b1d2b]/30 hover:border-[#6b1d2b] transition-colors group focus:outline-none"
        >
          {avatarPreview ? (
            <>
              <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera size={20} className="text-white" />
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-1.5">
              <UserCircle2 size={36} className="text-[#6b1d2b]/40" />
              <span className="text-[10px] text-[#6b1d2b]/60 font-medium">Upload photo</span>
            </div>
          )}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="text-sm font-medium text-[#6b1d2b] hover:text-[#4e1520] transition-colors"
          >
            {avatarPreview ? 'Change photo' : 'Choose photo'}
          </button>
          <p className="text-xs text-gray-400 mt-1">JPG, PNG or WebP · max 5 MB</p>
        </div>
      </div>

      <ProgressDots current={2} total={totalSteps} onDotClick={onDotClick} />

      <button
        type="button"
        onClick={onNext}
        className="w-full bg-gray-900 text-white rounded-full py-3 text-sm font-medium hover:bg-gray-800 transition-colors"
      >
        {avatarPreview ? 'Continue' : 'Skip for now'}
      </button>
    </div>
  )
}