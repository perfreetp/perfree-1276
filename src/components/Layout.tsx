import {
  Calendar,
  Ticket,
  Users,
  Package,
  ClipboardList,
  FileText,
  BarChart3,
  Theater,
  Bell,
} from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '../lib/utils'
import { useAppStore } from '../store'

const navItems = [
  { path: '/', label: '日历总览', icon: Calendar },
  { path: '/events', label: '场次详情', icon: Theater },
  { path: '/personnel', label: '人员排班', icon: Users },
  { path: '/inventory', label: '物资管理', icon: Package },
  { path: '/tickets', label: '票务统计', icon: Ticket },
  { path: '/checklist', label: '现场清单', icon: ClipboardList },
  { path: '/reports', label: '日志报表', icon: FileText },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const todos = useAppStore((s) => s.todos)
  const pendingCount = todos.filter((t) => !t.completed).length

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="w-60 bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col shadow-xl">
        <div className="p-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center shadow-lg">
              <Theater className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">剧场管理系统</h1>
              <p className="text-xs text-slate-400">Theater Manager</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path))
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group',
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md'
                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-white',
                )}
              >
                <Icon
                  className={cn(
                    'w-5 h-5 transition-colors',
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-white',
                  )}
                />
                <span className="font-medium text-sm">{item.label}</span>
                {item.path === '/reports' && pendingCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {pendingCount}
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/50">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
              管
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">管理员</p>
              <p className="text-xs text-slate-400">剧务中心</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <BarChart3 className="w-5 h-5" />
            <span className="text-sm">
              {navItems.find(
                (n) =>
                  location.pathname === n.path ||
                  (n.path !== '/' && location.pathname.startsWith(n.path)),
              )?.label || '剧场管理系统'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <Bell className="w-5 h-5 text-slate-600" />
              {pendingCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto scrollbar-thin p-6">{children}</main>
      </div>
    </div>
  )
}
