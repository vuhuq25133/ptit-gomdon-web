import { useState, useCallback } from 'react'
import HubLayout from '../layout/HubLayout'
import ConversationList, { type ConversationItem } from '../components/conversation-list/ConversationList'
import MessageThread from '../components/message-thread/MessageThread'
import OrderPanel from '../components/order-panel/OrderPanel'

/**
 * HubPage – Màn hình Hộp thư gom Đa kênh 3 Cột (chuẩn Pancake / ChatbotX)
 * Quản lý state tập trung cho 3 cột:
 * - activeConvId: ID phiên hội thoại đang chọn
 * - activeCustomerId: ID khách hàng
 * - activeConv: Toàn bộ thông tin hội thoại (Nickname, Avatar, Order status)
 */
export default function HubPage() {
  const [activeConvId, setActiveConvId] = useState<number | null>(null)
  const [activeCustomerId, setActiveCustomerId] = useState<number | null>(null)
  const [activeConv, setActiveConv] = useState<ConversationItem | null>(null)

  const handleSelectConversation = useCallback((convId: number, customerId: number | null, convData?: ConversationItem) => {
    setActiveConvId(convId)
    setActiveCustomerId(customerId)
    if (convData) {
      setActiveConv(convData)
    }
  }, [])

  const handleOrderConfirmed = useCallback(() => {
    if (activeConv) {
      setActiveConv((prev) => (prev ? { ...prev, order_status: 'processing' } : null))
    }
  }, [activeConv])

  return (
    <HubLayout
      leftPane={
        <ConversationList
          activeConvId={activeConvId}
          onSelect={handleSelectConversation}
        />
      }
      centerPane={
        <MessageThread 
          conversationId={activeConvId} 
          activeConversation={activeConv} 
        />
      }
      rightPane={
        <OrderPanel 
          customerId={activeCustomerId} 
          activeConversation={activeConv}
          onOrderConfirmed={handleOrderConfirmed}
        />
      }
    />
  )
}
