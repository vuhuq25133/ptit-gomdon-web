import { useState, useEffect } from 'react'

export type ConversationItem = {
  id: number
  channel: string
  channel_conversation_id: string
  customer_id: number | null
  customer_name: string
  customer_avatar: string
  customer_phone: string | null
  inbox_link: string
  last_message: string | null
  last_message_at: string | null
  order_id: number | null
  order_code: string | null
  order_status: 'draft' | 'processing' | null
  total_amount: string | number | null
}

type Props = {
  activeConvId: number | null
  onSelect: (convId: number, customerId: number | null, convData?: ConversationItem) => void
}

// Dữ liệu mẫu dự phòng (khi Node backend chưa bật hoặc demo offline)
const FALLBACK_CONVERSATIONS: ConversationItem[] = [
  {
    id: 1,
    channel: 'facebook',
    channel_conversation_id: 'PSID_99887766',
    customer_id: 1,
    customer_name: 'Nguyễn Văn An',
    customer_avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces',
    customer_phone: '0905111222',
    inbox_link: 'https://business.facebook.com/latest/inbox/messenger?selected_item_id=PSID_99887766',
    last_message: 'Shop ơi ship cho mình 1 áo polo đen size L về 45 Lê Duẩn, Đà Nẵng nhé, sđt 0905111222',
    last_message_at: new Date(Date.now() - 5 * 60000).toISOString(),
    order_id: 101,
    order_code: 'ORD-FB-20261019-9988',
    order_status: 'draft',
    total_amount: 250000
  },
  {
    id: 2,
    channel: 'facebook',
    channel_conversation_id: 'PSID_11223344',
    customer_id: 2,
    customer_name: 'Trần Thu Trang',
    customer_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces',
    customer_phone: '0988776655',
    inbox_link: 'https://business.facebook.com/latest/inbox/messenger?selected_item_id=PSID_11223344',
    last_message: 'Em nhận được áo rồi nha shop, vải đẹp lắm ạ!',
    last_message_at: new Date(Date.now() - 35 * 60000).toISOString(),
    order_id: 102,
    order_code: 'ORD-FB-20261019-1122',
    order_status: 'processing',
    total_amount: 320000
  },
  {
    id: 3,
    channel: 'facebook',
    channel_conversation_id: 'PSID_55667788',
    customer_id: null,
    customer_name: 'Lê Hoàng Long',
    customer_avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop&crop=faces',
    customer_phone: null,
    inbox_link: 'https://business.facebook.com/latest/inbox/messenger?selected_item_id=PSID_55667788',
    last_message: 'Shop ơi mẫu polo trắng còn size XL không?',
    last_message_at: new Date(Date.now() - 120 * 60000).toISOString(),
    order_id: null,
    order_code: null,
    order_status: null,
    total_amount: null
  }
]

