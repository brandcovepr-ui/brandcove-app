'use client'

import { useRef, useState } from 'react'
import { Upload, X } from 'lucide-react'

const MAX_FILES = 6
const MAX_FILE_SIZE_MB = 50

interface StepFourProps {
  workFiles: File[]
  setWorkFiles: React.Dispatch<React.SetStateAction<File[]>>
  onNext: () => void
}

export function StepFourWork({ workFiles, setWorkFiles, onNext }: StepFourProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string>('')

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('')
    const selectedFiles = Array.from(e.target.files || [])
    if (!selectedFiles.length) return

    const remaining = MAX_FILES - workFiles.length
    if (remaining <= 0) {
      setError(`You have reached the maximum limit of ${MAX_FILES} files.`)
      return
    }

    const filesToAdd = selectedFiles.slice(0, remaining)
    const oversized = filesToAdd.find((f) => f.size > MAX_FILE_SIZE_MB * 1024 * 1024)

    if (oversized) {
      setError(`"${oversized.name}" exceeds the ${MAX_FILE_SIZE_MB}MB file limit.`)
      return
    }

    setWorkFiles((prev) => [...prev, ...filesToAdd])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeFile = (index: number) => {
    setWorkFiles((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <>
      <h1 className="mb-1 font-editorial text-2xl text-gray-900 sm:text-3xl">Show your work</h1>
      <p className="mb-6 text-sm text-gray-500">Upload up to {MAX_FILES} work samples (images, PDFs, or videos).</p>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,video/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={workFiles.length >= MAX_FILES}
        className="mb-4 flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-8 transition-colors hover:border-gray-400 hover:bg-gray-50 disabled:opacity-50"
      >
        <Upload size={20} className="text-gray-400" />
        <p className="text-sm text-gray-500">
          {workFiles.length >= MAX_FILES ? 'Maximum files selected' : 'Click to select local files'}
        </p>
      </button>

      {error && <p className="mb-3 text-xs text-red-500">{error}</p>}

      {workFiles.length > 0 && (
        <div className="mb-5 space-y-2">
          {workFiles.map((file, i) => (
            <div key={`${file.name}-${i}`} className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2.5">
              <span className="flex-1 truncate text-xs text-gray-700">{file.name}</span>
              <span className="text-[10px] text-gray-400">{(file.size / (1024 * 1024)).toFixed(1)} MB</span>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onNext}
        className="w-full rounded-full bg-gray-900 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800"
      >
        {workFiles.length > 0 ? 'Continue' : 'Skip for now'}
      </button>
    </>
  )
}