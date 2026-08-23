import { AlertCircle } from 'lucide-react'
import { ConfirmModalState } from '@/lib/types/inquiry'

interface ConfirmationModalProps {
  modal: ConfirmModalState
  actionError: string
  accepting: boolean
  declining: boolean
  decliningOffer: boolean
  onClose: () => void
  onConfirm: () => void
}

export function ConfirmationModal({ modal, actionError, accepting, declining, decliningOffer, onClose, onConfirm }: ConfirmationModalProps) {
  const isLoading = accepting || declining || decliningOffer

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        {modal.type === 'accept' && (
          <>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Accept this inquiry?</h2>
            <p className="text-sm text-gray-500 mb-6">This will open a conversation with the founder so you can discuss the project and next steps.</p>
          </>
        )}
        {modal.type === 'decline' && (
          <>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Decline this inquiry?</h2>
            <p className="text-sm text-gray-500 mb-6">The founder will be notified that you are not available for this project. This cannot be undone.</p>
          </>
        )}
        {modal.type === 'accept_offer' && (
          <>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Accept this offer?</h2>
            <p className="text-sm text-gray-500 mb-6">You are agreeing to the terms set by the founder. The founder will be notified and you can continue chatting.</p>
          </>
        )}
        {modal.type === 'decline_offer' && (
          <>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Decline this offer?</h2>
            <p className="text-sm text-gray-500 mb-6">Declining will close the chat. The founder will need to send a new offer to reopen it.</p>
          </>
        )}

        {actionError && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-600">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <p>{actionError}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} disabled={isLoading} className="flex-1 border border-gray-200 rounded-full py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors">
            Go back
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 rounded-full py-2.5 text-sm font-medium transition-colors text-white ${
              modal.type === 'decline' || modal.type === 'decline_offer' ? 'bg-red-500 hover:bg-red-600' : 'bg-[#6b1d2b] hover:bg-[#4e1520]'
            } disabled:opacity-50`}
          >
            {accepting
              ? 'Accepting…'
              : declining || decliningOffer
              ? 'Declining…'
              : modal.type === 'accept'
              ? 'Yes, accept'
              : modal.type === 'decline'
              ? 'Yes, decline'
              : modal.type === 'accept_offer'
              ? 'Accept offer'
              : 'Decline offer'}
          </button>
        </div>
      </div>
    </div>
  )
}