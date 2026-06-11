import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import CalendarView from './pages/CalendarView'
import EventsPage from './pages/EventsPage'
import PersonnelPage from './pages/PersonnelPage'
import InventoryPage from './pages/InventoryPage'
import TicketsPage from './pages/TicketsPage'
import ChecklistPage from './pages/ChecklistPage'
import ReportsPage from './pages/ReportsPage'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<CalendarView />} />
        <Route path="/events/*" element={<EventsPage />} />
        <Route path="/personnel" element={<PersonnelPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/tickets" element={<TicketsPage />} />
        <Route path="/checklist" element={<ChecklistPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
