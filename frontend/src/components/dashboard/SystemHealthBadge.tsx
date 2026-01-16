export const SystemHealthBadge = () => {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full text-green-400 mb-8">
      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
      <span className="font-semibold text-sm">All Systems Operational</span>
      <span className="text-slate-400 text-xs">Last check: 2s ago</span>
    </div>
  )
}
