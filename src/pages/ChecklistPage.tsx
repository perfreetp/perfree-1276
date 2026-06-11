import { useState } from 'react'
import {
  ClipboardList,
  Lightbulb,
  Volume2,
  FileText,
  AlertTriangle,
  Plus,
  Check,
  X,
  MessageSquare,
  Clock,
  Edit2,
} from 'lucide-react'
import { useAppStore } from '../store'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Input from '../components/Input'
import Select from '../components/Select'
import TextArea from '../components/TextArea'
import Modal from '../components/Modal'
import { cn, formatDateTime } from '../lib/utils'
import type { CheckItem, PerformanceLog, IncidentRecord } from '../types'

const categoryLabels: Record<CheckItem['category'], string> = {
  lighting: '灯光设备',
  sound: '音响设备',
  stage: '舞台设施',
  other: '其他',
}

const incidentSeverityLabels: Record<IncidentRecord['severity'], string> = {
  minor: '轻微',
  moderate: '一般',
  serious: '严重',
}

const incidentSeverityVariants: Record<IncidentRecord['severity'], 'warning' | 'danger' | 'info'> = {
  minor: 'warning',
  moderate: 'info',
  serious: 'danger',
}

const logCategoryLabels: Record<PerformanceLog['category'], string> = {
  info: '信息',
  warning: '警告',
  action: '操作',
}

const logCategoryColors: Record<PerformanceLog['category'], string> = {
  info: 'bg-blue-100 text-blue-700 border-blue-200',
  warning: 'bg-amber-100 text-amber-700 border-amber-200',
  action: 'bg-green-100 text-green-700 border-green-200',
}

type TabType = 'checklist' | 'logs' | 'incidents'

export default function ChecklistPage() {
  const [tab, setTab] = useState<TabType>('checklist')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">现场清单</h2>
        <p className="text-sm text-slate-500 mt-1">演出现场执行检查、日志记录和事故管理</p>
      </div>

      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
        <button
          onClick={() => setTab('checklist')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
            tab === 'checklist' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700',
          )}
        >
          <ClipboardList className="w-4 h-4" />
          检查清单
        </button>
        <button
          onClick={() => setTab('logs')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
            tab === 'logs' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700',
          )}
        >
          <MessageSquare className="w-4 h-4" />
          演出日志
        </button>
        <button
          onClick={() => setTab('incidents')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
            tab === 'incidents' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700',
          )}
        >
          <AlertTriangle className="w-4 h-4" />
          事故记录
        </button>
      </div>

      {tab === 'checklist' && <ChecklistSection />}
      {tab === 'logs' && <LogsSection />}
      {tab === 'incidents' && <IncidentsSection />}
    </div>
  )
}

