import type { ReactNode } from 'react'

type HubLayoutProps = {
  leftPane: ReactNode    // Cột 1: Danh sách hội thoại
  centerPane: ReactNode  // Cột 2: Khung chat
  rightPane: ReactNode   // Cột 3: Phiếu đơn nháp
}

/**
 * HubLayout – Shell 3 cột cố định full-height
 * Bắt chước layout ChatbotX: ConversationList | MessageThread | OrderPanel
 */
export default function HubLayout({ leftPane, centerPane, rightPane }: HubLayoutProps) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0f1117]">
      {/* Header toàn trang */}
      <div className="flex flex-col w-full">
        <header className="flex items-center px-4 h-12 bg-[#161822] border-b border-white/10 shrink-0">
          <span className="text-sm font-semibold text-white/80 tracking-wide">
            📦 Gom Đơn Hub
          </span>
          <span className="ml-2 text-xs text-white/30">· Hộp thư đa kênh</span>
        </header>

        {/* 3 cột chính */}
        <div className="flex flex-1 min-h-0">
          {/* CỘT 1 – Danh sách hội thoại (280px cố định) */}
          <aside className="w-[280px] shrink-0 border-r border-white/10 overflow-y-auto bg-[#161822]">
            {leftPane}
          </aside>

          {/* CỘT 2 – Khung chat (flex-1 chiếm phần còn lại) */}
          <main className="flex-1 flex flex-col min-w-0 bg-[#0f1117]">
            {centerPane}
          </main>

          {/* CỘT 3 – Phiếu đơn nháp (320px cố định) */}
          <aside className="w-[320px] shrink-0 border-l border-white/10 overflow-y-auto bg-[#161822]">
            {rightPane}
          </aside>
        </div>
      </div>
    </div>
  )
}
