import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  ScheduleEvent,
  Show,
  Personnel,
  LeaveRecord,
  Assignment,
  Prop,
  Costume,
  CheckItem,
  TicketSale,
  ComplementaryTicket,
  AttendanceRecord,
  PerformanceLog,
  IncidentRecord,
  TodoItem,
  Expense,
  EventPropAssignment,
  EventCostumeAssignment,
  TimelineEvent,
} from '../types'
import { generateId } from '../lib/utils'

const today = new Date()
const addDays = (days: number) => {
  const d = new Date(today)
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

const sampleEvents: ScheduleEvent[] = [
  {
    id: 'e1',
    type: 'show',
    title: '《雷雨》正式演出',
    start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 19, 30).toISOString(),
    end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 22, 0).toISOString(),
    showId: 's1',
    venue: '主剧场',
  },
  {
    id: 'e2',
    type: 'rehearsal',
    title: '《雷雨》带妆彩排',
    start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0).toISOString(),
    end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 17, 0).toISOString(),
    showId: 's1',
    venue: '主剧场',
  },
  {
    id: 'e3',
    type: 'setup',
    title: '《雷雨》装台',
    start: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 9, 0).toISOString(),
    end: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 18, 0).toISOString(),
    showId: 's1',
    venue: '主剧场',
  },
  {
    id: 'e4',
    type: 'show',
    title: '《茶馆》正式演出',
    start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 19, 30).toISOString(),
    end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 22, 30).toISOString(),
    showId: 's2',
    venue: '主剧场',
  },
  {
    id: 'e5',
    type: 'rehearsal',
    title: '《茶馆》走台排练',
    start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 10, 0).toISOString(),
    end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 15, 0).toISOString(),
    showId: 's2',
    venue: '主剧场',
  },
  {
    id: 'e6',
    type: 'teardown',
    title: '《雷雨》撤场',
    start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 9, 0).toISOString(),
    end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 14, 0).toISOString(),
    showId: 's1',
    venue: '主剧场',
  },
  {
    id: 'e7',
    type: 'show',
    title: '《暗恋桃花源》',
    start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5, 19, 0).toISOString(),
    end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5, 21, 30).toISOString(),
    showId: 's3',
    venue: '实验剧场',
  },
  {
    id: 'e8',
    type: 'rehearsal',
    title: '《暗恋桃花源》排练',
    start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3, 14, 0).toISOString(),
    end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3, 18, 0).toISOString(),
    showId: 's3',
    venue: '排练厅A',
  },
]

const sampleShows: Show[] = [
  {
    id: 's1',
    title: '雷雨',
    director: '张艺谋',
    playwright: '曹禺',
    duration: 150,
    genre: '悲剧',
    description: '《雷雨》是剧作家曹禺创作的一部话剧，此剧以1925年前后的中国社会为背景，描写了一个带有浓厚封建色彩的资产阶级家庭的悲剧。',
  },
  {
    id: 's2',
    title: '茶馆',
    director: '林兆华',
    playwright: '老舍',
    duration: 180,
    genre: '现实主义',
    description: '《茶馆》是现代文学家老舍于1956年创作的话剧，剧作展示了戊戌变法、军阀混战和新中国成立前夕三个时代近半个世纪的社会风云变化。',
  },
  {
    id: 's3',
    title: '暗恋桃花源',
    director: '赖声川',
    playwright: '赖声川',
    duration: 150,
    genre: '悲喜剧',
    description: '《暗恋桃花源》是赖声川表演工作坊创作的话剧，讲述了一个现代爱情悲剧和一个古装喜剧因排演场地冲突而发生的奇妙故事。',
  },
]

const samplePersonnel: Personnel[] = [
  { id: 'p1', name: '李明', role: 'actor', phone: '13800138001', department: '演员队' },
  { id: 'p2', name: '王芳', role: 'actor', phone: '13800138002', department: '演员队' },
  { id: 'p3', name: '张伟', role: 'stage_manager', phone: '13800138003', department: '舞台部' },
  { id: 'p4', name: '刘洋', role: 'lighting', phone: '13800138004', department: '技术部' },
  { id: 'p5', name: '陈静', role: 'sound', phone: '13800138005', department: '技术部' },
  { id: 'p6', name: '赵磊', role: 'costume', phone: '13800138006', department: '服装组' },
  { id: 'p7', name: '孙丽', role: 'prop', phone: '13800138007', department: '道具组' },
  { id: 'p8', name: '周强', role: 'ticket', phone: '13800138008', department: '票务部' },
  { id: 'p9', name: '吴敏', role: 'usher', phone: '13800138009', department: '场务部' },
  { id: 'p10', name: '郑华', role: 'director', phone: '13800138010', department: '创作部' },
]