function ChecklistSection() {
  const checkItems = useAppStore((s) => s.checkItems)
  const events = useAppStore((s) => s.events)
  const toggleCheckItem = useAppStore((s) => s.toggleCheckItem)
  const addCheckItem = useAppStore((s) => s.addCheckItem)
  const deleteCheckItem = useAppStore((s) => s.deleteCheckItem)

  const [showModal, setShowModal] = useState(false)
  const [eventFilter, setEventFilter] = useState<string>('all')
  const [formData, setFormData] = useState({
    category: 'lighting' as CheckItem['category'],
    name: '',
    notes: '',
    eventId: '',
  })

  const getEventTitle = (eventId?: string) => events.find((e) => e.id === eventId)?.title || '通用'

  const filteredItems = eventFilter === 'all'
    ? checkItems
    : eventFilter === 'none'
    ? checkItems.filter((c) => !c.eventId)
    : checkItems.filter((c) => c.eventId === eventFilter)

  const groups = ['lighting', 'sound', 'stage', 'other'] as const
  const totalItems = filteredItems.length
  const checkedItems = filteredItems.filter((c) => c.checked).length
  const progress = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0

  const handleSave = () => {
    if (!formData.name) return
    addCheckItem({
      ...formData,
      checked: false,
      notes: formData.notes || undefined,
      eventId: formData.eventId || undefined,
    })
    setShowModal(false)
    setFormData({ category: 'lighting', name: '', notes: '', eventId: '' })
  }

  const categoryIcons: Record<string, React.ReactNode> = {
    lighting: <Lightbulb className="w-5 h-5" />,
    sound: <Volume2 className="w-5 h-5" />,
    stage: <ClipboardList className="w-5 h-5" />,
    other: <FileText className="w-5 h-5" />,
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <p className="text-sm text-slate-500">检查项总数</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{totalItems}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">已完成</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{checkedItems}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">完成进度</p>
          <div className="flex items-end gap-3">
            <p className="text-3xl font-bold text-amber-500 mt-1">{progress}%</p>
            <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </Card>
      </div>

      <div className="flex justify-between items-center flex-wrap gap-3">
        <Select
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          className="w-64"
          options={[
            { value: 'all', label: '全部场次' },
            { value: 'none', label: '通用（不关联场次）' },
            ...events.map((e) => ({ value: e.id, label: e.title })),
          ]}
        />
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" />
          添加检查项
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {groups.map((group) => {
          const items = filteredItems.filter((c) => c.category === group)
          const checked = items.filter((i) => i.checked).length
          return (
            <Card
              key={group}
              title={
                <div className="flex items-center gap-2">
                  <span className="text-amber-500">{categoryIcons[group]}</span>
                  {categoryLabels[group]}
                  <span className="text-xs font-normal text-slate-400">
                    ({checked}/{items.length})
                  </span>
                </div>
              }
            >
              <div className="space-y-1.5">
                {items.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">暂无检查项</p>
                ) : (
                  items.map((item) => (
                    <div
                      key={item.id}
                      className="group flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <button
                        onClick={() => toggleCheckItem(item.id)}
                        className={cn(
                          'w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0',
                          item.checked
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-slate-300 hover:border-green-400',
                        )}
                      >
                        {item.checked && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <span
                          className={cn(
                            'text-sm block transition-all',
                            item.checked && 'text-slate-400 line-through',
                          )}
                        >
                          {item.name}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="default" className="text-[10px] py-0 px-1.5 h-4">
                            {getEventTitle(item.eventId)}
                          </Badge>
                          {item.checkedAt && (
                            <span className="text-[10px] text-slate-400">
                              {formatDateTime(item.checkedAt)}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm('确定删除此检查项吗？')) deleteCheckItem(item.id)
                        }}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </Card>
          )
        })}
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="添加检查项"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              取消
            </Button>
            <Button onClick={handleSave}>添加</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Select
            label="分类"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as CheckItem['category'] })}
            options={Object.entries(categoryLabels).map(([v, l]) => ({ value: v, label: l }))}
          />
          <Select
            label="关联场次"
            value={formData.eventId}
            onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
            options={[
              { value: '', label: '通用（不关联场次）' },
              ...events.map((e) => ({ value: e.id, label: e.title })),
            ]}
          />
          <Input
            label="检查项名称"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="如：主舞台面光灯"
          />
          <TextArea
            label="备注"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={2}
          />
        </div>
      </Modal>
    </>
  )
}

function LogsSection() {
  const logs = useAppStore((s) => s.logs)
  const events = useAppStore((s) => s.events)
  const addLog = useAppStore((s) => s.addLog)

  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    eventId: '',
    content: '',
    category: 'info' as PerformanceLog['category'],
  })

  const getEventTitle = (eventId?: string) => events.find((e) => e.id === eventId)?.title || '通用'

  const handleSave = () => {
    if (!formData.content) return
    addLog({
      ...formData,
      eventId: formData.eventId || undefined,
      timestamp: new Date().toISOString(),
    })
    setShowModal(false)
    setFormData({ eventId: '', content: '', category: 'info' })
  }

  const sortedLogs = [...logs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )

  return (
    <>
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">共 {logs.length} 条日志记录</p>
        <Button onClick={() => setShowModal(true)}>
          <MessageSquare className="w-4 h-4" />
          记录日志
        </Button>
      </div>

      <Card>
        <div className="space-y-0">
          {sortedLogs.length === 0 ? (
            <p className="text-slate-400 text-center py-8">暂无日志记录</p>
          ) : (
            sortedLogs.map((log, index) => (
              <div
                key={log.id}
                className={cn(
                  'flex gap-4 py-4',
                  index !== sortedLogs.length - 1 && 'border-b border-slate-100',
                )}
              >
                <div className="relative">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center border',
                      logCategoryColors[log.category],
                    )}
                  >
                    <Clock className="w-4 h-4" />
                  </div>
                  {index !== sortedLogs.length - 1 && (
                    <div className="absolute left-1/2 -translate-x-1/2 top-8 w-0.5 h-full bg-slate-200" />
                  )}
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={log.category === 'warning' ? 'warning' : log.category === 'action' ? 'success' : 'info'}>
                      {logCategoryLabels[log.category]}
                    </Badge>
                    <span className="text-sm font-medium text-slate-700">{getEventTitle(log.eventId)}</span>
                    <span className="text-xs text-slate-400">{formatDateTime(log.timestamp)}</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">{log.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="记录演出日志"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              取消
            </Button>
            <Button onClick={handleSave}>保存</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Select
            label="关联场次"
            value={formData.eventId}
            onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
            options={[
              { value: '', label: '通用（不关联）' },
              ...events.map((e) => ({ value: e.id, label: e.title })),
            ]}
          />
          <Select
            label="日志类型"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as PerformanceLog['category'] })}
            options={Object.entries(logCategoryLabels).map(([v, l]) => ({ value: v, label: l }))}
          />
          <TextArea
            label="日志内容"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="记录演出现场发生的重要事件..."
            rows={4}
          />
        </div>
      </Modal>
    </>
  )
}

