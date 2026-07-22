import { Routes, Route } from 'react-router-dom'
import { AppProvider } from '@/providers/AppProvider'
import { Layout } from '@/components/layout/Layout'
import Dashboard from '@/pages/Dashboard'
import Events from '@/pages/Events'
import EventDetail from '@/pages/EventDetail'
import Venues from '@/pages/Venues'
import Suppliers from '@/pages/Suppliers'
import Equipment from '@/pages/Equipment'
import Contracts from '@/pages/Contracts'
import ContractDetail from '@/pages/ContractDetail'
import Assignments from '@/pages/Assignments'
import Movements from '@/pages/Movements'
import Scanner from '@/pages/Scanner'
import Alerts from '@/pages/Alerts'
import Approvals from '@/pages/Approvals'
import Incidents from '@/pages/Incidents'
import Invoices from '@/pages/Invoices'
import Reports from '@/pages/Reports'
import AuditLogs from '@/pages/AuditLogs'
import Settings from '@/pages/Settings'

export default function App() {
  return (
    <AppProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/venues" element={<Venues />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/equipment" element={<Equipment />} />
          <Route path="/contracts" element={<Contracts />} />
          <Route path="/contracts/:id" element={<ContractDetail />} />
          <Route path="/assignments" element={<Assignments />} />
          <Route path="/movements" element={<Movements />} />
          <Route path="/scanner" element={<Scanner />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/approvals" element={<Approvals />} />
          <Route path="/incidents" element={<Incidents />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/audit" element={<AuditLogs />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </AppProvider>
  )
}
