import { useState } from 'react'
import { Routes, Route, useParams, useNavigate } from 'react-router-dom'
import { parseISO, format, isAfter, isBefore, isWithinInterval } from 'date-fns'
import {
  ArrowLeft,
  Users,
  Package,
  Shirt,
  ClipboardList,
  Ticket,
  Clock,
  MapPin,
  UserPlus,
  Plus,
  Trash2,
  Film,
  Check,
  AlertTriangle,
  CalendarX,
  DollarSign,
  Gift,
  MessageSquare,
  Download,
  Timer,
} from 'lucide-react'
import { useAppStore } from '../store'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Input from '../components/Input'
import Select from '../components/Select'
import TextArea from '../components/TextArea'
import Modal from '../components/Modal'
import { cn, formatDateTime, formatTime, formatDate, exportToCSV } from '../lib/utils'
import type {
  EventType,
  Assignment,
  PerformanceLog,
  IncidentRecord,
  CheckItem,
  TimelineEventType,
  TimelineEvent,
} from '../types'

const eventTypeLabels: Record<EventType, string> = {
  show: '演出',
  rehearsal: '排练',
  setup: '装台',
  teardown: '撤场',
}

const eventTypeBadge: Record<EventType, 'danger' | 'info' | 'success' | 'purple'> = {
  show: 'danger',
  rehearsal: 'info',
  setup: 'success',
  teardown: 'purple',
}

const timelineTypeLabels: Record<TimelineEventType, string> = {
  arrival: '到场签到',
  check_complete: '检查完成',
  ticket_open: '开票',
  entrance: '入场',
  curtain_up: '大幕拉开',
  intermission: '中场休息',
  curtain_down: '大幕落下',
  incident: '事故',
  incident_resolved: '事故解决',
  other: '其他',
}

const timelineTypeColors: Record<TimelineEventType, string> = {
  arrival: 'bg-blue-500',
  check_complete: 'bg-green-500',
  ticket_open: 'bg-amber-500',
  entrance: 'bg-teal-500',
  curtain_up: 'bg-red-500',
  intermission: 'bg-amber-400',
  curtain_down: 'bg-slate-500',
  incident: 'bg-red-600',
  incident_resolved: 'bg-green-600',
  other: 'bg-slate-400',
}

export default function EventsPage() {
  return (
    <Routes>
      <Route path="/" element={<EventsList />} />
      <Route path="/:id" element={<EventDetail />} />
    </Routes>
  )
}

function EventsList() {
  const events = useAppStore((s) => s.events)
  const shows = useAppStore((s) => s.shows)
  const navigate = useNavigate()
  const [filter, setFilter] = useState<EventType | 'all'>('all')
  const [search, setSearch] = useState('')

  const filteredEvents = events
    .filter((e) => (filter === 'all' ? true : e.type === filter))
    .filter((e) => (search ? e.title.toLowerCase().includes(search.toLowerCase()) : true))
    .sort((a, b) => parseISO(a.start).getTime() - parseISO(b.start).getTime())

  const now = new Date()
  const upcoming = filteredEvents.filter((e) => isAfter(parseISO(e.start), now))
  const ongoing = filteredEvents.filter(
    (e) => isBefore(parseISO(e.start), now) && isAfter(parseISO(e.end), now),
  )
  const past = filteredEvents.filter((e) => isBefore(parseISO(e.end), now))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">场次详情</h2>
        <p className="text-sm text-slate-500 mt-1">点击场次进入当天执行面板</p>
      </div>
      <div className="flex gap-4 flex-wrap">
        <div className="w-64">
          <Input placeholder="搜索场次..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value as EventType | 'all')}
          className="w-40"
          options={[
            { value: 'all', label: '全部类型' },
            { value: 'show', label: '演出' },
            { value: 'rehearsal', label: '排练' },
            { value: 'setup', label: '装台' },
            { value: 'teardown', label: '撤场' },
          ]}
        />
      </div>
      {ongoing.length > 0 && (
        <Card title="进行中" subtitle={`${ongoing.length} 个场次正在进行`}>
          <div className="space-y-3">
            {ongoing.map((e) => (
              <EventRow key={e.id} event={e} show={shows.find((s) => s.id === e.showId)} onClick={() => navigate(e.id)} />
            ))}
          </div>
        </Card>
      )}
      <Card title="即将开始" subtitle={`${upcoming.length} 个场次待执行`}>
        {upcoming.length === 0 ? (
          <p className="text-slate-400 text-center py-8">暂无即将开始的场次</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((e) => (
              <EventRow key={e.id} event={e} show={shows.find((s) => s.id === e.showId)} onClick={() => navigate(e.id)} />
            ))}
          </div>
        )}
      </Card>
      <Card title="已完成" subtitle={`${past.length} 个场次已结束`}>
        {past.length === 0 ? (
          <p className="text-slate-400 text-center py-8">暂无已完成的场次</p>
        ) : (
          <div className="space-y-3">
            {past.slice(0, 10).map((e) => (
              <EventRow key={e.id} event={e} show={shows.find((s) => s.id === e.showId)} onClick={() => navigate(e.id)} muted />
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

function EventRow({ event, show, onClick, muted }: { event: any; show?: any; onClick: () => void; muted?: boolean }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/30 cursor-pointer transition-all',
        muted && 'opacity-70',
      )}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <Badge variant={eventTypeBadge[event.type as EventType]}>
          {eventTypeLabels[event.type as EventType]}
        </Badge>
        <div className="min-w-0">
          <h4 className="font-semibold text-slate-800 truncate">{event.title}</h4>
          <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatDateTime(event.start)} - {formatTime(event.end)}
            </span>
            {event.venue && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {event.venue}
              </span>
            )}
            {show && (
              <span className="flex items-center gap-1">
                <Film className="w-3.5 h-3.5" />
                {show.title}
              </span>
            )}
          </div>
        </div>
      </div>
      <ArrowLeft className="w-5 h-5 text-slate-300 rotate-180" />
    </div>
  )
}

function EventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const event = useAppStore((s) => s.events.find((e) => e.id === id))
  const shows = useAppStore((s) => s.shows)
  const show = shows.find((s) => s.id === event?.showId)
  const personnel = useAppStore((s) => s.personnel)
  const allProps = useAppStore((s) => s.props)
  const allCostumes = useAppStore((s) => s.costumes)
  const allCheckItems = useAppStore((s) => s.checkItems)
  const assignments = useAppStore((s) => s.assignments.filter((a) => a.eventId === id))
  const eventPropAssignments = useAppStore((s) => s.eventPropAssignments.filter((a) => a.eventId === id))
  const eventCostumeAssignments = useAppStore((s) => s.eventCostumeAssignments.filter((a) => a.eventId === id))
  const timeline = useAppStore((s) => s.timeline.filter((t) => t.eventId === id))
  const leaves = useAppStore((s) => s.leaves)
  const ticketSales = useAppStore((s) => s.ticketSales.filter((t) => t.eventId === id))
  const complementaryTickets = useAppStore((s) => s.complementaryTickets.filter((t) => t.eventId === id))
  const attendance = useAppStore((s) => s.attendance.filter((a) => a.eventId === id))
  const logs = useAppStore((s) => s.logs.filter((l) => l.eventId === id))
  const incidents = useAppStore((s) => s.incidents.filter((i) => i.eventId === id))

  const addAssignment = useAppStore((s) => s.addAssignment)
  const deleteAssignment = useAppStore((s) => s.deleteAssignment)
  const toggleCheckItem = useAppStore((s) => s.toggleCheckItem)
  const addCheckItem = useAppStore((s) => s.addCheckItem)
  const addEventPropAssignment = useAppStore((s) => s.addEventPropAssignment)
  const deleteEventPropAssignment = useAppStore((s) => s.deleteEventPropAssignment)
  const addEventCostumeAssignment = useAppStore((s) => s.addEventCostumeAssignment)
  const deleteEventCostumeAssignment = useAppStore((s) => s.deleteEventCostumeAssignment)
  const addTimelineEvent = useAppStore((s) => s.addTimelineEvent)
  const deleteTimelineEvent = useAppStore((s) => s.deleteTimelineEvent)
  const addLog = useAppStore((s) => s.addLog)
  const addIncident = useAppStore((s) => s.addIncident)
  const updateIncident = useAppStore((s) => s.updateIncident)
  const addTicketSale = useAppStore((s) => s.addTicketSale)
  const addComplementaryTicket = useAppStore((s) => s.addComplementaryTicket)
  const addAttendance = useAppStore((s) => s.addAttendance)

  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [newAssignment, setNewAssignment] = useState({ personnelId: '', role: '' })

  const [showCheckItemModal, setShowCheckItemModal] = useState(false)
  const [newCheckItem, setNewCheckItem] = useState({ name: '', category: 'lighting' as CheckItem['category'] })

  const [showPropModal, setShowPropModal] = useState(false)
  const [newProp, setNewProp] = useState({ propId: '', quantity: 1 })

  const [showCostumeModal, setShowCostumeModal] = useState(false)
  const [newCostume, setNewCostume] = useState({ costumeId: '', quantity: 1 })

  const [showTimelineModal, setShowTimelineModal] = useState(false)
  const [newTimeline, setNewTimeline] = useState({
    type: 'other' as TimelineEventType,
    title: '',
    description: '',
    timestamp: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  })

  const [showTicketModal, setShowTicketModal] = useState(false)
  const [ticketForm, setTicketForm] = useState({
    type: 'normal' as any,
    quantity: 1,
    price: 180,
    soldBy: '',
    notes: '',
  })

  const [showCompModal, setShowCompModal] = useState(false)
  const [compForm, setCompForm] = useState({
    recipient: '',
    quantity: 1,
    reason: '',
    issuedBy: '',
  })

  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  const [attendanceForm, setAttendanceForm] = useState({
    normalTickets: 0,
    vipTickets: 0,
    studentTickets: 0,
    complementaryTickets: 0,
  })

  const [viewMode, setViewMode] = useState<'panel' | 'sheet'>('panel')

  const [showLogModal, setShowLogModal] = useState(false)
  const [logForm, setLogForm] = useState({ content: '', category: 'info' as PerformanceLog['category'] })

  const [showIncidentModal, setShowIncidentModal] = useState(false)
  const [incidentForm, setIncidentForm] = useState({ title: '', description: '', severity: 'minor' as IncidentRecord['severity'] })

  const [showHandleModal, setShowHandleModal] = useState(false)
  const [handleTarget, setHandleTarget] = useState<string | null>(null)
  const [resolution, setResolution] = useState('')

  if (!event) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">场次不存在</p>
        <Button className="mt-4" onClick={() => navigate('/events')}>返回列表</Button>
      </div>
    )
  }

  const checkItems = allCheckItems.filter((c) => c.eventId === id)

  const eventAssignments = assignments.map((a) => {
    const p = personnel.find((per) => per.id === a.personnelId)
    const onLeave = p && leaves.some(
      (l) =>
        l.status !== 'rejected' &&
        l.personnelId === p.id &&
        isWithinInterval(parseISO(event.start), {
          start: parseISO(l.startDate),
          end: new Date(parseISO(l.endDate).getTime() + 86400000),
        }),
    )
    return { ...a, name: p?.name || '未知', role_label: p?.role || '', onLeave }
  })

  const eventProps = eventPropAssignments.map((a) => {
    const p = allProps.find((x) => x.id === a.propId)
    return { ...a, propName: p?.name || '未知', category: p?.category || '', location: p?.location || '' }
  })
  const eventCostumes = eventCostumeAssignments.map((a) => {
    const c = allCostumes.find((x) => x.id === a.costumeId)
    return { ...a, costumeName: c?.name || '未知', character: c?.character || '', size: c?.size || '' }
  })

  const lightingChecks = checkItems.filter((c) => c.category === 'lighting')
  const soundChecks = checkItems.filter((c) => c.category === 'sound')
  const stageChecks = checkItems.filter((c) => c.category === 'stage')
  const otherChecks = checkItems.filter((c) => c.category === 'other')
  const allChecked = checkItems.length > 0 && checkItems.every((c) => c.checked)
  const checkedRatio = checkItems.length > 0 ? Math.round((checkItems.filter((c) => c.checked).length / checkItems.length) * 100) : 0

  const totalTickets = ticketSales.reduce((s, t) => s + t.quantity, 0)
  const totalRevenue = ticketSales.reduce((s, t) => s + t.total, 0)
  const totalComp = complementaryTickets.reduce((s, t) => s + t.quantity, 0)
  const totalAudience = attendance.reduce((s, a) => s + a.totalAudience, 0)

  const unresolvedIncidents = incidents.filter((i) => !i.handled)
  const sortedTimeline = [...timeline].sort((a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime())

  const handleAddAssignment = () => {
    if (newAssignment.personnelId && newAssignment.role && id) {
      addAssignment({ eventId: id, personnelId: newAssignment.personnelId, role: newAssignment.role })
      setNewAssignment({ personnelId: '', role: '' })
      setShowAssignmentModal(false)
    }
  }

  const handleAddCheckItem = () => {
    if (!newCheckItem.name || !id) return
    addCheckItem({ eventId: id, name: newCheckItem.name, category: newCheckItem.category, checked: false })
    setNewCheckItem({ name: '', category: 'lighting' })
    setShowCheckItemModal(false)
  }

  const handleAddProp = () => {
    if (!newProp.propId || !id) return
    addEventPropAssignment({ eventId: id, propId: newProp.propId, quantity: newProp.quantity || 1 })
    setNewProp({ propId: '', quantity: 1 })
    setShowPropModal(false)
  }

  const handleAddCostume = () => {
    if (!newCostume.costumeId || !id) return
    addEventCostumeAssignment({ eventId: id, costumeId: newCostume.costumeId, quantity: newCostume.quantity || 1 })
    setNewCostume({ costumeId: '', quantity: 1 })
    setShowCostumeModal(false)
  }

  const handleAddTimeline = () => {
    if (!newTimeline.title || !id) return
    addTimelineEvent({
      eventId: id,
      type: newTimeline.type,
      title: newTimeline.title,
      description: newTimeline.description || undefined,
      timestamp: new Date(newTimeline.timestamp).toISOString(),
    })
    setNewTimeline({ type: 'other', title: '', description: '', timestamp: format(new Date(), "yyyy-MM-dd'T'HH:mm") })
    setShowTimelineModal(false)
  }

  const handleAddLog = () => {
    if (!logForm.content || !id) return
    addLog({ eventId: id, timestamp: new Date().toISOString(), content: logForm.content, category: logForm.category })
    setLogForm({ content: '', category: 'info' })
    setShowLogModal(false)
  }

  const handleAddIncident = () => {
    if (!incidentForm.title || !incidentForm.description || !id) return
    const now = new Date().toISOString()
    addIncident({ eventId: id, timestamp: now, title: incidentForm.title, description: incidentForm.description, severity: incidentForm.severity, handled: false })
    addTimelineEvent({
      eventId: id,
      type: 'incident',
      timestamp: now,
      title: `事故：${incidentForm.title}`,
      description: incidentForm.description,
    })
    setIncidentForm({ title: '', description: '', severity: 'minor' })
    setShowIncidentModal(false)
  }

  const handleAddTicket = () => {
    if (!id) return
    addTicketSale({
      eventId: id,
      showId: event?.showId || '',
      type: ticketForm.type as any,
      quantity: ticketForm.quantity,
      price: ticketForm.price,
      total: ticketForm.quantity * ticketForm.price,
      soldAt: new Date().toISOString(),
      soldBy: ticketForm.soldBy || undefined,
      notes: ticketForm.notes || undefined,
    })
    setTicketForm({ type: 'normal', quantity: 1, price: 180, soldBy: '', notes: '' })
    setShowTicketModal(false)
  }

  const handleAddComp = () => {
    if (!id || !compForm.recipient) return
    addComplementaryTicket({
      eventId: id,
      showId: event?.showId || '',
      recipient: compForm.recipient,
      quantity: compForm.quantity,
      reason: compForm.reason || '',
      issuedAt: new Date().toISOString(),
      issuedBy: compForm.issuedBy || undefined,
    })
    setCompForm({ recipient: '', quantity: 1, reason: '', issuedBy: '' })
    setShowCompModal(false)
  }

  const handleAddAttendance = () => {
    if (!id) return
    addAttendance({
      eventId: id,
      normalTickets: attendanceForm.normalTickets,
      vipTickets: attendanceForm.vipTickets,
      studentTickets: attendanceForm.studentTickets,
      complementaryTickets: attendanceForm.complementaryTickets,
      totalAudience:
        attendanceForm.normalTickets +
        attendanceForm.vipTickets +
        attendanceForm.studentTickets +
        attendanceForm.complementaryTickets,
      recordedAt: new Date().toISOString(),
    })
    setAttendanceForm({ normalTickets: 0, vipTickets: 0, studentTickets: 0, complementaryTickets: 0 })
    setShowAttendanceModal(false)
  }

  const handleResolveIncident = () => {
    if (handleTarget && resolution && id) {
      const now = new Date().toISOString()
      const incident = incidents.find((i) => i.id === handleTarget)
      updateIncident(handleTarget, { handled: true, resolution })
      addTimelineEvent({
        eventId: id,
        type: 'incident_resolved',
        timestamp: now,
        title: `事故解决：${incident?.title || '已处理'}`,
        description: resolution,
      })
      setHandleTarget(null)
      setResolution('')
      setShowHandleModal(false)
    }
  }

  const handleExportPack = () => {
    const eventName = event.title.replace(/[《》]/g, '')
    const dateStr = formatDate(event.start)

    const scheduleData = [{
      类型: eventTypeLabels[event.type],
      标题: event.title,
      开始时间: formatDateTime(event.start),
      结束时间: formatTime(event.end),
      场地: event.venue || '',
      备注: event.description || '',
    }]
    exportToCSV(scheduleData, `${eventName}_${dateStr}_排期.csv`)

    if (eventAssignments.length > 0) {
      const personnelData = eventAssignments.map((a) => ({
        姓名: a.name,
        岗位: a.role,
        是否请假: a.onLeave ? '是' : '否',
      }))
      exportToCSV(personnelData, `${eventName}_${dateStr}_人员.csv`)
    }

    if (eventProps.length > 0) {
      const propsData = eventProps.map((p) => ({
        名称: p.propName,
        分类: p.category,
        数量: p.quantity,
        位置: p.location,
      }))
      exportToCSV(propsData, `${eventName}_${dateStr}_道具.csv`)
    }

    if (eventCostumes.length > 0) {
      const costumesData = eventCostumes.map((c) => ({
        名称: c.costumeName,
        角色: c.character,
        尺码: c.size,
        数量: c.quantity,
      }))
      exportToCSV(costumesData, `${eventName}_${dateStr}_服装.csv`)
    }

    if (ticketSales.length > 0 || complementaryTickets.length > 0) {
      const ticketData = [
        ...ticketSales.map((t) => ({
          类型: '售票',
          票种: ({ normal: '普通票', vip: 'VIP票', student: '学生票', complementary: '赠票' } as Record<string, string>)[t.type],
          数量: t.quantity,
          单价: t.price,
          总价: t.total,
        })),
        ...complementaryTickets.map((t) => ({
          类型: '赠票',
          票种: '赠票',
          数量: t.quantity,
          单价: 0,
          总价: 0,
          受赠方: t.recipient,
          事由: t.reason,
        })),
      ]
      exportToCSV(ticketData as any[], `${eventName}_${dateStr}_票务.csv`)
    }

    if (checkItems.length > 0) {
      const checksData = checkItems.map((c) => ({
        分类: ({ lighting: '灯光', sound: '音响', stage: '舞台', other: '其他' } as Record<string, string>)[c.category],
        检查项: c.name,
        状态: c.checked ? '✓ 已检查' : '✗ 未检查',
      }))
      exportToCSV(checksData, `${eventName}_${dateStr}_检查清单.csv`)
    }

    if (logs.length > 0) {
      const logsData = logs.map((l) => ({
        时间: formatDateTime(l.timestamp),
        类型: ({ info: '信息', warning: '警告', action: '操作' } as Record<string, string>)[l.category],
        内容: l.content,
      }))
      exportToCSV(logsData, `${eventName}_${dateStr}_日志.csv`)
    }

    if (incidents.length > 0) {
      const incidentsData = incidents.map((i) => ({
        时间: formatDateTime(i.timestamp),
        标题: i.title,
        严重程度: { minor: '轻微', moderate: '一般', serious: '严重' }[i.severity],
        描述: i.description,
        状态: i.handled ? '已处理' : '待处理',
        处理结果: i.resolution || '',
      }))
      exportToCSV(incidentsData, `${eventName}_${dateStr}_事故记录.csv`)
    }

    if (sortedTimeline.length > 0) {
      const timelineData = sortedTimeline.map((t) => ({
        时间: formatDateTime(t.timestamp),
        类型: timelineTypeLabels[t.type],
        标题: t.title,
        说明: t.description || '',
      }))
      exportToCSV(timelineData, `${eventName}_${dateStr}_执行时间线.csv`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/events')} className="p-2 rounded-lg hover:bg-slate-200 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Badge variant={eventTypeBadge[event.type]}>{eventTypeLabels[event.type]}</Badge>
            <h2 className="text-2xl font-bold text-slate-800">{event.title}</h2>
            {unresolvedIncidents.length > 0 && (
              <Badge variant="danger">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {unresolvedIncidents.length} 事故
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{formatDateTime(event.start)} - {formatTime(event.end)}</span>
            {event.venue && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{event.venue}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setViewMode('panel')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                viewMode === 'panel' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700',
              )}
            >
              执行面板
            </button>
            <button
              onClick={() => setViewMode('sheet')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                viewMode === 'sheet' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700',
              )}
            >
              执行单
            </button>
          </div>
          <Button onClick={handleExportPack}>
            <Download className="w-4 h-4" />
            导出执行包
          </Button>
        </div>
      </div>

      {viewMode === 'panel' && (
        <div className="grid grid-cols-5 gap-3">
          <MiniStat label="排班人数" value={eventAssignments.length} icon={<Users className="w-4 h-4 text-blue-500" />} />
          <MiniStat label="检查进度" value={`${checkedRatio}%`} icon={<ClipboardList className="w-4 h-4 text-amber-500" />} />
          <MiniStat label="售票数" value={totalTickets} icon={<Ticket className="w-4 h-4 text-green-500" />} />
          <MiniStat label="入场观众" value={totalAudience} icon={<Users className="w-4 h-4 text-purple-500" />} />
          <MiniStat label="票房收入" value={`¥${totalRevenue.toLocaleString()}`} icon={<DollarSign className="w-4 h-4 text-amber-500" />} />
        </div>
      )}

      {show && (
        <Card title="剧目信息">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-lg text-slate-800">{show.title}</h4>
              <p className="text-sm text-slate-500 mt-1">{show.genre} · {show.duration}分钟</p>
              {show.description && <p className="text-sm text-slate-600 mt-3 leading-relaxed">{show.description}</p>}
            </div>
            <div className="space-y-2 text-sm">
              {show.director && <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-500">导演</span><span className="text-slate-800 font-medium">{show.director}</span></div>}
              {show.playwright && <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-500">编剧</span><span className="text-slate-800 font-medium">{show.playwright}</span></div>}
            </div>
          </div>
        </Card>
      )}

      {viewMode === 'panel' && (
        <>
          <Card
            title={
              <div className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-violet-500" />
                <span>当天执行时间线</span>
              </div>
            }
        rightAction={
          <Button size="sm" onClick={() => setShowTimelineModal(true)}>
            <Plus className="w-4 h-4" />
            记录节点
          </Button>
        }
      >
        {sortedTimeline.length === 0 ? (
          <p className="text-slate-400 text-center py-6 text-sm">暂无执行时间线记录，点击右上角"记录节点"开始录入</p>
        ) : (
          <div className="relative pl-6">
            <div className="absolute left-2.5 top-1 bottom-1 w-0.5 bg-slate-200" />
            {sortedTimeline.map((t) => (
              <div key={t.id} className="relative pb-4 last:pb-0 group">
                <div className={cn('absolute -left-1 top-1 w-4 h-4 rounded-full border-2 border-white shadow', timelineTypeColors[t.type])} />
                <div className="flex items-start justify-between gap-3 ml-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="default" className="text-xs">{timelineTypeLabels[t.type]}</Badge>
                      <span className="font-medium text-slate-800 text-sm">{t.title}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{formatDateTime(t.timestamp)}</p>
                    {t.description && <p className="text-sm text-slate-600 mt-1">{t.description}</p>}
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('确定删除此时间节点吗？')) deleteTimelineEvent(t.id)
                    }}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-6">
        <Card
          title={
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              <span>人员排班</span>
              {eventAssignments.some((a) => a.onLeave) && (
                <Badge variant="danger">有请假</Badge>
              )}
            </div>
          }
          rightAction={
            <Button size="sm" onClick={() => setShowAssignmentModal(true)}>
              <UserPlus className="w-4 h-4" />
              添加
            </Button>
          }
        >
          {eventAssignments.length === 0 ? (
            <p className="text-slate-400 text-center py-6 text-sm">暂无排班人员</p>
          ) : (
            <div className="space-y-2">
              {eventAssignments.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {a.name[0]}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{a.name}</p>
                      <p className="text-xs text-slate-500">{a.role} · {a.role_label}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {a.onLeave && <Badge variant="danger"><CalendarX className="w-3 h-3 mr-1" />请假</Badge>}
                    <button onClick={() => deleteAssignment(a.id)} className="p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 text-slate-400 hover:text-red-500 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card
          title={<div className="flex items-center gap-2"><ClipboardList className="w-5 h-5 text-amber-500" /><span>灯光音响检查</span>{allChecked && <Badge variant="success">全部完成</Badge>}</div>}
          rightAction={
            <Button size="sm" variant="ghost" onClick={() => setShowCheckItemModal(true)}>
              <Plus className="w-4 h-4" />
              添加项
            </Button>
          }
        >
          <div className="space-y-4">
            <CheckSection title="灯光设备" items={lightingChecks} onToggle={toggleCheckItem} />
            <CheckSection title="音响设备" items={soundChecks} onToggle={toggleCheckItem} />
            <CheckSection title="舞台设施" items={stageChecks} onToggle={toggleCheckItem} />
            {otherChecks.length > 0 && (
              <CheckSection title="其他" items={otherChecks} onToggle={toggleCheckItem} />
            )}
          </div>
          {checkItems.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">总进度</span>
                <span className="font-medium text-slate-800">{checkedRatio}%</span>
              </div>
              <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={cn('h-full rounded-full transition-all', allChecked ? 'bg-green-500' : 'bg-amber-500')} style={{ width: `${checkedRatio}%` }} />
              </div>
            </div>
          )}
          {checkItems.length === 0 && (
            <p className="text-slate-400 text-center py-4 text-sm">暂无检查项，点击右上角"添加项"录入本场次的检查清单</p>
          )}
        </Card>

        <Card
          title={<div className="flex items-center gap-2"><Package className="w-5 h-5 text-amber-500" /><span>道具清单</span></div>}
          rightAction={
            <Button size="sm" onClick={() => setShowPropModal(true)}>
              <Plus className="w-4 h-4" />
              分配
            </Button>
          }
        >
          {eventProps.length === 0 ? (
            <p className="text-slate-400 text-center py-6 text-sm">暂未分配道具</p>
          ) : (
            <div className="space-y-2">
              {eventProps.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center"><Package className="w-4 h-4 text-amber-600" /></div>
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{p.propName}</p>
                      <p className="text-xs text-slate-500">{p.category} · 数量: {p.quantity}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="warning">已分配</Badge>
                    <button onClick={() => deleteEventPropAssignment(p.id)} className="p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 text-slate-400 hover:text-red-500 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card
          title={<div className="flex items-center gap-2"><Shirt className="w-5 h-5 text-purple-500" /><span>服装借还</span></div>}
          rightAction={
            <Button size="sm" onClick={() => setShowCostumeModal(true)}>
              <Plus className="w-4 h-4" />
              分配
            </Button>
          }
        >
          {eventCostumes.length === 0 ? (
            <p className="text-slate-400 text-center py-6 text-sm">暂未分配服装</p>
          ) : (
            <div className="space-y-2">
              {eventCostumes.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center"><Shirt className="w-4 h-4 text-purple-600" /></div>
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{c.costumeName}</p>
                      <p className="text-xs text-slate-500">{c.character || '通用'} · {c.size} · 数量: {c.quantity}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="warning">已分配</Badge>
                    <button onClick={() => deleteEventCostumeAssignment(c.id)} className="p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 text-slate-400 hover:text-red-500 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card
          title={<div className="flex items-center gap-2"><Ticket className="w-5 h-5 text-green-500" /><span>票务入场</span></div>}
          rightAction={
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => setShowTicketModal(true)} title="录入售票">
                <DollarSign className="w-3.5 h-3.5" />
                售票
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowCompModal(true)} title="登记赠票">
                <Gift className="w-3.5 h-3.5" />
                赠票
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAttendanceModal(true)} title="入场统计">
                <Users className="w-3.5 h-3.5" />
                入场
              </Button>
            </div>
          }
        >
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-green-50 text-center">
                <p className="text-2xl font-bold text-green-700">{totalTickets}</p>
                <p className="text-xs text-green-600">已售票</p>
                {ticketSales.length > 0 && (
                  <p className="text-[10px] text-green-500 mt-1">¥{ticketSales.reduce((s, t) => s + t.total, 0).toLocaleString()}</p>
                )}
              </div>
              <div className="p-3 rounded-lg bg-amber-50 text-center">
                <p className="text-2xl font-bold text-amber-700">{totalComp}</p>
                <p className="text-xs text-amber-600">赠票</p>
                {complementaryTickets.length > 0 && (
                  <p className="text-[10px] text-amber-500 mt-1">{complementaryTickets.length} 条记录</p>
                )}
              </div>
              <div className="p-3 rounded-lg bg-blue-50 text-center">
                <p className="text-2xl font-bold text-blue-700">{totalAudience}</p>
                <p className="text-xs text-blue-600">入场</p>
                {attendance.length > 0 && (
                  <p className="text-[10px] text-blue-500 mt-1">最近: {formatTime(attendance[attendance.length - 1].recordedAt)}</p>
                )}
              </div>
            </div>
            {complementaryTickets.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">赠票记录</p>
                {complementaryTickets.map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-1.5 text-sm">
                    <span className="text-slate-700">{t.recipient}</span>
                    <Badge variant="success">{t.quantity} 张 · {t.reason}</Badge>
                  </div>
                ))}
              </div>
            )}
            {ticketSales.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">售票明细</p>
                {[...ticketSales].sort((a, b) => new Date(b.soldAt).getTime() - new Date(a.soldAt).getTime()).slice(0, 3).map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-1.5 text-sm">
                    <span className="text-slate-700">
                      {({ normal: '普通票', vip: 'VIP票', student: '学生票' } as Record<string, string>)[t.type]} × {t.quantity}
                    </span>
                    <span className="text-slate-600">¥{t.total.toLocaleString()}</span>
                  </div>
                ))}
                {ticketSales.length > 3 && (
                  <p className="text-xs text-slate-400 text-center mt-1">还有 {ticketSales.length - 3} 条记录</p>
                )}
              </div>
            )}
          </div>
        </Card>

        <Card
          title={<div className="flex items-center gap-2"><MessageSquare className="w-5 h-5 text-slate-500" /><span>演出日志 & 事故</span></div>}
          rightAction={
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => setShowLogModal(true)}>
                <MessageSquare className="w-3.5 h-3.5" />
                日志
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowIncidentModal(true)}>
                <AlertTriangle className="w-3.5 h-3.5" />
                事故
              </Button>
            </div>
          }
        >
          <div className="space-y-3">
            {incidents.filter((i) => !i.handled).length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-red-500">待处理事故</p>
                {incidents.filter((i) => !i.handled).map((i) => (
                  <div key={i.id} className="p-3 rounded-lg bg-red-50 border border-red-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-red-700 text-sm">{i.title}</span>
                        <Badge variant={i.severity === 'serious' ? 'danger' : i.severity === 'moderate' ? 'warning' : 'default'} className="ml-2">
                          {{ minor: '轻微', moderate: '一般', serious: '严重' }[i.severity]}
                        </Badge>
                      </div>
                      <Button size="sm" onClick={() => { setHandleTarget(i.id); setResolution(''); setShowHandleModal(true) }}>
                        <Check className="w-3.5 h-3.5" />
                        处理
                      </Button>
                    </div>
                    <p className="text-xs text-red-600 mt-1">{i.description}</p>
                  </div>
                ))}
              </div>
            )}
            {logs.length > 0 ? (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-slate-500">最近日志</p>
                {[...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5).map((l) => (
                  <div key={l.id} className="flex items-start gap-2 py-1.5">
                    <Badge variant={l.category === 'warning' ? 'warning' : l.category === 'action' ? 'success' : 'info'} className="mt-0.5 flex-shrink-0">
                      {{ info: '信息', warning: '警告', action: '操作' }[l.category]}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700">{l.content}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{formatDateTime(l.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-center py-4 text-sm">暂无日志</p>
            )}
          </div>
        </Card>
      </div>
        </>
      )}

      {viewMode === 'sheet' && (
        <Card className="mb-4">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-xl font-bold text-slate-800">{event.title} · 当日执行单</h3>
              <p className="text-sm text-slate-500 mt-1">
                {formatDateTime(event.start)} - {formatTime(event.end)} · {event.venue || '未安排场地'}
              </p>
            </div>
            <Badge variant={eventTypeBadge[event.type]}>{eventTypeLabels[event.type]}</Badge>
          </div>

          <div className="space-y-8">
            <section>
              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                人员到场确认
                <span className="text-xs text-slate-400 font-normal">（{eventAssignments.length} 人排班）</span>
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {eventAssignments.length === 0 ? (
                  <p className="text-slate-400 text-sm col-span-2 text-center py-3">暂无排班人员</p>
                ) : (
                  eventAssignments.map((a) => (
                    <label key={a.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer border border-slate-100">
                      <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800">{a.name}</p>
                        <p className="text-xs text-slate-500">{a.role}</p>
                      </div>
                      {a.onLeave && <Badge variant="danger" className="text-[10px]">请假</Badge>}
                    </label>
                  ))
                )}
              </div>
            </section>

            <section>
              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-500" />
                道具到位确认
                <span className="text-xs text-slate-400 font-normal">（{eventPropAssignments.length} 项）</span>
              </h4>
              <div className="space-y-2">
                {eventPropAssignments.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-3">暂无分配道具</p>
                ) : (
                  eventPropAssignments.map((a) => {
                    const prop = allProps.find((p) => p.id === a.propId)
                    return (
                      <label key={a.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer border border-slate-100">
                        <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-800">{prop?.name || '未知道具'}</p>
                          <p className="text-xs text-slate-500">{prop?.category || ''} · 数量 {a.quantity}</p>
                        </div>
                        {a.notes && <span className="text-xs text-slate-400">{a.notes}</span>}
                      </label>
                    )
                  })
                )}
              </div>
            </section>

            <section>
              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Shirt className="w-4 h-4 text-purple-500" />
                服装到位确认
                <span className="text-xs text-slate-400 font-normal">（{eventCostumeAssignments.length} 项）</span>
              </h4>
              <div className="space-y-2">
                {eventCostumeAssignments.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-3">暂无分配服装</p>
                ) : (
                  eventCostumeAssignments.map((a) => {
                    const costume = allCostumes.find((c) => c.id === a.costumeId)
                    return (
                      <label key={a.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer border border-slate-100">
                        <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-800">{costume?.name || '未知服装'}</p>
                          <p className="text-xs text-slate-500">{costume?.character || ''} · {costume?.size || ''} · 数量 {a.quantity}</p>
                        </div>
                        {a.notes && <span className="text-xs text-slate-400">{a.notes}</span>}
                      </label>
                    )
                  })
                )}
              </div>
            </section>

            <section>
              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-green-500" />
                灯光音响检查
                <span className="text-xs text-slate-400 font-normal">（{checkItems.filter(c => c.checked).length}/{checkItems.length} 已完成）</span>
              </h4>
              <div className="space-y-4">
                {['lighting', 'sound', 'stage', 'other'].map((cat) => {
                  const catItems = checkItems.filter((c) => c.category === cat)
                  if (catItems.length === 0) return null
                  const catLabel = { lighting: '灯光', sound: '音响', stage: '舞台', other: '其他' }[cat]
                  return (
                    <div key={cat}>
                      <p className="text-xs text-slate-500 font-medium mb-2">{catLabel}</p>
                      <div className="space-y-1">
                        {catItems.map((item) => (
                          <label key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.checked}
                              onChange={() => toggleCheckItem(item.id)}
                              className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                            />
                            <span className={cn('text-sm flex-1', item.checked ? 'text-slate-400 line-through' : 'text-slate-700')}>
                              {item.name}
                            </span>
                            {item.checkedAt && <span className="text-[10px] text-slate-400">{formatTime(item.checkedAt)}</span>}
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                })}
                {checkItems.length === 0 && (
                  <p className="text-slate-400 text-sm text-center py-3">暂无检查项</p>
                )}
              </div>
            </section>

            <section>
              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Ticket className="w-4 h-4 text-emerald-500" />
                票务 & 入场
              </h4>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="p-3 rounded-lg bg-green-50 text-center">
                  <p className="text-2xl font-bold text-green-700">{totalTickets}</p>
                  <p className="text-xs text-green-600">已售票</p>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 text-center">
                  <p className="text-2xl font-bold text-amber-700">{totalComp}</p>
                  <p className="text-xs text-amber-600">赠票</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50 text-center">
                  <p className="text-2xl font-bold text-blue-700">{totalAudience}</p>
                  <p className="text-xs text-blue-600">入场</p>
                </div>
              </div>
              {ticketSales.length > 0 && (
                <div className="text-xs text-slate-500">
                  票房收入：<span className="font-medium text-slate-700">¥{totalRevenue.toLocaleString()}</span>
                </div>
              )}
            </section>

            {incidents.length > 0 && (
              <section>
                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  事故记录
                  <span className="text-xs text-slate-400 font-normal">（{incidents.length} 条）</span>
                </h4>
                <div className="space-y-2">
                  {incidents.map((i) => (
                    <div key={i.id} className="p-3 rounded-lg border border-slate-100">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-800">{i.title}</p>
                        <Badge variant={i.handled ? 'success' : 'danger'} className="text-[10px]">
                          {i.handled ? '已处理' : '待处理'}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {formatDateTime(i.timestamp)} · {{ minor: '轻微', moderate: '一般', serious: '严重' }[i.severity]}
                      </p>
                      {i.description && <p className="text-xs text-slate-600 mt-1">{i.description}</p>}
                      {i.handled && i.resolution && (
                        <p className="text-xs text-green-600 mt-2 pt-2 border-t border-slate-100">处理结果：{i.resolution}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-violet-500" />
                执行时间线
              </h4>
              <div className="relative pl-6">
                <div className="absolute left-2.5 top-1 bottom-1 w-0.5 bg-slate-200" />
                {sortedTimeline.length === 0 ? (
                  <p className="text-slate-400 text-sm">暂无时间线记录</p>
                ) : (
                  sortedTimeline.map((t) => (
                    <div key={t.id} className="relative pb-4 last:pb-0">
                      <div className={cn('absolute -left-1 top-1 w-4 h-4 rounded-full border-2 border-white shadow', timelineTypeColors[t.type])} />
                      <div className="ml-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className="text-[10px]">{timelineTypeLabels[t.type]}</Badge>
                          <span className="font-medium text-slate-800 text-sm">{t.title}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{formatDateTime(t.timestamp)}</p>
                        {t.description && <p className="text-xs text-slate-600 mt-1">{t.description}</p>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-center">
            <p className="text-xs text-slate-400">执行单生成时间：{formatDateTime(new Date().toISOString())}</p>
            <Button onClick={handleExportPack}>
              <Download className="w-4 h-4" />
              导出执行单
            </Button>
          </div>
        </Card>
      )}

      <Modal open={showAssignmentModal} onClose={() => setShowAssignmentModal(false)} title="添加排班人员" size="sm" footer={
        <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setShowAssignmentModal(false)}>取消</Button><Button onClick={handleAddAssignment}>添加</Button></div>
      }>
        <div className="space-y-4">
          <Select label="人员" value={newAssignment.personnelId} onChange={(e) => setNewAssignment({ ...newAssignment, personnelId: e.target.value })} options={[{ value: '', label: '请选择' }, ...personnel.map((p) => ({ value: p.id, label: p.name }))]} />
          <Input label="岗位/角色" value={newAssignment.role} onChange={(e) => setNewAssignment({ ...newAssignment, role: e.target.value })} placeholder="如：男主角、灯光师、场务等" />
        </div>
      </Modal>

      <Modal open={showCheckItemModal} onClose={() => setShowCheckItemModal(false)} title="添加检查项" size="sm" footer={
        <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setShowCheckItemModal(false)}>取消</Button><Button onClick={handleAddCheckItem}>添加</Button></div>
      }>
        <div className="space-y-4">
          <Select label="分类" value={newCheckItem.category} onChange={(e) => setNewCheckItem({ ...newCheckItem, category: e.target.value as CheckItem['category'] })} options={[
            { value: 'lighting', label: '灯光' },
            { value: 'sound', label: '音响' },
            { value: 'stage', label: '舞台' },
            { value: 'other', label: '其他' },
          ]} />
          <Input label="检查项名称" value={newCheckItem.name} onChange={(e) => setNewCheckItem({ ...newCheckItem, name: e.target.value })} placeholder="如：追光灯、无线麦克风等" />
        </div>
      </Modal>

      <Modal open={showPropModal} onClose={() => setShowPropModal(false)} title="分配道具" size="sm" footer={
        <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setShowPropModal(false)}>取消</Button><Button onClick={handleAddProp}>分配</Button></div>
      }>
        <div className="space-y-4">
          <Select label="道具" value={newProp.propId} onChange={(e) => setNewProp({ ...newProp, propId: e.target.value })} options={[{ value: '', label: '请选择道具' }, ...allProps.map((p) => ({ value: p.id, label: `${p.name}（${p.category}）` }))]} />
          <Input label="数量" type="number" min={1} value={newProp.quantity} onChange={(e) => setNewProp({ ...newProp, quantity: parseInt(e.target.value) || 1 })} />
        </div>
      </Modal>

      <Modal open={showCostumeModal} onClose={() => setShowCostumeModal(false)} title="分配服装" size="sm" footer={
        <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setShowCostumeModal(false)}>取消</Button><Button onClick={handleAddCostume}>分配</Button></div>
      }>
        <div className="space-y-4">
          <Select label="服装" value={newCostume.costumeId} onChange={(e) => setNewCostume({ ...newCostume, costumeId: e.target.value })} options={[{ value: '', label: '请选择服装' }, ...allCostumes.map((c) => ({ value: c.id, label: `${c.name}（${c.character || '通用'} ${c.size}）` }))]} />
          <Input label="数量" type="number" min={1} value={newCostume.quantity} onChange={(e) => setNewCostume({ ...newCostume, quantity: parseInt(e.target.value) || 1 })} />
        </div>
      </Modal>

      <Modal open={showTimelineModal} onClose={() => setShowTimelineModal(false)} title="记录执行节点" size="md" footer={
        <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setShowTimelineModal(false)}>取消</Button><Button onClick={handleAddTimeline}>保存</Button></div>
      }>
        <div className="space-y-4">
          <Select label="节点类型" value={newTimeline.type} onChange={(e) => setNewTimeline({ ...newTimeline, type: e.target.value as TimelineEventType })} options={[
            { value: 'arrival', label: '到场签到' },
            { value: 'check_complete', label: '检查完成' },
            { value: 'ticket_open', label: '开票' },
            { value: 'entrance', label: '入场' },
            { value: 'curtain_up', label: '大幕拉开' },
            { value: 'intermission', label: '中场休息' },
            { value: 'curtain_down', label: '大幕落下' },
            { value: 'incident', label: '事故' },
            { value: 'incident_resolved', label: '事故解决' },
            { value: 'other', label: '其他' },
          ]} />
          <Input label="时间" type="datetime-local" value={newTimeline.timestamp} onChange={(e) => setNewTimeline({ ...newTimeline, timestamp: e.target.value })} />
          <Input label="标题" value={newTimeline.title} onChange={(e) => setNewTimeline({ ...newTimeline, title: e.target.value })} placeholder="简要描述这个节点" />
          <TextArea label="详细说明（可选）" value={newTimeline.description} onChange={(e) => setNewTimeline({ ...newTimeline, description: e.target.value })} rows={3} />
        </div>
      </Modal>

      <Modal open={showLogModal} onClose={() => setShowLogModal(false)} title="记录演出日志" size="md" footer={
        <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setShowLogModal(false)}>取消</Button><Button onClick={handleAddLog}>保存</Button></div>
      }>
        <div className="space-y-4">
          <Select label="日志类型" value={logForm.category} onChange={(e) => setLogForm({ ...logForm, category: e.target.value as PerformanceLog['category'] })} options={[{ value: 'info', label: '信息' }, { value: 'warning', label: '警告' }, { value: 'action', label: '操作' }]} />
          <TextArea label="日志内容" value={logForm.content} onChange={(e) => setLogForm({ ...logForm, content: e.target.value })} placeholder="记录演出现场发生的事件..." rows={4} />
        </div>
      </Modal>

      <Modal open={showIncidentModal} onClose={() => setShowIncidentModal(false)} title="记录事故" size="md" footer={
        <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setShowIncidentModal(false)}>取消</Button><Button variant="danger" onClick={handleAddIncident}>提交</Button></div>
      }>
        <div className="space-y-4">
          <Input label="事故标题" value={incidentForm.title} onChange={(e) => setIncidentForm({ ...incidentForm, title: e.target.value })} placeholder="简要描述事故" />
          <Select label="严重程度" value={incidentForm.severity} onChange={(e) => setIncidentForm({ ...incidentForm, severity: e.target.value as IncidentRecord['severity'] })} options={[{ value: 'minor', label: '轻微' }, { value: 'moderate', label: '一般' }, { value: 'serious', label: '严重' }]} />
          <TextArea label="详细描述" value={incidentForm.description} onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })} rows={4} />
        </div>
      </Modal>

      <Modal open={showHandleModal} onClose={() => setShowHandleModal(false)} title="处理事故" size="md" footer={
        <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setShowHandleModal(false)}>取消</Button><Button variant="success" onClick={handleResolveIncident}><Check className="w-4 h-4" />确认</Button></div>
      }>
        <TextArea label="处理结果" value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="描述处理方式和结果..." rows={4} />
      </Modal>

      <Modal
        open={showTicketModal}
        onClose={() => setShowTicketModal(false)}
        title="录入售票"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowTicketModal(false)}>取消</Button>
            <Button onClick={handleAddTicket}>保存</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="票种"
              value={ticketForm.type}
              onChange={(e) => setTicketForm({ ...ticketForm, type: e.target.value })}
              options={[
                { value: 'normal', label: '普通票' },
                { value: 'vip', label: 'VIP票' },
                { value: 'student', label: '学生票' },
              ]}
            />
            <Input
              label="售票人"
              value={ticketForm.soldBy}
              onChange={(e) => setTicketForm({ ...ticketForm, soldBy: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="数量"
              type="number"
              min={1}
              value={ticketForm.quantity}
              onChange={(e) => setTicketForm({ ...ticketForm, quantity: parseInt(e.target.value) || 1 })}
            />
            <Input
              label="单价 (¥)"
              type="number"
              min={0}
              value={ticketForm.price}
              onChange={(e) => setTicketForm({ ...ticketForm, price: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="p-4 rounded-lg bg-amber-50 flex items-center justify-between">
            <span className="text-sm text-amber-700">应收金额</span>
            <span className="text-2xl font-bold text-amber-700">
              ¥{(ticketForm.quantity * ticketForm.price).toLocaleString()}
            </span>
          </div>
          <Input
            label="备注"
            value={ticketForm.notes}
            onChange={(e) => setTicketForm({ ...ticketForm, notes: e.target.value })}
          />
        </div>
      </Modal>

      <Modal
        open={showCompModal}
        onClose={() => setShowCompModal(false)}
        title="登记赠票"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowCompModal(false)}>取消</Button>
            <Button onClick={handleAddComp}>保存</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="受赠方"
              value={compForm.recipient}
              onChange={(e) => setCompForm({ ...compForm, recipient: e.target.value })}
              placeholder="如：媒体嘉宾、合作单位"
            />
            <Input
              label="数量"
              type="number"
              min={1}
              value={compForm.quantity}
              onChange={(e) => setCompForm({ ...compForm, quantity: parseInt(e.target.value) || 1 })}
            />
          </div>
          <Input
            label="事由"
            value={compForm.reason}
            onChange={(e) => setCompForm({ ...compForm, reason: e.target.value })}
            placeholder="如：媒体宣传、商务合作"
          />
          <Input
            label="登记人"
            value={compForm.issuedBy}
            onChange={(e) => setCompForm({ ...compForm, issuedBy: e.target.value })}
          />
        </div>
      </Modal>

      <Modal
        open={showAttendanceModal}
        onClose={() => setShowAttendanceModal(false)}
        title="录入入场统计"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowAttendanceModal(false)}>取消</Button>
            <Button onClick={handleAddAttendance}>保存</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="普通票入场"
              type="number"
              min={0}
              value={attendanceForm.normalTickets}
              onChange={(e) => setAttendanceForm({ ...attendanceForm, normalTickets: parseInt(e.target.value) || 0 })}
            />
            <Input
              label="VIP票入场"
              type="number"
              min={0}
              value={attendanceForm.vipTickets}
              onChange={(e) => setAttendanceForm({ ...attendanceForm, vipTickets: parseInt(e.target.value) || 0 })}
            />
            <Input
              label="学生票入场"
              type="number"
              min={0}
              value={attendanceForm.studentTickets}
              onChange={(e) => setAttendanceForm({ ...attendanceForm, studentTickets: parseInt(e.target.value) || 0 })}
            />
            <Input
              label="赠票入场"
              type="number"
              min={0}
              value={attendanceForm.complementaryTickets}
              onChange={(e) => setAttendanceForm({ ...attendanceForm, complementaryTickets: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="p-4 rounded-lg bg-green-50 flex items-center justify-between">
            <span className="text-sm text-green-700">入场总人数</span>
            <span className="text-2xl font-bold text-green-700">
              {attendanceForm.normalTickets +
                attendanceForm.vipTickets +
                attendanceForm.studentTickets +
                attendanceForm.complementaryTickets}{' '}
              人
            </span>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function MiniStat({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-slate-50">{icon}</div>
        <div>
          <p className="text-xs text-slate-500">{label}</p>
          <p className="text-lg font-bold text-slate-800">{value}</p>
        </div>
      </div>
    </Card>
  )
}

function CheckSection({ title, items, onToggle }: { title: string; items: CheckItem[]; onToggle: (id: string) => void }) {
  const checked = items.filter((i) => i.checked).length
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-700">{title}</span>
        <span className="text-xs text-slate-500">{checked}/{items.length}</span>
      </div>
      <div className="space-y-1.5">
        {items.map((item) => (
          <label key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer group">
            <input type="checkbox" checked={item.checked} onChange={() => onToggle(item.id)} className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500" />
            <span className={cn('text-sm flex-1', item.checked ? 'text-slate-400 line-through' : 'text-slate-700')}>{item.name}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