function IncidentsSection() {
  const incidents = useAppStore((s) => s.incidents)
  const events = useAppStore((s) => s.events)
  const addIncident = useAppStore((s) => s.addIncident)
  const updateIncident = useAppStore((s) => s.updateIncident)

  const [showModal, setShowModal] = useState(false)
  const [showHandleModal, setShowHandleModal] = useState(false)
  const [handlingId, setHandlingId] = useState<string | null>(null)
  const [resolution, setResolution] = useState('')
  const [formData, setFormData] = useState({
    eventId: '',
    title: '',
    description: '',
    severity: 'minor' as IncidentRecord['severity'],
  })

  const getEventTitle = (eventId?: string) => events.find((e) => e.id === eventId)?.title || '-'

  const handleSave = () => {
    if (!formData.title || !formData.description) return
    addIncident({
      ...formData,
      eventId: formData.eventId || undefined,
      timestamp: new Date().toISOString(),
      handled: false,
      resolution: undefined,
    })
    setShowModal(false)
    setFormData({ eventId: '', title: '', description: '', severity: 'minor' })
  }

  const handleResolve = () => {
    if (handlingId && resolution) {
      updateIncident(handlingId, { handled: true, resolution })
      setShowHandleModal(false)
      setHandlingId(null)
      setResolution('')
    }
  }

  const openHandle = (id: string) => {
    setHandlingId(id)
    setResolution('')
    setShowHandleModal(true)
  }

  const sorted = [...incidents].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <p className="text-sm text-slate-500">事故总数</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{incidents.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">待处理</p>
          <p className="text-3xl font-bold text-red-500 mt-1">
            {incidents.filter((i) => !i.handled).length}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">已处理</p>
          <p className="text-3xl font-bold text-green-600 mt-1">
            {incidents.filter((i) => i.handled).length}
          </p>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">按时间倒序排列</p>
        <Button onClick={() => setShowModal(true)}>
          <AlertTriangle className="w-4 h-4" />
          记录事故
        </Button>
      </div>

      <div className="space-y-4">
        {sorted.length === 0 ? (
          <Card>
            <p className="text-slate-400 text-center py-8">暂无事故记录</p>
          </Card>
        ) : (
          sorted.map((incident) => (
            <Card key={incident.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h4 className="font-semibold text-slate-800">{incident.title}</h4>
                    <Badge variant={incidentSeverityVariants[incident.severity]}>
                      {incidentSeverityLabels[incident.severity]}
                    </Badge>
                    {incident.handled ? (
                      <Badge variant="success">已处理</Badge>
                    ) : (
                      <Badge variant="danger">待处理</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDateTime(incident.timestamp)}
                    </span>
                    <span>关联场次：{getEventTitle(incident.eventId)}</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-3 leading-relaxed">{incident.description}</p>
                  {incident.resolution && (
                    <div className="mt-3 p-3 rounded-lg bg-green-50 border border-green-200">
                      <p className="text-xs text-green-600 font-medium mb-1">处理结果</p>
                      <p className="text-sm text-green-700">{incident.resolution}</p>
                    </div>
                  )}
                </div>
                {!incident.handled && (
                  <Button size="sm" onClick={() => openHandle(incident.id)}>
                    <Check className="w-4 h-4" />
                    处理
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="记录事故"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              取消
            </Button>
            <Button variant="danger" onClick={handleSave}>
              提交记录
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Select
            label="关联场次"
            value={formData.eventId}
            onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
            options={[
              { value: '', label: '不关联' },
              ...events.map((e) => ({ value: e.id, label: e.title })),
            ]}
          />
          <Input
            label="事故标题"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="简要描述事故"
          />
          <Select
            label="严重程度"
            value={formData.severity}
            onChange={(e) => setFormData({ ...formData, severity: e.target.value as IncidentRecord['severity'] })}
            options={Object.entries(incidentSeverityLabels).map(([v, l]) => ({ value: v, label: l }))}
          />
          <TextArea
            label="详细描述"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="详细描述事故发生的经过、原因和影响..."
            rows={4}
          />
        </div>
      </Modal>

      <Modal
        open={showHandleModal}
        onClose={() => setShowHandleModal(false)}
        title="处理事故"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowHandleModal(false)}>
              取消
            </Button>
            <Button variant="success" onClick={handleResolve}>
              <Check className="w-4 h-4" />
              确认处理
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <TextArea
            label="处理结果"
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            placeholder="请描述事故的处理方式和结果..."
            rows={4}
          />
        </div>
      </Modal>
    </>
  )
}
