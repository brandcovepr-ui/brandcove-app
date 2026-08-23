'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client'
interface UseInquiryActionsProps {
  profileId: string
  selectedId: string
  onInquiryDeclined?: () => void
}

export type ModalType = 'accept' | 'decline' | 'accept_offer' | 'decline_offer' | null

interface ConfirmModalState {
  type: ModalType
  offerId?: string
}

export function useInquiryActions({ profileId, selectedId, onInquiryDeclined }: UseInquiryActionsProps) {
  const router = useRouter()
  const [sending, setSending] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [declining, setDeclining] = useState(false)
  const [decliningOffer, setDecliningOffer] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState | null>(null)

  const sendReply = async (content: string, onSuccess: () => void) => {
    if (!content.trim()) return
    setSending(true)
    setActionError(null)

    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase.from('messages').insert({
      inquiry_id: selectedId,
      sender_id: profileId,
      content: content.trim(),
    })

    setSending(false)

    if (error) {
      setActionError(error.message)
      throw content
    }

    onSuccess()
    router.refresh()
  }

  const confirmAction = async () => {
    if (!confirmModal) return
    const supabase = getSupabaseBrowserClient()
    setActionError(null)

    try {
      if (confirmModal.type === 'accept') {
        setAccepting(true)
        const { error } = await supabase
          .from('inquiries')
          .update({ status: 'accepted' })
          .eq('id', selectedId)
        if (error) throw error
      } 

      else if (confirmModal.type === 'decline') {
        setDeclining(true)
        const { error } = await supabase
          .from('inquiries')
          .update({ status: 'declined' })
          .eq('id', selectedId)
        if (error) throw error
        onInquiryDeclined?.()
      } 

      else if (confirmModal.type === 'accept_offer' && confirmModal.offerId) {
        setAccepting(true)
        const { error } = await supabase
          .from('offers')
          .update({ status: 'accepted' })
          .eq('id', confirmModal.offerId)
        if (error) throw error
      } 

      else if (confirmModal.type === 'decline_offer' && confirmModal.offerId) {
        setDecliningOffer(true)
        const { error } = await supabase
          .from('offers')
          .update({ status: 'declined' })
          .eq('id', confirmModal.offerId)
        if (error) throw error
      }

      setConfirmModal(null)
      router.refresh()
    } catch (err: any) {
      setActionError(err.message || 'An unexpected error occurred')
    } finally {
      setAccepting(false)
      setDeclining(false)
      setDecliningOffer(false)
    }
  }

  return {
    sending,
    accepting,
    declining,
    decliningOffer,
    actionError,
    confirmModal,
    setActionError,
    setConfirmModal,
    sendReply,
    confirmAction,
  }
}