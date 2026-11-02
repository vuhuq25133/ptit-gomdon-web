type BadgeProps = {
  status: 'draft' | 'processing' | 'pending' | string
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  draft:      { label: 'Chờ chốt 🟡', className: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  processing: { label: 'Đã chốt ✅',  className: 'bg-green-500/15 text-green-400 border-green-500/30' },
  pending:    { label: 'Chờ xử lý 🔴', className: 'bg-red-500/15 text-red-400 border-red-500/30' },
}

export default function Badge({ status }: BadgeProps) {
  const cfg = STATUS_MAP[status] ?? { label: status, className: 'bg-white/10 text-white/60 border-white/20' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}