const sampleProps: Prop[] = [
  { id: 'pr1', name: '红木桌', category: '家具', quantity: 1, status: 'in_use', location: '主剧场舞台', borrowerId: 'p7' },
  { id: 'pr2', name: '老式沙发', category: '家具', quantity: 2, status: 'in_use', location: '主剧场后台' },
  { id: 'pr3', name: '台灯', category: '灯具', quantity: 3, status: 'in_stock', location: '道具库A-1' },
  { id: 'pr4', name: '花瓶', category: '装饰', quantity: 5, status: 'in_stock', location: '道具库A-2' },
  { id: 'pr5', name: '雨伞', category: '日用品', quantity: 10, status: 'borrowed', borrowerId: 'p1', borrowDate: addDays(-2) },
]

const sampleCostumes: Costume[] = [
  { id: 'c1', name: '民国长衫', character: '周朴园', size: 'L', quantity: 1, status: 'in_use', borrowerId: 'p1' },
  { id: 'c2', name: '旗袍', character: '繁漪', size: 'M', quantity: 1, status: 'in_use', borrowerId: 'p2' },
  { id: 'c3', name: '西装', character: '周萍', size: 'L', quantity: 1, status: 'in_stock' },
  { id: 'c4', name: '丫鬟装', character: '四凤', size: 'S', quantity: 2, status: 'cleaning' },
]

const sampleTodos: TodoItem[] = [
  { id: 't1', title: '确认《雷雨》演员到场', completed: false, priority: 'high', createdAt: addDays(-1), dueDate: addDays(0) },
  { id: 't2', title: '检查灯光设备', completed: true, priority: 'high', createdAt: addDays(-2), dueDate: addDays(-1) },
  { id: 't3', title: '准备赠票名单', completed: false, priority: 'medium', createdAt: addDays(-1), dueDate: addDays(0) },
  { id: 't4', title: '服装清洗', completed: false, priority: 'low', createdAt: addDays(0), dueDate: addDays(2) },
]

const sampleExpenses: Expense[] = [
  { id: 'ex1', category: '道具采购', description: '购买舞台道具', amount: 3500, date: addDays(-5) },
  { id: 'ex2', category: '服装租赁', description: '民国服装租赁', amount: 2800, date: addDays(-4) },
  { id: 'ex3', category: '设备维护', description: '音响设备检修', amount: 1200, date: addDays(-3) },
  { id: 'ex4', category: '宣传推广', description: '海报印刷', amount: 800, date: addDays(-2) },
  { id: 'ex5', category: '人员劳务', description: '临时场务', amount: 1500, date: addDays(-1) },
]

const sampleTickets: TicketSale[] = [
  { id: 'tk1', showId: 's1', eventId: 'e1', type: 'normal', quantity: 120, price: 180, total: 21600, soldAt: addDays(-1) },
  { id: 'tk2', showId: 's1', eventId: 'e1', type: 'vip', quantity: 30, price: 380, total: 11400, soldAt: addDays(-1) },
  { id: 'tk3', showId: 's1', eventId: 'e1', type: 'student', quantity: 25, price: 80, total: 2000, soldAt: addDays(0) },
]

const sampleComplementary: ComplementaryTicket[] = [
  { id: 'cp1', showId: 's1', eventId: 'e1', recipient: '媒体嘉宾', quantity: 10, reason: '媒体宣传', issuedAt: addDays(-1) },
  { id: 'cp2', showId: 's1', eventId: 'e1', recipient: '合作单位', quantity: 15, reason: '商务合作', issuedAt: addDays(-2) },
]

