export type EventType = 'show' | 'rehearsal' | 'setup' | 'teardown'

export type PersonnelRole =
  | 'director'
  | 'actor'
  | 'stage_manager'
  | 'lighting'
  | 'sound'
  | 'costume'
  | 'prop'
  | 'ticket'
  | 'usher'
  | 'other'

export type PropStatus = 'in_stock' | 'in_use' | 'borrowed' | 'maintenance'
export type CostumeStatus = 'in_stock' | 'in_use' | 'borrowed' | 'cleaning'
export type TicketType = 'normal' | 'vip' | 'student' | 'complementary'

export interface ScheduleEvent {
  id: string
  type: EventType
  title: string
  start: string
  end: string
  showId?: string
  description?: string
  venue?: string
  notes?: string
}

export interface Show {
  id: string
  title: string
  director?: string
  playwright?: string
  duration: number
  genre?: string
  description?: string
  posterUrl?: string
}

export interface Personnel {
  id: string
  name: string
  role: PersonnelRole
  phone?: string
  email?: string
  department?: string
  notes?: string
}

export interface LeaveRecord {
  id: string
  personnelId: string
  startDate: string
  endDate: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

export interface Assignment {
  id: string
  eventId: string
  personnelId: string
  role: string
  notes?: string
}

export interface Prop {
  id: string
  name: string
  category: string
  quantity: number
  status: PropStatus
  location?: string
  borrowerId?: string
  borrowDate?: string
  returnDate?: string
  notes?: string
}

export interface Costume {
  id: string
  name: string
  character?: string
  size: string
  quantity: number
  status: CostumeStatus
  borrowerId?: string
  borrowDate?: string
  returnDate?: string
  notes?: string
}

export interface CheckItem {
  id: string
  eventId?: string
  category: 'lighting' | 'sound' | 'stage' | 'other'
  name: string
  checked: boolean
  checkedBy?: string
  checkedAt?: string
  notes?: string
}

export interface EventPropAssignment {
  id: string
  eventId: string
  propId: string
  quantity: number
  assignedAt: string
  assignedBy?: string
  notes?: string
}

export interface EventCostumeAssignment {
  id: string
  eventId: string
  costumeId: string
  quantity: number
  assignedAt: string
  assignedBy?: string
  notes?: string
}

export type TimelineEventType =
  | 'arrival'
  | 'check_complete'
  | 'ticket_open'
  | 'entrance'
  | 'curtain_up'
  | 'intermission'
  | 'curtain_down'
  | 'incident'
  | 'incident_resolved'
  | 'other'

export interface TimelineEvent {
  id: string
  eventId: string
  type: TimelineEventType
  timestamp: string
  title: string
  description?: string
  operatorId?: string
}

export interface TicketSale {
  id: string
  showId: string
  eventId: string
  type: TicketType
  quantity: number
  price: number
  total: number
  soldAt: string
  soldBy?: string
  notes?: string
}

export interface ComplementaryTicket {
  id: string
  showId: string
  eventId: string
  recipient: string
  quantity: number
  reason: string
  issuedAt: string
  issuedBy?: string
}

export interface AttendanceRecord {
  id: string
  eventId: string
  normalTickets: number
  vipTickets: number
  studentTickets: number
  complementaryTickets: number
  totalAudience: number
  recordedAt: string
}

export interface PerformanceLog {
  id: string
  eventId?: string
  timestamp: string
  content: string
  authorId?: string
  category: 'info' | 'warning' | 'action'
}

export interface IncidentRecord {
  id: string
  eventId?: string
  timestamp: string
  title: string
  description: string
  severity: 'minor' | 'moderate' | 'serious'
  handled: boolean
  handlerId?: string
  resolution?: string
}

export interface TodoItem {
  id: string
  title: string
  description?: string
  eventId?: string
  dueDate?: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  createdAt: string
}

export interface Expense {
  id: string
  category: string
  description: string
  amount: number
  date: string
  eventId?: string
  recordedBy?: string
}

export interface PersonnelCheckin {
  id: string
  eventId: string
  assignmentId: string
  personnelId: string
  confirmed: boolean
  confirmedAt?: string
  notes?: string
}

export interface PropCheckin {
  id: string
  eventId: string
  assignmentId: string
  propId: string
  confirmed: boolean
  confirmedAt?: string
  notes?: string
}

export interface CostumeCheckin {
  id: string
  eventId: string
  assignmentId: string
  costumeId: string
  confirmed: boolean
  confirmedAt?: string
  notes?: string
}
