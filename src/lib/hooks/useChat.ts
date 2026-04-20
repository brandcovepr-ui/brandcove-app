'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Message } from '@/lib/types'
import { computeChatAccess, type ChatAccessResult } from '@/lib/chat-access'

export function useChat(inquiryId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [inquiryStatus, setInquiryStatus] = useState<string>('pending')
  const [latestOfferStatus, setLatestOfferStatus] = useState<string | null>(null)

  // Refs so the sendMessage callback always sees the latest values
  // without needing to be recreated on every status change
  const inquiryStatusRef = useRef(inquiryStatus)
  const latestOfferStatusRef = useRef(latestOfferStatus)
  inquiryStatusRef.current = inquiryStatus
  latestOfferStatusRef.current = latestOfferStatus

  useEffect(() => {
    const supabase = createClient()

    async function loadMessages() {
      const { data } = await supabase
        .from('messages')
        .select('*, sender:profiles(id, full_name, avatar_url)')
        .eq('inquiry_id', inquiryId)
        .order('created_at', { ascending: true })
      if (data) setMessages(data as Message[])
      setLoading(false)
    }

    async function loadAccessState() {
      const { data: inquiry } = await supabase
        .from('inquiries')
        .select('status')
        .eq('id', inquiryId)
        .single()
      if (inquiry) setInquiryStatus(inquiry.status)

      const { data: offers } = await supabase
        .from('offers')
        .select('status')
        .eq('inquiry_id', inquiryId)
        .order('created_at', { ascending: false })
        .limit(1)
      setLatestOfferStatus(offers?.[0]?.status ?? null)
    }

    loadMessages()
    loadAccessState()

    // ── Messages realtime (existing) ────────────────────────────────────────
    const messagesChannel = supabase
      .channel(`inquiry-${inquiryId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `inquiry_id=eq.${inquiryId}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from('messages')
            .select('*, sender:profiles(id, full_name, avatar_url)')
            .eq('id', payload.new.id)
            .single()
          if (data) setMessages((prev) => [...prev, data as Message])
        }
      )
      .subscribe()

    // ── Chat access realtime (new) ───────────────────────────────────────────
    const accessChannel = supabase
      .channel(`chat-access-${inquiryId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'inquiries',
          filter: `id=eq.${inquiryId}`,
        },
        (payload) => {
          setInquiryStatus(payload.new.status)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'offers',
          filter: `inquiry_id=eq.${inquiryId}`,
        },
        (payload) => {
          // New offer always becomes the latest
          setLatestOfferStatus(payload.new.status)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'offers',
          filter: `inquiry_id=eq.${inquiryId}`,
        },
        async () => {
          // Re-fetch the latest offer to ensure we have the correct one
          const { data: offers } = await supabase
            .from('offers')
            .select('status')
            .eq('inquiry_id', inquiryId)
            .order('created_at', { ascending: false })
            .limit(1)
          setLatestOfferStatus(offers?.[0]?.status ?? null)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(messagesChannel)
      supabase.removeChannel(accessChannel)
    }
  }, [inquiryId])

  const chatAccess: ChatAccessResult = computeChatAccess({
    inquiryStatus,
    latestOfferStatus,
  })

  const sendMessage = useCallback(
    async (content: string, senderId: string) => {
      const access = computeChatAccess({
        inquiryStatus: inquiryStatusRef.current,
        latestOfferStatus: latestOfferStatusRef.current,
      })
      if (!access.isOpen) {
        console.warn('Chat is locked — message send blocked at UI level')
        return
      }
      const supabase = createClient()
      await supabase.from('messages').insert({
        inquiry_id: inquiryId,
        sender_id: senderId,
        content,
      })
    },
    [inquiryId]
  )

  return { messages, loading, sendMessage, chatAccess }
}