const sampleAssignments: Assignment[] = [
  { id: 'as1', eventId: 'e1', personnelId: 'p1', role: '周朴园' },
  { id: 'as2', eventId: 'e1', personnelId: 'p2', role: '繁漪' },
  { id: 'as3', eventId: 'e1', personnelId: 'p3', role: '舞台监督' },
  { id: 'as4', eventId: 'e1', personnelId: 'p4', role: '灯光师' },
  { id: 'as5', eventId: 'e1', personnelId: 'p5', role: '音响师' },
  { id: 'as6', eventId: 'e2', personnelId: 'p1', role: '周朴园' },
  { id: 'as7', eventId: 'e2', personnelId: 'p2', role: '繁漪' },
  { id: 'as8', eventId: 'e4', personnelId: 'p3', role: '舞台监督' },
]

const sampleEventProps: EventPropAssignment[] = [
  { id: 'ep1', eventId: 'e1', propId: 'pr1', quantity: 1, assignedAt: addDays(-1) },
  { id: 'ep2', eventId: 'e1', propId: 'pr2', quantity: 2, assignedAt: addDays(-1) },
  { id: 'ep3', eventId: 'e2', propId: 'pr1', quantity: 1, assignedAt: addDays(0) },
  { id: 'ep4', eventId: 'e4', propId: 'pr3', quantity: 2, assignedAt: addDays(1) },
]

const sampleEventCostumes: EventCostumeAssignment[] = [
  { id: 'ec1', eventId: 'e1', costumeId: 'c1', quantity: 1, assignedAt: addDays(-1) },
  { id: 'ec2', eventId: 'e1', costumeId: 'c2', quantity: 1, assignedAt: addDays(-1) },
  { id: 'ec3', eventId: 'e2', costumeId: 'c1', quantity: 1, assignedAt: addDays(0) },
  { id: 'ec4', eventId: 'e2', costumeId: 'c2', quantity: 1, assignedAt: addDays(0) },
]

const sampleCheckItems: CheckItem[] = [
  { id: 'ci1', eventId: 'e1', category: 'lighting', name: '主舞台面光灯', checked: true },
  { id: 'ci2', eventId: 'e1', category: 'lighting', name: '侧光灯', checked: true },
  { id: 'ci3', eventId: 'e1', category: 'lighting', name: '追光灯', checked: false },
  { id: 'ci4', eventId: 'e1', category: 'lighting', name: '天幕灯', checked: false },
  { id: 'ci5', eventId: 'e1', category: 'sound', name: '主音箱系统', checked: true },
  { id: 'ci6', eventId: 'e1', category: 'sound', name: '无线麦克风(手持)', checked: true },
  { id: 'ci7', eventId: 'e1', category: 'sound', name: '无线麦克风(头戴)', checked: false },
  { id: 'ci8', eventId: 'e1', category: 'sound', name: '监听音箱', checked: false },
  { id: 'ci9', eventId: 'e1', category: 'stage', name: '幕布升降', checked: true },
  { id: 'ci10', eventId: 'e1', category: 'stage', name: '转台运行', checked: false },
  { id: 'ci11', eventId: 'e1', category: 'stage', name: '消防通道', checked: true },
  { id: 'ci12', eventId: 'e1', category: 'stage', name: '应急照明', checked: true },
  { id: 'ci13', eventId: 'e2', category: 'lighting', name: '主舞台面光灯', checked: false },
  { id: 'ci14', eventId: 'e2', category: 'lighting', name: '侧光灯', checked: false },
  { id: 'ci15', eventId: 'e2', category: 'sound', name: '主音箱系统', checked: true },
  { id: 'ci16', eventId: 'e2', category: 'sound', name: '无线麦克风(手持)', checked: true },
  { id: 'ci17', eventId: 'e2', category: 'stage', name: '幕布升降', checked: true },
  { id: 'ci18', eventId: 'e4', category: 'lighting', name: '主舞台面光灯', checked: false },
  { id: 'ci19', eventId: 'e4', category: 'sound', name: '主音箱系统', checked: false },
  { id: 'ci20', eventId: 'e4', category: 'stage', name: '消防通道', checked: true },
]

const sampleTimeline: TimelineEvent[] = [
  { id: 'tl1', eventId: 'e1', type: 'arrival', timestamp: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 17, 0).toISOString(), title: '演员到场签到' },
  { id: 'tl2', eventId: 'e1', type: 'check_complete', timestamp: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 18, 0).toISOString(), title: '灯光音响检查完成', description: '面光、侧光、主音箱、手持麦检查通过' },
  { id: 'tl3', eventId: 'e1', type: 'ticket_open', timestamp: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 18, 30).toISOString(), title: '票务窗口开放' },
  { id: 'tl4', eventId: 'e1', type: 'entrance', timestamp: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 19, 0).toISOString(), title: '观众开始入场' },
  { id: 'tl5', eventId: 'e1', type: 'curtain_up', timestamp: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 19, 30).toISOString(), title: '大幕拉开，演出开始' },
]

