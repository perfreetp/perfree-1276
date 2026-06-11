import { useState, useMemo } from 'react'
import { Routes, Route, useParams, useNavigate } from 'react-router-dom'
import { parseISO, format, isAfter, isBefore } from 'date-fns'
import { zhCN } from 'date-fns/locale'
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
} from 'lucide-react'
import { useAppStore } from '../store'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Input from '../components/Input'
import Select from '../components/Select'
import Modal from '../components/Modal'
import { cn, formatDateTime, formatTime } from '../lib/utils'
import type { EventType, Assignment } from '../types'

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

  const filteredEvents = useMemo(() => {
    return events
      .filter((e) => (filter === 'all' ? true : e.type === filter))
      .filter((e) => (search ? e.title.toLowerCase().includes(search.toLowerCase()) : true))
      .sort((a, b) => parseISO(a.start).getTime() - parseISO(b.start).getTime())
  }, [events, filter, search])

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
        <p className="text-sm text-slate-500 mt-1">查看和管理所有场次的详细信息</p>
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

function EventRow({
  event,
  show,
  onClick,
  muted,
}: {
  event: any
  show?: any
  onClick: () => void
  muted?: boolean
}) {
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
  const show = useAppStore((s) => s.shows.find((s) => s.id === event?.showId))
  const personnel = useAppStore((s) => s.personnel)
  const props = useAppStore((s) => s.props)
  const costumes = useAppStore((s) => s.costumes)
  const checkItems = useAppStore((s) => s.checkItems)
  const assignments = useAppStore((s) => s.assignments.filter((a) => a.eventId === id))
  const addAssignment = useAppStore((s) => s.addAssignment)
  const deleteAssignment = useAppStore((s) => s.deleteAssignment)
  const toggleCheckItem = useAppStore((s) => s.toggleCheckItem)

  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [newAssignment, setNewAssignment] = useState({ personnelId: '', role: '' })

  if (!event) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">场次不存在</p>
        <Button className="mt-4" onClick={() => navigate('/events')}>
          返回列表
        </Button>
      </div>
    )
  }

  const eventProps = props.filter((p) => p.status === 'in_use')
  const eventCostumes = costumes.filter((c) => c.status === 'in_use')

  const lightingChecks = checkItems.filter((c) => c.category === 'lighting')
  const soundChecks = checkItems.filter((c) => c.category === 'sound')
  const stageChecks = checkItems.filter((c) => c.category === 'stage')

  const handleAddAssignment = () => {
    if (newAssignment.personnelId && newAssignment.role && id) {
      addAssignment({
        eventId: id,
        personnelId: newAssignment.personnelId,
        role: newAssignment.role,
      })
      setNewAssignment({ personnelId: '', role: '' })
      setShowAssignmentModal(false)
    }
  }

  const personnelName = (pid: string) => personnel.find((p) => p.id === pid)?.name || '未知'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/events')}
          className="p-2 rounded-lg hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Badge variant={eventTypeBadge[event.type]}>{eventTypeLabels[event.type]}</Badge>
            <h2 className="text-2xl font-bold text-slate-800">{event.title}</h2>
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatDateTime(event.start)} - {formatTime(event.end)}
            </span>
            {event.venue && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {event.venue}
              </span>
            )}
          </div>
        </div>
      </div>

      {show && (
        <Card title="剧目信息">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-lg text-slate-800">{show.title}</h4>
              <p className="text-sm text-slate-500 mt-1">{show.genre} · {show.duration}分钟</p>
              {show.description && (
                <p className="text-sm text-slate-600 mt-3 leading-relaxed">{show.description}</p>
              )}
            </div>
            <div className="space-y-2 text-sm">
              {show.director && (
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">导演</span>
                  <span className="text-slate-800 font-medium">{show.director}</span>
                </div>
              )}
              {show.playwright && (
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">编剧</span>
                  <span className="text-slate-800 font-medium">{show.playwright}</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-6">
        <Card
          title="人员排班"
          rightAction={
            <Button size="sm" onClick={() => setShowAssignmentModal(true)}>
              <UserPlus className="w-4 h-4" />
              添加
            </Button>
          }
        >
          {assignments.length === 0 ? (
            <p className="text-slate-400 text-center py-6 text-sm">暂无排班人员</p>
          ) : (
            <div className="space-y-2">
              {assignments.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {personnelName(a.personnelId)[0]}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{personnelName(a.personnelId)}</p>
                      <p className="text-xs text-slate-500">{a.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteAssignment(a.id)}
                    className="p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 text-slate-400 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="道具清单">
          {eventProps.length === 0 ? (
            <p className="text-slate-400 text-center py-6 text-sm">暂无道具</p>
          ) : (
            <div className="space-y-2">
              {eventProps.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Package className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.category} · 数量: {p.quantity}</p>
                    </div>
                  </div>
                  <Badge variant="warning">使用中</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="服装借还">
          {eventCostumes.length === 0 ? (
            <p className="text-slate-400 text-center py-6 text-sm">暂无服装</p>
          ) : (
            <div className="space-y-2">
              {eventCostumes.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Shirt className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{c.name}</p>
                      <p className="text-xs text-slate-500">
                        {c.character || '通用'} · {c.size} · 数量: {c.quantity}
                      </p>
                    </div>
                  </div>
                  <Badge variant="warning">使用中</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="灯光音响检查">
          <div className="space-y-4">
            <CheckSection title="灯光设备" items={lightingChecks} onToggle={toggleCheckItem} icon={<ClipboardList className="w-4 h-4" />} />
            <CheckSection title="音响设备" items={soundChecks} onToggle={toggleCheckItem} icon={<ClipboardList className="w-4 h-4" />} />
            <CheckSection title="舞台设施" items={stageChecks} onToggle={toggleCheckItem} icon={<ClipboardList className="w-4 h-4" />} />
          </div>
        </Card>
      </div>

      {event.notes && (
        <Card title="备注">
          <p className="text-sm text-slate-600 leading-relaxed">{event.notes}</p>
        </Card>
      )}

      <Modal
        open={showAssignmentModal}
        onClose={() => setShowAssignmentModal(false)}
        title="添加排班人员"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowAssignmentModal(false)}>
              取消
            </Button>
            <Button onClick={handleAddAssignment}>添加</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Select
            label="人员"
            value={newAssignment.personnelId}
            onChange={(e) => setNewAssignment({ ...newAssignment, personnelId: e.target.value })}
            options={[
              { value: '', label: '请选择' },
              ...personnel.map((p) => ({ value: p.id, label: p.name })),
            ]}
          />
          <Input
            label="岗位/角色"
            value={newAssignment.role}
            onChange={(e) => setNewAssignment({ ...newAssignment, role: e.target.value })}
            placeholder="如：男主角、灯光师、场务等"
          />
        </div>
      </Modal>
    </div>
  )
}

function CheckSection({
  title,
  items,
  onToggle,
  icon,
}: {
  title: string
  items: any[]
  onToggle: (id: string) => void
  icon: React.ReactNode
}) {
  const checked = items.filter((i) => i.checked).length
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          {icon}
          {title}
        </div>
        <span className="text-xs text-slate-500">
          {checked}/{items.length}
        </span>
      </div>
      <div className="space-y-1.5">
        {items.map((item) => (
          <label
            key={item.id}
            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => onToggle(item.id)}
              className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
            />
            <span className={cn('text-sm', item.checked ? 'text-slate-400 line-through' : 'text-slate-700')}>
              {item.name}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}
