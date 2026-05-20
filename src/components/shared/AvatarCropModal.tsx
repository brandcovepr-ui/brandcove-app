'use client'

import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { X, ZoomIn, ZoomOut } from 'lucide-react'

interface Props {
  imageSrc: string
  onDone: (blob: Blob) => void
  onCancel: () => void
}

async function getCroppedBlob(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = new Image()
  image.src = imageSrc
  await new Promise<void>(resolve => { image.onload = () => resolve() })

  const size = Math.min(pixelCrop.width, pixelCrop.height, 400)
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const ctx = canvas.getContext('2d')!
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, size, size)

  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('Canvas empty'))), 'image/jpeg', 0.92)
  )
}

export function AvatarCropModal({ imageSrc, onDone, onCancel }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedArea, setCroppedArea] = useState<Area | null>(null)
  const [processing, setProcessing] = useState(false)

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedArea(areaPixels)
  }, [])

  async function handleApply() {
    if (!croppedArea) return
    setProcessing(true)
    const blob = await getCroppedBlob(imageSrc, croppedArea)
    onDone(blob)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Crop your photo</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-700 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Crop canvas */}
        <div className="relative bg-gray-900" style={{ height: 300 }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        {/* Zoom slider */}
        <div className="px-5 pt-4 pb-3">
          <div className="flex items-center gap-3">
            <ZoomOut size={15} className="text-gray-400 shrink-0" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={e => setZoom(Number(e.target.value))}
              className="flex-1 accent-[#6b1d2b] cursor-pointer"
            />
            <ZoomIn size={15} className="text-gray-400 shrink-0" />
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-1.5">
            Drag to reposition · scroll or slide to zoom
          </p>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={processing}
            className="px-5 py-2 text-sm font-medium text-white bg-[#6b1d2b] rounded-lg hover:bg-[#4e1520] transition-colors disabled:opacity-50"
          >
            {processing ? 'Applying…' : 'Apply'}
          </button>
        </div>
      </div>
    </div>
  )
}