const sampleLeaves: LeaveRecord[] = [
  { id: 'l1', personnelId: 'p1', startDate: addDays(3), endDate: addDays(5), reason: '家人住院需要照顾', status: 'pending', createdAt: addDays(-1) },
]

const sampleLogs: PerformanceLog[] = [
  { id: 'pl1', eventId: 'e1', timestamp: addDays(0), content: '演员完成化妆，准备候场', category: 'info' },
  { id: 'pl2', eventId: 'e1', timestamp: addDays(0), content: '灯光设备调试完毕', category: 'info' },
  { id: 'pl3', eventId: 'e1', timestamp: addDays(0), content: '观众开始入场', category: 'action' },
]

const sampleIncidents: IncidentRecord[] = [
  { id: 'in1', eventId: 'e2', timestamp: addDays(-1), title: '2号麦克风电池电量低', description: '演出进行中2号手持麦克风出现杂音，经检查为电池电量不足', severity: 'minor', handled: true, resolution: '已更换电池' },
]

const sampleAttendance: AttendanceRecord[] = [
  { id: 'a1', eventId: 'e1', normalTickets: 115, vipTickets: 28, studentTickets: 23, complementaryTickets: 22, totalAudience: 188, recordedAt: addDays(0) },
]

interface AppState {
  events: ScheduleEvent[]
  shows: Show[]
  personnel: Personnel[]
  leaves: LeaveRecord[]
  assignments: Assignment[]
  props: Prop[]
  costumes: Costume[]
  checkItems: CheckItem[]
  ticketSales: TicketSale[]
  complementaryTickets: ComplementaryTicket[]
  attendance: AttendanceRecord[]
  logs: PerformanceLog[]
  incidents: IncidentRecord[]
  todos: TodoItem[]
  expenses: Expense[]
  eventPropAssignments: EventPropAssignment[]
  eventCostumeAssignments: EventCostumeAssignment[]
  timeline: TimelineEvent[]

  addEvent: (event: Omit<ScheduleEvent, 'id'>) => void
  updateEvent: (id: string, event: Partial<ScheduleEvent>) => void
  deleteEvent: (id: string) => void

  addShow: (show: Omit<Show, 'id'>) => void
  updateShow: (id: string, show: Partial<Show>) => void
  deleteShow: (id: string) => void

  addPersonnel: (personnel: Omit<Personnel, 'id'>) => void
  updatePersonnel: (id: string, personnel: Partial<Personnel>) => void
  deletePersonnel: (id: string) => void

  addLeave: (leave: Omit<LeaveRecord, 'id' | 'createdAt'>) => void
  updateLeave: (id: string, leave: Partial<LeaveRecord>) => void
  deleteLeave: (id: string) => void

  addAssignment: (assignment: Omit<Assignment, 'id'>) => void
  updateAssignment: (id: string, assignment: Partial<Assignment>) => void
  deleteAssignment: (id: string) => void

  addProp: (prop: Omit<Prop, 'id'>) => void
  updateProp: (id: string, prop: Partial<Prop>) => void
  deleteProp: (id: string) => void

  addCostume: (costume: Omit<Costume, 'id'>) => void
  updateCostume: (id: string, costume: Partial<Costume>) => void
  deleteCostume: (id: string) => void

  toggleCheckItem: (id: string) => void
  addCheckItem: (item: Omit<CheckItem, 'id'>) => void
  updateCheckItem: (id: string, item: Partial<CheckItem>) => void
  deleteCheckItem: (id: string) => void

  addTicketSale: (ticket: Omit<TicketSale, 'id'>) => void
  addComplementaryTicket: (ticket: Omit<ComplementaryTicket, 'id'>) => void

  addAttendance: (attendance: Omit<AttendanceRecord, 'id'>) => void

  addLog: (log: Omit<PerformanceLog, 'id'>) => void
  addIncident: (incident: Omit<IncidentRecord, 'id'>) => void
  updateIncident: (id: string, incident: Partial<IncidentRecord>) => void

