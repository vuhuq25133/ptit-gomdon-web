import { useState, useEffect, useRef } from 'react'
import type { ConversationItem } from '../conversation-list/ConversationList'

export type ChatMessage = {
  id: number
  conversation_id: number
  sender_type: 'customer' | 'shop'
  content: string
  has_extracted_order?: boolean
  created_at: string
}

type Props = {
  conversationId: number | null
  activeConversation?: ConversationItem | null
}

const FALLBACK_MESSAGES: Record<number, ChatMessage[]> = {
  1: [
    {
      id: 101,
      conversation_id: 1,
      sender_type: 'customer',
      content: 'Chào shop, áo polo bên mình form rộng hay vừa ạ?',
      has_extracted_order: false,
      created_at: new Date(Date.now() - 15 * 60000).toISOString()
    },
    {
      id: 102,
      conversation_id: 1,
      sender_type: 'shop',
      content: 'Dạ chào bạn An ạ, áo polo form chuẩn regular fit cực kỳ tôn dáng nhé bạn!',
      has_extracted_order: false,
      created_at: new Date(Date.now() - 12 * 60000).toISOString()
    },
    {
      id: 103,
      conversation_id: 1,
      sender_type: 'customer',
      content: 'Shop ơi ship cho mình 1 áo polo đen size L về 45 Lê Duẩn, Đà Nẵng nhé, sđt 0905111222',
      has_extracted_order: true,
      created_at: new Date(Date.now() - 5 * 60000).toISOString()
    },
    {
      id: 104,
      conversation_id: 1,
      sender_type: 'shop',
      content: 'Dạ shop đã trích xuất thông tin đơn nháp của mình, bạn chờ xác nhận chốt đơn nhé!',
      has_extracted_order: false,
      created_at: new Date(Date.now() - 2 * 60000).toISOString()
    }
  ],
  2: [
    {
      id: 201,
      conversation_id: 2,
      sender_type: 'customer',
      content: 'Em nhận được áo rồi nha shop, vải đẹp lắm ạ!',
      has_extracted_order: false,
      created_at: new Date(Date.now() - 35 * 60000).toISOString()
    },
    {
      id: 202,
      conversation_id: 2,
      sender_type: 'shop',
      content: 'Cảm ơn Trang nhiều nha, cần hỗ trợ thêm cứ nhắn shop nha!',
      has_extracted_order: false,
      created_at: new Date(Date.now() - 30 * 60000).toISOString()
    }
  ],
  3: [
    {
      id: 301,
      conversation_id: 3,
      sender_type: 'customer',
      content: 'Shop ơi mẫu polo trắng còn size XL không?',
      has_extracted_order: false,
      created_at: new Date(Date.now() - 120 * 60000).toISOString()
    }
  ]
}

