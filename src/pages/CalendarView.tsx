import { useState, useMemo } from 'react'
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  format,
  parseISO,
  addDays,
} from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  AlertTriangle,
  Trash2,
  Edit2,
  MapPin,
  Users,
  Package,
  Shirt,
} from 'lucide-react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { useAppStore } from '../store'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import Input from '../components/Input'
import Select from '../components/Select'
import TextArea from '../components/TextArea'
import type { ScheduleEvent, EventType } from '../types'
import { cn, formatDateTime, formatTime, formatDate } from '../lib/utils'
import { useNavigate } from 'react-router-dom'

const eventTypeLabels: Record<EventType, string> = {
  show: '演出',
  rehearsal: '排练',
  setup: '装台',
  teardown: '撤场',
}

const eventTypeColors: Record<EventType, string> = {
  show: 'event-show',
  rehearsal: 'event-rehearsal',
  setup: 'event-setup',
  teardown: 'event-teardown',
}

const eventTypeBadge: Record<EventType, 'danger' | 'info' | 'success' | 'purple'> = {
  show: 'danger',
  rehearsal: 'info',
  setup: 'success',
  teardown: 'purple',
}

export interface ConflictDetail {
  type: 'venue' | 'personnel' | 'prop' | 'costume'
  label: string
  resourceId: string
  resourceName: string
  conflictingEventId: string
  conflictingEventTitle: string
}

export interface ConflictResult {
  eventId: string
  timeConflicts: string[]
  details: ConflictDetail[]
}

function timeOverlaps(a: ScheduleEvent, b: ScheduleEvent): boolean {
  const aStart = parseISO(a.start).getTime()
  const aEnd = parseISO(a.end).getTime()
  const bStart = parseISO(b.start).getTime()
  const bEnd = parseISO(b.end).getTime()
  return aStart < bEnd && bStart < aEnd
}

