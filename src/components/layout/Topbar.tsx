'use client'

import { useState } from 'react'
import { Menu, Moon, Sun, Bell, RefreshCw } from 'lucide-react'
import { useApp, type Role } from '@/providers/AppProvider'
import { cn } from '@/lib/utils'

const roles: Role[] = [
  'Super Admin', 'Org Admin', 'Event Manager', 'Operations Manager',
  'Field Staff', 'Finance Officer', 'Supplier', 'Auditor',
]

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { theme, toggleTheme, role, setRole, userName } = useApp()
  const [showRoles, setShowRoles] = useState(false)

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-white px-4 dark:bg-navy-900 dark:border-navy-800">
      <button className="btn-ghost lg:hidden" onClick={onMenuClick} aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex-1" />

      <button
        className="btn-ghost"
        onClick={toggleTheme}
        aria-label="Toggle theme"
        title="Toggle dark mode"
      >
        {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
      </button>

      <button className="btn-ghost relative" aria-label="Notifications">
        <Bell className="h-5 w-5" />
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
      </button>

      <div className="relative">
        <button
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-navy-800"
          onClick={() => setShowRoles(s => !s)}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-700 text-sm font-semibold text-white">
            {userName.charAt(0)}
          </div>
          <div className="hidden text-left sm:block">
            <div className="text-sm font-medium text-slate-800 dark:text-slate-100">{userName}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{role}</div>
          </div>
        </button>
        {showRoles && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowRoles(false)} />
            <div className="absolute right-0 z-50 mt-2 w-56 rounded-lg border bg-white p-2 shadow-lg dark:bg-navy-900 dark:border-navy-700">
              <div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Switch Role (Demo)
              </div>
              {roles.map(r => (
                <button
                  key={r}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm',
                    r === role
                      ? 'bg-accent-50 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-navy-800',
                  )}
                  onClick={() => { setRole(r); setShowRoles(false) }}
                >
                  {r === role && <RefreshCw className="h-3 w-3" />}
                  {r}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </header>
  )
}
