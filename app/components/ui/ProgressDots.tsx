export function ProgressDots({ current, total, onDotClick }: { current: number; total: number; onDotClick: (step: number) => void }) {
  return (
    <div className="flex gap-1.5 mb-4 mt-6">
      {Array.from({ length: total }, (_, i) => {
        const stepNum = i + 1
        const isPast = stepNum < current
        const isCurrent = stepNum === current
        return (
          <button
            key={i}
            type="button"
            onClick={() => isPast && onDotClick(stepNum)}
            disabled={!isPast}
            className={`w-2 h-2 rounded-full transition-colors ${
              isCurrent || isPast ? 'bg-gray-900' : 'bg-gray-300'
            } ${isPast ? 'cursor-pointer hover:bg-gray-600' : 'cursor-default'}`}
          />
        )
      })}
    </div>
  )
}