export default function MessageThread({ conversationId, activeConversation }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [inputText, setInputText] = useState<string>('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const fetchMessages = async (silent = false) => {
    if (!conversationId) return
    if (!silent) setLoading(true)
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`)
      if (res.ok) {
        const json = await res.json()
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setMessages(json.data)
          return
        }
      }
      if (!silent) setMessages(FALLBACK_MESSAGES[conversationId] || [])
    } catch {
      if (!silent) setMessages(FALLBACK_MESSAGES[conversationId] || [])
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages(false)
    // Tự động kiểm tra và tải tin nhắn mới của người thật mỗi 3 giây (Auto-polling real-time)
    const interval = setInterval(() => {
      fetchMessages(true)
    }, 3000)

    return () => clearInterval(interval)
  }, [conversationId])

  useEffect(() => {
    // Cuộn xuống tin nhắn mới nhất
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || !conversationId) return

    const textToSend = inputText.trim()
    setInputText('')

    // Optimistic UI update
    const tempMsg: ChatMessage = {
      id: Date.now(),
      conversation_id: conversationId,
      sender_type: 'shop',
      content: textToSend,
      created_at: new Date().toISOString()
    }
    setMessages((prev) => [...prev, tempMsg])

    try {
      // Gọi API Backend: Lưu DB PostgreSQL + Bắn tin nhắn trực tiếp về Facebook của khách
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: textToSend })
      })
      const json = await res.json()
      if (json.success && json.data) {
        // Cập nhật lại với ID thật từ PostgreSQL
        setMessages((prev) => prev.map((m) => (m.id === tempMsg.id ? json.data : m)))
      }
    } catch (err) {
      console.warn('Lỗi gửi tin nhắn qua server, hiển thị trên giao diện local:', err)
    }
  }

  if (!conversationId) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#0b0e17] text-slate-500">
        <span className="text-4xl mb-3">💬</span>
        <p className="text-xs">Chọn một cuộc hội thoại bên trái để bắt đầu xem tin nhắn</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#0b0e17] text-slate-200">
      {/* Header Cột 2 */}
      <div className="p-3 border-b border-slate-800/80 bg-[#111625] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={
              activeConversation?.customer_avatar ||
              `https://api.dicebear.com/7.x/bottts/svg?seed=${conversationId}`
            }
            alt="Customer avatar"
            className="w-9 h-9 rounded-full object-cover border border-slate-700 bg-slate-800"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-100">
                {activeConversation?.customer_name || `Khách hàng #${conversationId}`}
              </h2>
              <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.2 rounded font-medium">
                Facebook Messenger
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              ID: {activeConversation?.channel_conversation_id || `PSID_${conversationId}`}
              {activeConversation?.customer_phone && ` • 📞 ${activeConversation.customer_phone}`}
            </p>
          </div>
        </div>

        {/* Nút mở trong Meta Business Suite Inbox (học từ ChatbotX user-inbox-link) */}
        {activeConversation?.inbox_link && (
          <a
            href={activeConversation.inbox_link}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-white bg-blue-950/40 hover:bg-blue-900/60 border border-blue-800/50 px-2.5 py-1.5 rounded-lg transition"
            title="Mở tin nhắn trực tiếp trên Meta Business Suite"
          >
            <span>Mở trên Meta</span>
            <span>↗</span>
          </a>
        )}
      </div>

      {/* Vùng hiển thị bong bóng chat */}
      <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full text-xs text-slate-500 animate-pulse">
            Đang tải lịch sử tin nhắn...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-slate-500">
            Chưa có tin nhắn nào trong hội thoại này.
          </div>
        ) : (
          messages.map((msg) => {
            const isCustomer = msg.sender_type === 'customer'

            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${isCustomer ? 'justify-start' : 'justify-end'}`}
              >
                {/* Avatar khách */}
                {isCustomer && (
                  <img
                    src={
                      activeConversation?.customer_avatar ||
                      `https://api.dicebear.com/7.x/bottts/svg?seed=${conversationId}`
                    }
                    alt="avatar"
                    className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-700 bg-slate-800"
                  />
                )}

                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-sm ${
                    isCustomer
                      ? 'bg-slate-800 text-slate-200 rounded-bl-xs border border-slate-700/50'
                      : 'bg-indigo-600 text-white rounded-br-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  <div
                    className={`flex items-center gap-1.5 mt-1 text-[9px] ${
                      isCustomer ? 'text-slate-400' : 'text-indigo-200'
                    }`}
                  >
                    <span>
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {msg.has_extracted_order && (
                      <span className="bg-amber-400/20 text-amber-300 px-1 rounded font-medium">
                        🏷️ Đã trích xuất đơn
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Thanh gõ tin nhắn phản hồi khách */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 border-t border-slate-800/80 bg-[#111625] flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Gõ tin nhắn trả lời ${activeConversation?.customer_name || 'khách hàng'}...`}
          className="flex-1 bg-[#0b0e17] text-xs text-slate-200 placeholder-slate-500 rounded-xl px-3 py-2 border border-slate-700 focus:outline-none focus:border-indigo-500 transition"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow flex items-center gap-1"
        >
          <span>Gửi</span>
          <span>➤</span>
        </button>
      </form>
    </div>
  )
}
