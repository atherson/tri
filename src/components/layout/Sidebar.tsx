import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, CalendarDays, Building2, Truck, Package,
  FileText, AlertTriangle, ClipboardCheck, ShieldAlert, Receipt,
  BarChart3, ScrollText, Settings, ScanLine, Boxes, Wrench,
} from 'lucide-react'
import { useApp, type Role } from '@/providers/AppProvider'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  roles?: Role[]
}

const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/events', label: 'Events', icon: CalendarDays, roles: ['Super Admin', 'Org Admin', 'Event Manager', 'Operations Manager', 'Finance Officer', 'Auditor'] },
  { to: '/venues', label: 'Venues', icon: Building2, roles: ['Super Admin', 'Org Admin', 'Event Manager', 'Operations Manager', 'Auditor'] },
  { to: '/suppliers', label: 'Suppliers', icon: Truck, roles: ['Super Admin', 'Org Admin', 'Event Manager', 'Operations Manager', 'Finance Officer', 'Supplier', 'Auditor'] },
  { to: '/equipment', label: 'Equipment', icon: Boxes, roles: ['Super Admin', 'Org Admin', 'Event Manager', 'Operations Manager', 'Field Staff', 'Auditor'] },
  { to: '/contracts', label: 'Rental Contracts', icon: FileText, roles: ['Super Admin', 'Org Admin', 'Event Manager', 'Operations Manager', 'Finance Officer', 'Supplier', 'Auditor'] },
  { to: '/assignments', label: 'Assignments', icon: Package, roles: ['Super Admin', 'Org Admin', 'Event Manager', 'Operations Manager', 'Field Staff', 'Auditor'] },
  { to: '/movements', label: 'Movements', icon: Wrench, roles: ['Super Admin', 'Org Admin', 'Event Manager', 'Operations Manager', 'Field Staff', 'Auditor'] },
  { to: '/scanner', label: 'QR Scanner', icon: ScanLine, roles: ['Super Admin', 'Org Admin', 'Operations Manager', 'Field Staff'] },
  { to: '/alerts', label: 'Sync Alerts', icon: AlertTriangle },
  { to: '/approvals', label: 'Approvals', icon: ClipboardCheck, roles: ['Super Admin', 'Org Admin', 'Event Manager', 'Finance Officer', 'Auditor'] },
  { to: '/incidents', label: 'Incidents', icon: ShieldAlert, roles: ['Super Admin', 'Org Admin', 'Event Manager', 'Operations Manager', 'Field Staff', 'Auditor'] },
  { to: '/invoices', label: 'Invoices', icon: Receipt, roles: ['Super Admin', 'Org Admin', 'Finance Officer', 'Supplier', 'Auditor'] },
  { to: '/reports', label: 'Reports', icon: BarChart3, roles: ['Super Admin', 'Org Admin', 'Event Manager', 'Finance Officer', 'Auditor'] },
  { to: '/audit', label: 'Audit Logs', icon: ScrollText, roles: ['Super Admin', 'Org Admin', 'Auditor'] },
  { to: '/settings', label: 'Settings', icon: Settings, roles: ['Super Admin', 'Org Admin'] },
]

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { role } = useApp()
  const location = useLocation()

  const visibleItems = navItems.filter(item => !item.roles || item.roles.includes(role))

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={onClose} />
      )}
      <aside className={cn(
        'fixed left-0 top-0 z-40 h-full w-64 transform bg-navy-900 text-slate-200 transition-transform lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full',
      )}>
        <div className="flex h-16 items-center gap-2 border-b border-navy-800 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500/20">
            <ScanLine className="h-5 w-5 text-accent-400" />
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight text-white">EventSync</div>
            <div className="text-[10px] uppercase tracking-widest text-navy-300">Rental & Asset Sync</div>
          </div>
        </div>
        <nav className="flex flex-col gap-0.5 overflow-y-auto p-3" style={{ maxHeight: 'calc(100vh - 4rem)' }}>
          {visibleItems.map(item => {
            const active = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to))
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-accent-500/15 text-accent-300'
                    : 'text-slate-300 hover:bg-navy-800 hover:text-white',
                )}
              >
                <item.icon className="h-4.5 w-4.5 shrink-0" style={{ width: '1.125rem', height: '1.125rem' }} />
                {item.label}
              </NavLink>
            )
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-navy-800 p-4">
          <div className="text-xs text-navy-400">EventSync v1.0</div>
          <div className="text-xs text-navy-500">Demo Environment</div>
        </div>
      </aside>
    </>
  )
}
