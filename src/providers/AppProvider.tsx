import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Theme = 'light' | 'dark'
type Role = 'Super Admin' | 'Org Admin' | 'Event Manager' | 'Operations Manager' | 'Field Staff' | 'Finance Officer' | 'Supplier' | 'Auditor'

interface AppContextValue {
  theme: Theme
  toggleTheme: () => void
  role: Role
  setRole: (r: Role) => void
  userName: string
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('eventsync-theme') as Theme) || 'light'
    }
    return 'light'
  })
  const [role, setRole] = useState<Role>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('eventsync-role') as Role) || 'Org Admin'
    }
    return 'Org Admin'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('eventsync-theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('eventsync-role', role)
  }, [role])

  const userName = role === 'Super Admin' ? 'System Administrator'
    : role === 'Org Admin' ? 'Alice Wanjiru'
    : role === 'Event Manager' ? 'Brian Kiprop'
    : role === 'Operations Manager' ? 'Carol Achieng'
    : role === 'Field Staff' ? 'James Kamau'
    : role === 'Finance Officer' ? 'Diana Mwangi'
    : role === 'Supplier' ? 'Peter Kamau (ProAudio)'
    : 'Grace Otieno (Auditor)'

  return (
    <AppContext.Provider value={{ theme, toggleTheme: () => setTheme(t => t === 'light' ? 'dark' : 'light'), role, setRole, userName }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

export type { Role }
