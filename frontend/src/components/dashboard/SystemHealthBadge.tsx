export const SystemHealthBadge = () => {
  return (
    <div className="status-badge status-operational mb-8">
      <div className="w-2 h-2 rounded-full bg-green-500 pulse"></div>
      All Systems Operational
      <span className="text-slate-400 text-xs">Last check: 2s ago</span>
    </div>
  )
}