function detectConflicts(
  targetEvent: ScheduleEvent,
  allEvents: ScheduleEvent[],
  assignments: { eventId: string; personnelId: string; role: string }[],
  eventPropAssignments: { eventId: string; propId: string }[],
  eventCostumeAssignments: { eventId: string; costumeId: string }[],
  props: { id: string; name: string }[],
  costumes: { id: string; name: string }[],
  personnel: { id: string; name: string }[],
): ConflictResult {
  const result: ConflictResult = {
    eventId: targetEvent.id,
    timeConflicts: [],
    details: [],
  }

  const overlapping = allEvents.filter(
    (e) => e.id !== targetEvent.id && timeOverlaps(targetEvent, e),
  )
  result.timeConflicts = overlapping.map((e) => e.id)

  for (const other of overlapping) {
    if (
      targetEvent.venue &&
      other.venue &&
      targetEvent.venue === other.venue
    ) {
      result.details.push({
        type: 'venue',
        label: '场地冲突',
        resourceId: targetEvent.venue,
        resourceName: targetEvent.venue,
        conflictingEventId: other.id,
        conflictingEventTitle: other.title,
      })
    }

    const targetPersonnel = assignments
      .filter((a) => a.eventId === targetEvent.id)
      .map((a) => a.personnelId)
    const otherPersonnel = assignments
      .filter((a) => a.eventId === other.id)
      .map((a) => a.personnelId)
    for (const pid of targetPersonnel) {
      if (otherPersonnel.includes(pid)) {
        const p = personnel.find((x) => x.id === pid)
        result.details.push({
          type: 'personnel',
          label: '人员冲突',
          resourceId: pid,
          resourceName: p?.name || '未知',
          conflictingEventId: other.id,
          conflictingEventTitle: other.title,
        })
      }
    }

    const targetPropIds = eventPropAssignments
      .filter((a) => a.eventId === targetEvent.id)
      .map((a) => a.propId)
    const otherPropIds = eventPropAssignments
      .filter((a) => a.eventId === other.id)
      .map((a) => a.propId)
    for (const propId of targetPropIds) {
      if (otherPropIds.includes(propId)) {
        const p = props.find((x) => x.id === propId)
        result.details.push({
          type: 'prop',
          label: '道具冲突',
          resourceId: propId,
          resourceName: p?.name || '未知',
          conflictingEventId: other.id,
          conflictingEventTitle: other.title,
        })
      }
    }

    const targetCostumeIds = eventCostumeAssignments
      .filter((a) => a.eventId === targetEvent.id)
      .map((a) => a.costumeId)
    const otherCostumeIds = eventCostumeAssignments
      .filter((a) => a.eventId === other.id)
      .map((a) => a.costumeId)
    for (const costumeId of targetCostumeIds) {
      if (otherCostumeIds.includes(costumeId)) {
        const c = costumes.find((x) => x.id === costumeId)
        result.details.push({
          type: 'costume',
          label: '服装冲突',
          resourceId: costumeId,
          resourceName: c?.name || '未知',
          conflictingEventId: other.id,
          conflictingEventTitle: other.title,
        })
      }
    }
  }

  const seen = new Set<string>()
  result.details = result.details.filter((d) => {
    const key = `${d.type}-${d.resourceId}-${d.conflictingEventId}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return result
}

function DraggableEvent({
  event,
  hasConflict,
  onClick,
}: {
  event: ScheduleEvent
  hasConflict: boolean
  onClick: () => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: event.id,
    data: { event },
  })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={cn(
        'text-white text-xs px-2 py-1 rounded cursor-grab active:cursor-grabbing truncate hover:opacity-90 transition-opacity',
        eventTypeColors[event.type],
        hasConflict && 'conflict-event',
        isDragging && 'opacity-50 shadow-lg',
      )}
      title={`${event.title} - ${formatDateTime(event.start)}`}
    >
      <div className="flex items-center gap-1">
        <span className="font-medium truncate">{event.title}</span>
        {hasConflict && (
          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
        )}
      </div>
      <div className="text-[10px] opacity-80">
        {format(parseISO(event.start), 'HH:mm')} - {format(parseISO(event.end), 'HH:mm')}
      </div>
    </div>
  )
}

function DroppableDayCell({
  date,
  dateKey,
  isToday,
  isCurrentMonth,
  dayEvents,
  conflicts,
  onDayClick,
  onEventClick,
}: {
  date: Date
  dateKey: string
  isToday: boolean
  isCurrentMonth: boolean
  dayEvents: ScheduleEvent[]
  conflicts: Record<string, ConflictResult>
  onDayClick: () => void
  onEventClick: (event: ScheduleEvent) => void
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: dateKey,
    data: { date },
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-h-[120px] p-2 border border-slate-100 transition-all cursor-pointer',
        !isCurrentMonth && 'bg-slate-50/50',
        isToday && 'bg-amber-50/50',
        isOver && 'bg-violet-50 border-violet-300 border-dashed',
        !isOver && 'hover:bg-slate-50',
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) onDayClick()
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <span
          className={cn(
            'text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full',
            isToday && 'bg-amber-500 text-white',
            !isCurrentMonth && 'text-slate-300',
            !isToday && isCurrentMonth && 'text-slate-700',
          )}
        >
          {format(date, 'd')}
        </span>
      </div>
      <div className="space-y-1">
        {dayEvents.slice(0, 3).map((event) => {
          const hasConflict =
            conflicts[event.id] &&
            (conflicts[event.id].timeConflicts.length > 0 || conflicts[event.id].details.length > 0)
          return (
            <DraggableEvent
              key={event.id}
              event={event}
              hasConflict={hasConflict}
              onClick={() => onEventClick(event)}
            />
          )
        })}
        {dayEvents.length > 3 && (
          <div className="text-xs text-slate-500 pl-2">+{dayEvents.length - 3} 更多</div>
        )}
      </div>
    </div>
  )
}

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [dragEvent, setDragEvent] = useState<ScheduleEvent | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null)
  const [showConflictModal, setShowConflictModal] = useState(false)
  const [selectedConflictEvent, setSelectedConflictEvent] = useState<ScheduleEvent | null>(null)
  const [formData, setFormData] = useState({
    type: 'show' as EventType,
    title: '',
    start: '',
    end: '',
    showId: '',
    venue: '',
    description: '',
  })

  const events = useAppStore((s) => s.events)
  const shows = useAppStore((s) => s.shows)
  const assignments = useAppStore((s) => s.assignments)
  const allProps = useAppStore((s) => s.props)
  const allCostumes = useAppStore((s) => s.costumes)
  const eventPropAssignments = useAppStore((s) => s.eventPropAssignments)
  const eventCostumeAssignments = useAppStore((s) => s.eventCostumeAssignments)
  const personnel = useAppStore((s) => s.personnel)
  const addEvent = useAppStore((s) => s.addEvent)
  const updateEvent = useAppStore((s) => s.updateEvent)
  const deleteEvent = useAppStore((s) => s.deleteEvent)
  const navigate = useNavigate()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  )

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const conflicts = useMemo(() => {
    const result: Record<string, ConflictResult> = {}
    events.forEach((e) => {
      const c = detectConflicts(e, events, assignments, eventPropAssignments, eventCostumeAssignments, allProps, allCostumes, personnel)
      if (c.timeConflicts.length > 0 || c.details.length > 0) {
        result[e.id] = c
      }
    })
    return result
  }, [events, assignments, eventPropAssignments, eventCostumeAssignments, allProps, allCostumes, personnel])

  const eventsByDate = useMemo(() => {
    const map: Record<string, ScheduleEvent[]> = {}
    events.forEach((e) => {
      const start = parseISO(e.start)
      const end = parseISO(e.end)
      let day = start
      while (day <= end) {
        const key = format(day, 'yyyy-MM-dd')
        if (!map[key]) map[key] = []
        if (!map[key].includes(e)) map[key].push(e)
        day = addDays(day, 1)
      }
    })
    Object.values(map).forEach((arr) =>
      arr.sort((a, b) => parseISO(a.start).getTime() - parseISO(b.start).getTime()),
    )
    return map
  }, [events])

  const today = new Date()

  const openNewEvent = (date?: Date) => {
    const base = date || new Date()
    const start = new Date(base)
    start.setHours(19, 0, 0, 0)
    const end = new Date(base)
    end.setHours(21, 0, 0, 0)
    setEditingEvent(null)
    setFormData({
      type: 'show',
      title: '',
      start: format(start, "yyyy-MM-dd'T'HH:mm"),
      end: format(end, "yyyy-MM-dd'T'HH:mm"),
      showId: '',
      venue: '主剧场',
      description: '',
    })
    setShowModal(true)
  }

  const openEditEvent = (event: ScheduleEvent) => {
    setEditingEvent(event)
    setFormData({
      type: event.type,
      title: event.title,
      start: format(parseISO(event.start), "yyyy-MM-dd'T'HH:mm"),
      end: format(parseISO(event.end), "yyyy-MM-dd'T'HH:mm"),
      showId: event.showId || '',
      venue: event.venue || '',
      description: event.description || '',
    })
    setShowModal(true)
  }

  const handleSave = () => {
    if (!formData.title || !formData.start || !formData.end) return
    const eventData = {
      type: formData.type,
      title: formData.title,
      start: new Date(formData.start).toISOString(),
      end: new Date(formData.end).toISOString(),
      showId: formData.showId || undefined,
      venue: formData.venue,
      description: formData.description,
    }
    if (editingEvent) {
      updateEvent(editingEvent.id, eventData)
    } else {
      addEvent(eventData)
    }
    setShowModal(false)
  }

  const handleDelete = () => {
    if (editingEvent && confirm('确定删除此排期吗？')) {
      deleteEvent(editingEvent.id)
      setShowModal(false)
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const ev = events.find((e) => e.id === event.active.id)
    if (ev) setDragEvent(ev)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setDragEvent(null)
    if (!event.over || !dragEvent) return

    const targetDateStr = String(event.over.id)
    const targetDate = parseISO(targetDateStr)
    const originalStart = parseISO(dragEvent.start)
    const originalEnd = parseISO(dragEvent.end)

    const newStart = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate(),
      originalStart.getHours(),
      originalStart.getMinutes(),
      originalStart.getSeconds(),
      originalStart.getMilliseconds(),
    )
    const durationMs = originalEnd.getTime() - originalStart.getTime()
    const newEnd = new Date(newStart.getTime() + durationMs)

    updateEvent(dragEvent.id, {
      start: newStart.toISOString(),
      end: newEnd.toISOString(),
    })
  }

  const openConflictDetail = (event: ScheduleEvent) => {
    setSelectedConflictEvent(event)
    setShowConflictModal(true)
  }

  const weekDays = ['一', '二', '三', '四', '五', '六', '日']
  const totalConflicts = Object.keys(conflicts).length
  const totalDetailCount = Object.values(conflicts).reduce(
    (sum, c) => sum + c.details.length,
    0,
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">日历总览</h2>
          <p className="text-sm text-slate-500 mt-1">拖拽事件可快速调整日期，点击可查看详情</p>
        </div>
        <div className="flex items-center gap-3">
          {totalDetailCount > 0 && (
            <button
              onClick={() => {
                if (totalConflicts > 0) {
                  const firstConflictEvent = events.find((e) => conflicts[e.id])
                  if (firstConflictEvent) openConflictDetail(firstConflictEvent)
                }
              }}
              className="cursor-pointer"
            >
              <Badge variant="danger">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {totalDetailCount} 项冲突
              </Badge>
            </button>
          )}
          <Button onClick={() => openNewEvent()}>
            <Plus className="w-4 h-4" />
            新建排期
          </Button>
        </div>
      </div>

      <div className="flex gap-4 flex-wrap">
        {Object.entries(eventTypeLabels).map(([type, label]) => (
          <div key={type} className="flex items-center gap-2">
            <div className={cn('w-3 h-3 rounded-full', eventTypeColors[type as EventType])} />
            <span className="text-sm text-slate-600">{label}</span>
          </div>
        ))}
      </div>

      <Card>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-bold text-slate-800">
              {format(currentDate, 'yyyy年 M月', { locale: zhCN })}
            </h3>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-2 rounded-lg hover:bg-slate-100 text-sm text-slate-600 transition-colors"
              >
                今天
              </button>
              <button
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((d) => (
              <div
                key={d}
                className="text-center text-sm font-medium text-slate-500 py-2 bg-slate-50"
              >
                {d}
              </div>
            ))}

            {days.map((day) => {
              const key = format(day, 'yyyy-MM-dd')
              const dayEvents = eventsByDate[key] || []
              const isToday = isSameDay(day, today)
              const isCurrentMonth = isSameMonth(day, currentDate)

              return (
                <DroppableDayCell
                  key={key}
                  date={day}
                  dateKey={key}
                  isToday={isToday}
                  isCurrentMonth={isCurrentMonth}
                  dayEvents={dayEvents}
                  conflicts={conflicts}
                  onDayClick={() => openNewEvent(day)}
                  onEventClick={(event) => {
                    const c = conflicts[event.id]
                    if (c && (c.timeConflicts.length > 0 || c.details.length > 0)) {
                      openConflictDetail(event)
                    } else {
                      openEditEvent(event)
                    }
                  }}
                />
              )
            })}
          </div>

          <DragOverlay>
            {dragEvent && (
              <div
                className={cn(
                  'text-white text-sm px-3 py-2 rounded-lg shadow-2xl opacity-90',
                  eventTypeColors[dragEvent.type],
                )}
              >
                <div className="font-medium">{dragEvent.title}</div>
                <div className="text-xs opacity-80">
                  {format(parseISO(dragEvent.start), 'HH:mm')} - {format(parseISO(dragEvent.end), 'HH:mm')}
                </div>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </Card>

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="本月演出"
          value={events.filter((e) => e.type === 'show' && isSameMonth(parseISO(e.start), currentDate)).length}
          icon={<CalendarIcon className="w-5 h-5 text-red-500" />}
        />
        <StatCard
          title="本月排练"
          value={events.filter((e) => e.type === 'rehearsal' && isSameMonth(parseISO(e.start), currentDate)).length}
          icon={<CalendarIcon className="w-5 h-5 text-blue-500" />}
        />
        <StatCard
          title="装台任务"
          value={events.filter((e) => e.type === 'setup' && isSameMonth(parseISO(e.start), currentDate)).length}
          icon={<CalendarIcon className="w-5 h-5 text-green-500" />}
        />
        <StatCard
          title="撤场任务"
          value={events.filter((e) => e.type === 'teardown' && isSameMonth(parseISO(e.start), currentDate)).length}
          icon={<CalendarIcon className="w-5 h-5 text-purple-500" />}
        />
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingEvent ? '编辑排期' : '新建排期'}
        size="md"
        footer={
          <div className="flex justify-between">
            {editingEvent ? (
              <Button variant="danger" onClick={handleDelete}>
                <Trash2 className="w-4 h-4" />
                删除
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                取消
              </Button>
              <Button onClick={handleSave}>保存</Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="类型"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as EventType })}
              options={Object.entries(eventTypeLabels).map(([v, l]) => ({ value: v, label: l }))}
            />
            <Select
              label="关联剧目"
              value={formData.showId}
              onChange={(e) => setFormData({ ...formData, showId: e.target.value })}
              options={[
                { value: '', label: '无' },
                ...shows.map((s) => ({ value: s.id, label: s.title })),
              ]}
            />
          </div>
          <Input
            label="标题"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="请输入排期标题"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="开始时间"
              type="datetime-local"
              value={formData.start}
              onChange={(e) => setFormData({ ...formData, start: e.target.value })}
            />
            <Input
              label="结束时间"
              type="datetime-local"
              value={formData.end}
              onChange={(e) => setFormData({ ...formData, end: e.target.value })}
            />
          </div>
          <Input
            label="场地"
            value={formData.venue}
            onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
            placeholder="如：主剧场、排练厅A"
          />
          <TextArea
            label="备注"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="备注信息..."
            rows={3}
          />
          {editingEvent && (
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => navigate(`/events/${editingEvent.id}`)}
            >
              <Edit2 className="w-4 h-4" />
              进入执行面板
            </Button>
          )}
        </div>
      </Modal>

      <Modal
        open={showConflictModal}
        onClose={() => setShowConflictModal(false)}
        title="冲突详情"
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            {selectedConflictEvent && (
              <Button
                variant="secondary"
                onClick={() => {
                  setShowConflictModal(false)
                  openEditEvent(selectedConflictEvent)
                }}
              >
                编辑排期
              </Button>
            )}
            <Button onClick={() => setShowConflictModal(false)}>关闭</Button>
          </div>
        }
      >
        {selectedConflictEvent && (() => {
          const c = conflicts[selectedConflictEvent.id]
          if (!c) return <p className="text-slate-400 text-center py-8">无冲突</p>

          const grouped: Record<string, ConflictDetail[]> = {}
          c.details.forEach((d) => {
            if (!grouped[d.type]) grouped[d.type] = []
            grouped[d.type].push(d)
          })

          const typeIcons: Record<string, React.ReactNode> = {
            venue: <MapPin className="w-4 h-4 text-red-500" />,
            personnel: <Users className="w-4 h-4 text-blue-500" />,
            prop: <Package className="w-4 h-4 text-amber-500" />,
            costume: <Shirt className="w-4 h-4 text-purple-500" />,
          }
          const typeLabels: Record<string, string> = {
            venue: '场地冲突',
            personnel: '人员冲突',
            prop: '道具冲突',
            costume: '服装冲突',
          }

          return (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <span className="font-semibold text-red-700">{selectedConflictEvent.title}</span>
                </div>
                <p className="text-sm text-red-600">
                  {formatDateTime(selectedConflictEvent.start)} - {formatTime(selectedConflictEvent.end)}
                  {selectedConflictEvent.venue && ` · ${selectedConflictEvent.venue}`}
                </p>
                <p className="text-sm text-red-500 mt-1">
                  共 {c.timeConflicts.length} 个时间重叠，{c.details.length} 项资源冲突
                </p>
              </div>

              {Object.entries(grouped).map(([type, items]) => (
                <div key={type} className="space-y-2">
                  <div className="flex items-center gap-2 font-medium text-slate-700">
                    {typeIcons[type]}
                    {typeLabels[type]}
                    <Badge variant={type === 'venue' ? 'danger' : type === 'personnel' ? 'info' : type === 'prop' ? 'warning' : 'purple'}>
                      {items.length} 项
                    </Badge>
                  </div>
                  <div className="space-y-1.5 ml-6">
                    {items.map((item, idx) => {
                      const otherEvent = events.find((e) => e.id === item.conflictingEventId)
                      return (
                        <div
                          key={`${item.type}-${item.resourceId}-${item.conflictingEventId}-${idx}`}
                          className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-slate-800 text-sm">{item.resourceName}</span>
                            <span className="text-xs text-slate-500">与</span>
                            <button
                              onClick={() => {
                                if (otherEvent) {
                                  setSelectedConflictEvent(otherEvent)
                                }
                              }}
                              className="text-sm text-blue-600 hover:underline font-medium"
                            >
                              {item.conflictingEventTitle}
                            </button>
                          </div>
                          {otherEvent && (
                            <span className="text-xs text-slate-400">
                              {formatDateTime(otherEvent.start)} - {formatTime(otherEvent.end)}
                              {otherEvent.venue && ` · ${otherEvent.venue}`}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}

              {c.timeConflicts.length > 0 && c.details.length === 0 && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-700">
                  仅存在时间重叠，暂无场地/人员/物资占用冲突
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/events/${selectedConflictEvent.id}`)}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  进入执行面板
                </Button>
              </div>
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-50">{icon}</div>
      </div>
    </Card>
  )
}