export default function ConversationList({ activeConvId, onSelect }: Props) {
  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [filterTab, setFilterTab] = useState<'all' | 'draft' | 'processing' | 'no_order'>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/conversations')
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data && json.data.length > 0) {
          setConversations(json.data)
          return
        }
      }
      setConversations(FALLBACK_CONVERSATIONS)
    } catch {
      setConversations(FALLBACK_CONVERSATIONS)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConversations()
    // Auto-refresh mỗi 4 giây (polling nhẹ)
    const interval = setInterval(fetchConversations, 4000)
    return () => clearInterval(interval)
  }, [])

  // Tự động chọn cuộc hội thoại đầu tiên nếu chưa có mục nào active
  useEffect(() => {
    if (!activeConvId && conversations.length > 0) {
      onSelect(conversations[0].id, conversations[0].customer_id, conversations[0])
    }
  }, [conversations, activeConvId, onSelect])

  const filteredConversations = conversations.filter((item) => {
    // 1. Lọc theo tab
    if (filterTab === 'draft' && item.order_status !== 'draft') return false
    if (filterTab === 'processing' && item.order_status !== 'processing') return false
    if (filterTab === 'no_order' && item.order_status !== null) return false

    // 2. Lọc theo từ khóa tìm kiếm
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const matchName = item.customer_name?.toLowerCase().includes(q)
      const matchPhone = item.customer_phone?.includes(q)
      const matchMsg = item.last_message?.toLowerCase().includes(q)
      return matchName || matchPhone || matchMsg
    }
    return true
  })

  const formatTime = (isoString: string | null) => {
    if (!isoString) return ''
    const d = new Date(isoString)
    const now = new Date()
    const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000)
    if (diffMin < 1) return 'vừa xong'
    if (diffMin < 60) return `${diffMin}p`
    const diffHours = Math.floor(diffMin / 60)
    if (diffHours < 24) return `${diffHours}h`
    return `${d.getDate()}/${d.getMonth() + 1}`
  }

  return (
    <div className="flex flex-col h-full bg-[#111625] text-slate-200">
      {/* Header Cột 1 */}
      <div className="p-3 border-b border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Hộp thư hội thoại ({filteredConversations.length})
            </h2>
          </div>
          <button
            onClick={() => { setLoading(true); fetchConversations() }}
            className="text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition"
            title="Làm mới danh sách"
          >
            ↻
          </button>
        </div>

        {/* Ô tìm kiếm */}
        <div className="relative mb-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm tên, SĐT hoặc nội dung..."
            className="w-full bg-[#0d111d] text-xs text-slate-200 placeholder-slate-500 rounded-lg px-2.5 py-1.5 pl-7 border border-slate-700/60 focus:outline-none focus:border-indigo-500 transition"
          />
          <span className="absolute left-2.5 top-1.5 text-slate-500 text-xs">🔍</span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1.5 text-slate-400 hover:text-white text-xs"
            >
              ×
            </button>
          )}
        </div>

        {/* Tabs bộ lọc */}
        <div className="flex items-center gap-1 text-[11px]">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-2 py-0.5 rounded-md font-medium transition ${
              filterTab === 'all'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setFilterTab('draft')}
            className={`px-2 py-0.5 rounded-md font-medium transition flex items-center gap-1 ${
              filterTab === 'draft'
                ? 'bg-amber-600 text-white'
                : 'text-amber-400/80 hover:bg-slate-800/60'
            }`}
          >
            <span>🟡</span> Chờ chốt
          </button>
          <button
            onClick={() => setFilterTab('processing')}
            className={`px-2 py-0.5 rounded-md font-medium transition flex items-center gap-1 ${
              filterTab === 'processing'
                ? 'bg-emerald-600 text-white'
                : 'text-emerald-400/80 hover:bg-slate-800/60'
            }`}
          >
            <span>✅</span> Đã chốt
          </button>
          <button
            onClick={() => setFilterTab('no_order')}
            className={`px-2 py-0.5 rounded-md font-medium transition ${
              filterTab === 'no_order'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:bg-slate-800/60'
            }`}
          >
            Tư vấn
          </button>
        </div>
      </div>

      {/* Danh sách các cuộc trò chuyện */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
        {loading && conversations.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 animate-pulse">
            Đang tải danh sách hội thoại...
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            Không có cuộc hội thoại nào phù hợp.
          </div>
        ) : (
          filteredConversations.map((item) => {
            const isSelected = activeConvId === item.id

            return (
              <div
                key={item.id}
                onClick={() => onSelect(item.id, item.customer_id, item)}
                className={`p-3 cursor-pointer transition relative group ${
                  isSelected
                    ? 'bg-indigo-950/40 border-l-4 border-indigo-500'
                    : 'hover:bg-slate-800/30 border-l-4 border-transparent'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {/* Avatar người nhắn */}
                  <div className="relative shrink-0">
                    <img
                      src={item.customer_avatar}
                      alt={item.customer_name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-700/60 bg-slate-800"
                      onError={(e) => {
                        // Fallback nếu ảnh bị lỗi
                        (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${item.channel_conversation_id}`
                      }}
                    />
                    {/* Badge kênh Facebook */}
                    <span
                      className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#1877F2] text-white flex items-center justify-center text-[9px] font-bold shadow"
                      title="Kênh Facebook Messenger"
                    >
                      f
                    </span>
                  </div>

                  {/* Nội dung tóm tắt */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h3
                        className={`text-xs font-semibold truncate ${
                          isSelected ? 'text-indigo-200' : 'text-slate-200'
                        }`}
                      >
                        {item.customer_name}
                      </h3>
                      <span className="text-[10px] text-slate-500 shrink-0">
                        {formatTime(item.last_message_at)}
                      </span>
                    </div>

                    {/* SĐT (nếu có) */}
                    {item.customer_phone && (
                      <p className="text-[10px] text-indigo-400 font-mono mb-0.5">
                        📞 {item.customer_phone}
                      </p>
                    )}

                    {/* Tin nhắn rút gọn */}
                    <p className="text-[11px] text-slate-400 truncate mb-1.5 line-clamp-1">
                      {item.last_message || 'Chưa có nội dung tin nhắn'}
                    </p>

                    {/* Footer thẻ: Badge đơn hàng & Link Meta */}
                    <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800/40">
                      {/* Trạng thái đơn hàng */}
                      {item.order_status === 'draft' ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 font-medium border border-amber-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                          Đơn nháp (Chờ chốt)
                        </span>
                      ) : item.order_status === 'processing' ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          Đã chốt đơn
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">Chưa có đơn</span>
                      )}

                      {/* Nút mở hộp thư Meta Business Suite (học từ ChatbotX) */}
                      {item.inbox_link && (
                        <a
                          href={item.inbox_link}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="opacity-0 group-hover:opacity-100 text-[10px] text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-0.5 transition"
                          title="Mở trong Meta Business Suite"
                        >
                          Meta ↗
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
