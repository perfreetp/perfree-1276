import { useState, useMemo, useRef } from 'react'
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
  isWithinInterval,
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
} from 'lucide-react'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
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
import { cn, formatDateTime } from '../lib/utils'
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

function checkConflict(newEvent: ScheduleEvent, allEvents: ScheduleEvent[]): ScheduleEvent[] {
  return allEvents.filter((e) => {
    if (e.id === newEvent.id) return false
    const newStart = parseISO(newEvent.start)
    const newEnd = parseISO(newEvent.end)
    const eStart = parseISO(e.start)
    const eEnd = parseISO(e.end)
    return (
      isWithinInterval(newStart, { start: eStart, end: eEnd }) ||
      isWithinInterval(newEnd, { start: eStart, end: eEnd }) ||
      isWithinInterval(eStart, { start: newStart, end: newEnd })
    )
  })
}

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [dragEvent, setDragEvent] = useState<ScheduleEvent | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null)
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
    const result: Record<string, string[]> = {}
    events.forEach((e) => {
      const conf = checkConflict(e, events)
      if (conf.length > 0) {
        result[e.id] = conf.map((c) => c.id)
      }
    })
    return result
  }, [events])

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
    const targetDate = new Date(String(event.over.id))
    const originalStart = parseISO(dragEvent.start)
    const originalEnd = parseISO(dragEvent.end)
    const diffDays = targetDate.getDate() - originalStart.getDate()
    const diffMonths = targetDate.getMonth() - originalStart.getMonth()
    const diffYears = targetDate.getFullYear() - originalStart.getFullYear()
    const newStart = new Date(originalStart)
    newStart.setDate(newStart.getDate() + diffDays)
    newStart.setMonth(newStart.getMonth() + diffMonths)
    newStart.setFullYear(newStart.getFullYear() + diffYears)
    const newEnd = new Date(originalEnd)
    newEnd.setDate(newEnd.getDate() + diffDays)
    newEnd.setMonth(newEnd.getMonth() + diffMonths)
    newEnd.setFullYear(newEnd.getFullYear() + diffYears)
    updateEvent(dragEvent.id, {
      start: newStart.toISOString(),
      end: newEnd.toISOString(),
    })
  }

  const weekDays = ['一', '二', '三', '四', '五', '六', '日']
  const conflictCount = Object.keys(conflicts).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">日历总览</h2>
          <p className="text-sm text-slate-500 mt-1">拖拽事件可快速调整日期，点击可查看详情</p>
        </div>
        <div className="flex items-center gap-3">
          {conflictCount > 0 && (
            <Badge variant="danger">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {conflictCount} 个时间冲突
            </Badge>
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
          collisionDetection={closestCenter}
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
                <div
                  key={key}
                  data-date={key}
                  id={day.toISOString()}
                  className={cn(
                    'min-h-[120px] p-2 border border-slate-100 transition-all cursor-pointer hover:bg-slate-50',
                    !isCurrentMonth && 'bg-slate-50/50',
                    isToday && 'bg-amber-50/50',
                  )}
                  onClick={(e) => {
                    if (e.target === e.currentTarget) openNewEvent(day)
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
                      {format(day, 'd')}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        draggable
                        data-id={event.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditEvent(event)
                        }}
                        className={cn(
                          'text-white text-xs px-2 py-1 rounded cursor-move truncate hover:opacity-90 transition-opacity',
                          eventTypeColors[event.type],
                          conflicts[event.id]?.length > 0 && 'conflict-event',
                        )}
                        title={`${event.title} - ${formatDateTime(event.start)}`}
                      >
                        <div className="flex items-center gap-1">
                          <span className="font-medium truncate">{event.title}</span>
                          {conflicts[event.id]?.length > 0 && (
                            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                          )}
                        </div>
                        <div className="text-[10px] opacity-80">
                          {format(parseISO(event.start), 'HH:mm')}
                        </div>
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-slate-500 pl-2">
                        +{dayEvents.length - 3} 更多
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <DragOverlay>
            {dragEvent && (
              <div
                className={cn(
                  'text-white text-sm px-3 py-2 rounded shadow-xl',
                  eventTypeColors[dragEvent.type],
                )}
              >
                <div className="font-medium">{dragEvent.title}</div>
                <div className="text-xs opacity-80">{formatDateTime(dragEvent.start)}</div>
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
              查看完整详情
            </Button>
          )}
        </div>
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