  addTodo: (todo: Omit<TodoItem, 'id' | 'createdAt' | 'completed'>) => void
  toggleTodo: (id: string) => void
  deleteTodo: (id: string) => void

  addExpense: (expense: Omit<Expense, 'id'>) => void
  deleteExpense: (id: string) => void

  addEventPropAssignment: (assignment: Omit<EventPropAssignment, 'id' | 'assignedAt'>) => void
  updateEventPropAssignment: (id: string, assignment: Partial<EventPropAssignment>) => void
  deleteEventPropAssignment: (id: string) => void

  addEventCostumeAssignment: (assignment: Omit<EventCostumeAssignment, 'id' | 'assignedAt'>) => void
  updateEventCostumeAssignment: (id: string, assignment: Partial<EventCostumeAssignment>) => void
  deleteEventCostumeAssignment: (id: string) => void

  addTimelineEvent: (event: Omit<TimelineEvent, 'id'>) => void
  updateTimelineEvent: (id: string, event: Partial<TimelineEvent>) => void
  deleteTimelineEvent: (id: string) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      events: sampleEvents,
      shows: sampleShows,
      personnel: samplePersonnel,
      leaves: sampleLeaves,
      assignments: sampleAssignments,
      props: sampleProps,
      costumes: sampleCostumes,
      checkItems: sampleCheckItems,
      ticketSales: sampleTickets,
      complementaryTickets: sampleComplementary,
      attendance: sampleAttendance,
      logs: sampleLogs,
      incidents: sampleIncidents,
      todos: sampleTodos,
      expenses: sampleExpenses,
      eventPropAssignments: sampleEventProps,
      eventCostumeAssignments: sampleEventCostumes,
      timeline: sampleTimeline,

      addEvent: (event) =>
        set((state) => ({ events: [...state.events, { ...event, id: generateId() }] })),
      updateEvent: (id, event) =>
        set((state) => ({
          events: state.events.map((e) => (e.id === id ? { ...e, ...event } : e)),
        })),
      deleteEvent: (id) =>
        set((state) => ({ events: state.events.filter((e) => e.id !== id) })),

      addShow: (show) =>
        set((state) => ({ shows: [...state.shows, { ...show, id: generateId() }] })),
      updateShow: (id, show) =>
        set((state) => ({
          shows: state.shows.map((s) => (s.id === id ? { ...s, ...show } : s)),
        })),
      deleteShow: (id) =>
        set((state) => ({ shows: state.shows.filter((s) => s.id !== id) })),

      addPersonnel: (personnel) =>
        set((state) => ({ personnel: [...state.personnel, { ...personnel, id: generateId() }] })),
      updatePersonnel: (id, personnel) =>
        set((state) => ({
          personnel: state.personnel.map((p) => (p.id === id ? { ...p, ...personnel } : p)),
        })),
      deletePersonnel: (id) =>
        set((state) => ({ personnel: state.personnel.filter((p) => p.id !== id) })),

      addLeave: (leave) =>
        set((state) => ({
          leaves: [...state.leaves, { ...leave, id: generateId(), createdAt: new Date().toISOString() }],
        })),
      updateLeave: (id, leave) =>
        set((state) => ({
          leaves: state.leaves.map((l) => (l.id === id ? { ...l, ...leave } : l)),
        })),
      deleteLeave: (id) =>
        set((state) => ({ leaves: state.leaves.filter((l) => l.id !== id) })),

      addAssignment: (assignment) =>
        set((state) => ({ assignments: [...state.assignments, { ...assignment, id: generateId() }] })),
      updateAssignment: (id, assignment) =>
        set((state) => ({
          assignments: state.assignments.map((a) => (a.id === id ? { ...a, ...assignment } : a)),
        })),
      deleteAssignment: (id) =>
        set((state) => ({ assignments: state.assignments.filter((a) => a.id !== id) })),

      addProp: (prop) =>
        set((state) => ({ props: [...state.props, { ...prop, id: generateId() }] })),
      updateProp: (id, prop) =>
        set((state) => ({
          props: state.props.map((p) => (p.id === id ? { ...p, ...prop } : p)),
        })),
      deleteProp: (id) =>
        set((state) => ({ props: state.props.filter((p) => p.id !== id) })),

