'use client'

import { useRef, useState } from 'react'
import { Camera, UserCircle2 } from 'lucide-react'
import { AvatarCropModal } from '../../ui/AvatarCropModal'

interface StepTwoProps {
  avatarBlob: Blob | null
  setAvatarBlob: (blob: Blob | null) => void
  onNext: () => void
}

export function StepTwoAvatar({ avatarBlob, setAvatarBlob, onNext }: StepTwoProps) {
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => setCropSrc(reader.result as string)
    reader.readAsDataURL(file)

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleCropDone = (blob: Blob) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setAvatarBlob(blob)
    setPreviewUrl(URL.createObjectURL(blob))
    setCropSrc(null)
  }

  return (
    <>
      {cropSrc && (
        <AvatarCropModal
          imageSrc={cropSrc}
          onDone={handleCropDone}
          onCancel={() => setCropSrc(null)}
        />
      )}

      <h1 className="mb-1 font-editorial text-2xl text-gray-900 sm:text-3xl">Add a profile photo</h1>
      <p className="mb-8 text-sm text-gray-500">A clear photo helps founders put a face to your work.</p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="mb-8 flex flex-col items-center gap-5">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="group relative h-32 w-32 overflow-hidden rounded-full border-2 border-dashed border-[#6b1d2b]/30 bg-[#f0e8ea] transition-colors hover:border-[#6b1d2b] focus:outline-none"
        >
          {previewUrl ? (
            <>
              <img src={previewUrl} alt="Avatar preview" className="h-full w-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera size={20} className="text-white" />
              </div>
            </>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1.5">
              <UserCircle2 size={36} className="text-[#6b1d2b]/40" />
              <span className="text-[10px] font-medium text-[#6b1d2b]/60">Upload photo</span>
            </div>
          )}
        </button>
      </div>

      <button
        type="button"
        onClick={onNext}
        className="w-full rounded-full bg-gray-900 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800"
      >
        {avatarBlob ? 'Continue' : 'Skip for now'}
      </button>
    </>
  )
}