      addCostume: (costume) =>
        set((state) => ({ costumes: [...state.costumes, { ...costume, id: generateId() }] })),
      updateCostume: (id, costume) =>
        set((state) => ({
          costumes: state.costumes.map((c) => (c.id === id ? { ...c, ...costume } : c)),
        })),
      deleteCostume: (id) =>
        set((state) => ({ costumes: state.costumes.filter((c) => c.id !== id) })),

      toggleCheckItem: (id) =>
        set((state) => ({
          checkItems: state.checkItems.map((c) =>
            c.id === id
              ? { ...c, checked: !c.checked, checkedAt: !c.checked ? new Date().toISOString() : undefined }
              : c,
          ),
        })),
      addCheckItem: (item) =>
        set((state) => ({ checkItems: [...state.checkItems, { ...item, id: generateId() }] })),
      updateCheckItem: (id, item) =>
        set((state) => ({
          checkItems: state.checkItems.map((c) => (c.id === id ? { ...c, ...item } : c)),
        })),
      deleteCheckItem: (id) =>
        set((state) => ({ checkItems: state.checkItems.filter((c) => c.id !== id) })),

      addTicketSale: (ticket) =>
        set((state) => ({ ticketSales: [...state.ticketSales, { ...ticket, id: generateId() }] })),
      addComplementaryTicket: (ticket) =>
        set((state) => ({
          complementaryTickets: [...state.complementaryTickets, { ...ticket, id: generateId() }],
        })),

      addAttendance: (attendance) =>
        set((state) => ({ attendance: [...state.attendance, { ...attendance, id: generateId() }] })),

      addLog: (log) =>
        set((state) => ({ logs: [...state.logs, { ...log, id: generateId() }] })),
      addIncident: (incident) =>
        set((state) => ({ incidents: [...state.incidents, { ...incident, id: generateId() }] })),
      updateIncident: (id, incident) =>
        set((state) => ({
          incidents: state.incidents.map((i) => (i.id === id ? { ...i, ...incident } : i)),
        })),

      addTodo: (todo) =>
        set((state) => ({
          todos: [...state.todos, { ...todo, id: generateId(), createdAt: new Date().toISOString(), completed: false }],
        })),
      toggleTodo: (id) =>
        set((state) => ({
          todos: state.todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
        })),
      deleteTodo: (id) =>
        set((state) => ({ todos: state.todos.filter((t) => t.id !== id) })),

      addExpense: (expense) =>
        set((state) => ({ expenses: [...state.expenses, { ...expense, id: generateId() }] })),
      deleteExpense: (id) =>
        set((state) => ({ expenses: state.expenses.filter((e) => e.id !== id) })),

      addEventPropAssignment: (assignment) =>
        set((state) => ({
          eventPropAssignments: [
            ...state.eventPropAssignments,
            { ...assignment, id: generateId(), assignedAt: new Date().toISOString() },
          ],
        })),
      updateEventPropAssignment: (id, assignment) =>
        set((state) => ({
          eventPropAssignments: state.eventPropAssignments.map((a) =>
            a.id === id ? { ...a, ...assignment } : a,
          ),
        })),
      deleteEventPropAssignment: (id) =>
        set((state) => ({
          eventPropAssignments: state.eventPropAssignments.filter((a) => a.id !== id),
        })),

      addEventCostumeAssignment: (assignment) =>
        set((state) => ({
          eventCostumeAssignments: [
            ...state.eventCostumeAssignments,
            { ...assignment, id: generateId(), assignedAt: new Date().toISOString() },
          ],
        })),
      updateEventCostumeAssignment: (id, assignment) =>
        set((state) => ({
          eventCostumeAssignments: state.eventCostumeAssignments.map((a) =>
            a.id === id ? { ...a, ...assignment } : a,
          ),
        })),
      deleteEventCostumeAssignment: (id) =>
        set((state) => ({
          eventCostumeAssignments: state.eventCostumeAssignments.filter((a) => a.id !== id),
        })),

      addTimelineEvent: (event) =>
        set((state) => ({
          timeline: [...state.timeline, { ...event, id: generateId() }],
        })),
      updateTimelineEvent: (id, event) =>
        set((state) => ({
          timeline: state.timeline.map((t) => (t.id === id ? { ...t, ...event } : t)),
        })),
      deleteTimelineEvent: (id) =>
        set((state) => ({ timeline: state.timeline.filter((t) => t.id !== id) })),
    }),
    {
      name: 'theater-manager-storage',
    },
  ),
)
