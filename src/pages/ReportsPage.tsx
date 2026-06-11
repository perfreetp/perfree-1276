import { useState, useMemo } from 'react'
import { parseISO, isWithinInterval } from 'date-fns'
import {
  DollarSign,
  FileDown,
  CheckSquare,
  Plus,
  Trash2,
  Check,
  Calendar,
  AlertCircle,
  Download,
  TrendingUp,
  TrendingDown,
  Package,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts'
import { useAppStore } from '../store'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Input from '../components/Input'
import Select from '../components/Select'
import Modal from '../components/Modal'
import TextArea from '../components/TextArea'
import { cn, formatDate, formatDateTime, formatTime, exportToCSV } from '../lib/utils'
import type { TodoItem } from '../types'

const todoPriorityLabels: Record<TodoItem['priority'], string> = {
  high: '高',
  medium: '中',
  low: '低',
}

const todoPriorityVariants: Record<TodoItem['priority'], 'danger' | 'warning' | 'default'> = {
  high: 'danger',
  medium: 'warning',
  low: 'default',
}

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4']

type TabType = 'expenses' | 'todos' | 'export'

export default function ReportsPage() {
  const [tab, setTab] = useState<TabType>('expenses')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">日志报表</h2>
        <p className="text-sm text-slate-500 mt-1">费用汇总、待办提醒和数据导出</p>
      </div>

      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
        <button
          onClick={() => setTab('expenses')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
            tab === 'expenses' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700',
          )}
        >
          <DollarSign className="w-4 h-4" />
          费用汇总
        </button>
        <button
          onClick={() => setTab('todos')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
            tab === 'todos' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700',
          )}
        >
          <CheckSquare className="w-4 h-4" />
          待办提醒
        </button>
        <button
          onClick={() => setTab('export')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
            tab === 'export' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700',
          )}
        >
          <FileDown className="w-4 h-4" />
          数据导出
        </button>
      </div>

      {tab === 'expenses' && <ExpenseReport />}
      {tab === 'todos' && <TodoList />}
      {tab === 'export' && <DataExport />}
    </div>
  )
}

function ExpenseReport() {
  const expenses = useAppStore((s) => s.expenses)
  const ticketSales = useAppStore((s) => s.ticketSales)
  const addExpense = useAppStore((s) => s.addExpense)
  const deleteExpense = useAppStore((s) => s.deleteExpense)

  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    amount: 0,
    date: formatDate(new Date()),
    recordedBy: '',
  })

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0)
  const totalRevenue = ticketSales.reduce((sum, t) => sum + t.total, 0)
  const netProfit = totalRevenue - totalExpense

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {}
    expenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [expenses])

  const byDate = useMemo(() => {
    const map: Record<string, number> = {}
    expenses.forEach((e) => {
      const d = formatDate(e.date)
      map[d] = (map[d] || 0) + e.amount
    })
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-10)
      .map(([date, amount]) => ({ date, amount }))
  }, [expenses])

  const handleSave = () => {
    if (!formData.category || !formData.description || !formData.amount) return
    addExpense({
      ...formData,
      amount: Number(formData.amount),
      date: new Date(formData.date).toISOString(),
      recordedBy: formData.recordedBy || undefined,
    })
    setShowModal(false)
    setFormData({ category: '', description: '', amount: 0, date: formatDate(new Date()), recordedBy: '' })
  }

  const sortedExpenses = [...expenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )

  return (
    <>
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">总收入</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                ¥{totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-green-50">
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">总支出</p>
              <p className="text-2xl font-bold text-red-500 mt-1">
                ¥{totalExpense.toLocaleString()}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-red-50">
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">净利润</p>
              <p className={cn('text-2xl font-bold mt-1', netProfit >= 0 ? 'text-green-600' : 'text-red-500')}>
                ¥{netProfit.toLocaleString()}
              </p>
            </div>
            <div className={cn('p-2.5 rounded-xl', netProfit >= 0 ? 'bg-green-50' : 'bg-red-50')}>
              <DollarSign className={cn('w-5 h-5', netProfit >= 0 ? 'text-green-500' : 'text-red-500')} />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">支出笔数</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{expenses.length}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50">
              <AlertCircle className="w-5 h-5 text-slate-500" />
            </div>
          </div>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" />
          登记支出
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card title="支出分类" className="col-span-1">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={byCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {byCategory.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => `¥${v.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {byCategory.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <span className="font-medium text-slate-800">¥{item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="支出明细" className="col-span-2">
          <div className="h-64 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byDate}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => `¥${v.toLocaleString()}`} />
                <Bar dataKey="amount" name="支出" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto max-h-48">
            <table className="w-full">
              <thead className="sticky top-0 bg-white">
                <tr className="text-left text-sm text-slate-500 border-b border-slate-100">
                  <th className="py-2 px-3 font-medium">日期</th>
                  <th className="py-2 px-3 font-medium">分类</th>
                  <th className="py-2 px-3 font-medium">说明</th>
                  <th className="py-2 px-3 font-medium">金额</th>
                  <th className="py-2 px-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {sortedExpenses.map((e) => (
                  <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="py-2 px-3 text-sm text-slate-500">{formatDate(e.date)}</td>
                    <td className="py-2 px-3">
                      <Badge variant="warning">{e.category}</Badge>
                    </td>
                    <td className="py-2 px-3 text-sm text-slate-600">{e.description}</td>
                    <td className="py-2 px-3 text-sm font-semibold text-red-500">
                      ¥{e.amount.toLocaleString()}
                    </td>
                    <td className="py-2 px-3">
                      <button
                        onClick={() => {
                          if (confirm('确定删除此支出记录吗？')) deleteExpense(e.id)
                        }}
                        className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="登记支出"
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
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="支出类别"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="如：道具采购、服装租赁"
            />
            <Input
              label="日期"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
          <TextArea
            label="支出说明"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={2}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="金额 (¥)"
              type="number"
              min={0}
              value={formData.amount || ''}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
            />
            <Input
              label="登记人"
              value={formData.recordedBy}
              onChange={(e) => setFormData({ ...formData, recordedBy: e.target.value })}
            />
          </div>
        </div>
      </Modal>
    </>
  )
}

function TodoList() {
  const todos = useAppStore((s) => s.todos)
  const addTodo = useAppStore((s) => s.addTodo)
  const toggleTodo = useAppStore((s) => s.toggleTodo)
  const deleteTodo = useAppStore((s) => s.deleteTodo)
  const events = useAppStore((s) => s.events)

  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('all')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventId: '',
    dueDate: '',
    priority: 'medium' as TodoItem['priority'],
  })

  const getEventTitle = (eventId?: string) => events.find((e) => e.id === eventId)?.title

  const filtered = todos.filter((t) => {
    if (filter === 'all') return true
    if (filter === 'pending') return !t.completed
    return t.completed
  })

  const sorted = filtered.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })

  const handleSave = () => {
    if (!formData.title) return
    addTodo({
      ...formData,
      description: formData.description || undefined,
      eventId: formData.eventId || undefined,
      dueDate: formData.dueDate || undefined,
    })
    setShowModal(false)
    setFormData({ title: '', description: '', eventId: '', dueDate: '', priority: 'medium' })
  }

  const pending = todos.filter((t) => !t.completed)
  const done = todos.filter((t) => t.completed)

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <p className="text-sm text-slate-500">待办总数</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{todos.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">待完成</p>
          <p className="text-3xl font-bold text-amber-500 mt-1">{pending.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">已完成</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{done.length}</p>
        </Card>
      </div>

      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
          {[
            { key: 'all', label: '全部' },
            { key: 'pending', label: '待完成' },
            { key: 'done', label: '已完成' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as any)}
              className={cn(
                'px-4 py-1.5 rounded-md text-sm font-medium transition-all',
                filter === f.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" />
          新建待办
        </Button>
      </div>

      <Card>
        <div className="space-y-2">
          {sorted.length === 0 ? (
            <p className="text-slate-400 text-center py-8">暂无待办事项</p>
          ) : (
            sorted.map((todo) => (
              <div
                key={todo.id}
                className={cn(
                  'group flex items-start gap-3 p-4 rounded-xl transition-all',
                  todo.completed ? 'bg-slate-50' : 'bg-white hover:bg-slate-50 border border-slate-100',
                )}
              >
                <button
                  onClick={() => toggleTodo(todo.id)}
                  className={cn(
                    'w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0',
                    todo.completed
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-slate-300 hover:border-green-400',
                  )}
                >
                  {todo.completed && <Check className="w-3.5 h-3.5" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4
                      className={cn(
                        'font-medium',
                        todo.completed ? 'text-slate-400 line-through' : 'text-slate-800',
                      )}
                    >
                      {todo.title}
                    </h4>
                    <Badge variant={todoPriorityVariants[todo.priority]}>
                      {todoPriorityLabels[todo.priority]}优先级
                    </Badge>
                  </div>
                  {todo.description && (
                    <p className={cn('text-sm mt-1', todo.completed ? 'text-slate-300' : 'text-slate-500')}>
                      {todo.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                    {todo.eventId && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {getEventTitle(todo.eventId)}
                      </span>
                    )}
                    {todo.dueDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        截止：{formatDate(todo.dueDate)}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (confirm('确定删除此待办吗？')) deleteTodo(todo.id)
                  }}
                  className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </Card>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="新建待办"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              取消
            </Button>
            <Button onClick={handleSave}>创建</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="标题"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="待办事项标题"
          />
          <TextArea
            label="详细描述"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="关联场次"
              value={formData.eventId}
              onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
              options={[
                { value: '', label: '不关联' },
                ...events.map((e) => ({ value: e.id, label: e.title })),
              ]}
            />
            <Select
              label="优先级"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as TodoItem['priority'] })}
              options={[
                { value: 'high', label: '高优先级' },
                { value: 'medium', label: '中优先级' },
                { value: 'low', label: '低优先级' },
              ]}
            />
          </div>
          <Input
            label="截止日期"
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
          />
        </div>
      </Modal>
    </>
  )
}

function DataExport() {
  const state = useAppStore()
  const [selectedEventId, setSelectedEventId] = useState('')

  const timelineTypeLabels: Record<string, string> = {
    arrival: '到场签到', check_complete: '检查完成', ticket_open: '开票',
    entrance: '入场', curtain_up: '大幕拉开', intermission: '中场休息',
    curtain_down: '大幕落下', incident: '事故', incident_resolved: '事故解决', other: '其他',
  }

  const handleExportPack = () => {
    if (!selectedEventId) return
    const event = state.events.find((e) => e.id === selectedEventId)
    if (!event) return

    const eventName = event.title.replace(/[《》]/g, '')
    const dateStr = formatDate(event.start)

    const scheduleData = [{
      类型: { show: '演出', rehearsal: '排练', setup: '装台', teardown: '撤场' }[event.type],
      标题: event.title,
      开始时间: formatDateTime(event.start),
      结束时间: formatTime(event.end),
      场地: event.venue || '',
      备注: event.description || '',
    }]
    exportToCSV(scheduleData, `${eventName}_${dateStr}_排期.csv`)

    const assignments = state.assignments.filter((a) => a.eventId === selectedEventId)
    if (assignments.length > 0) {
      const personnelData = assignments.map((a) => {
        const p = state.personnel.find((per) => per.id === a.personnelId)
        const onLeave = p && state.leaves.some(
          (l) =>
            l.status !== 'rejected' &&
            l.personnelId === p.id &&
            isWithinInterval(parseISO(event.start), {
              start: parseISO(l.startDate),
              end: new Date(parseISO(l.endDate).getTime() + 86400000),
            }),
        )
        const checkin = state.personnelCheckins.find((c) => c.assignmentId === a.id)
        return {
          姓名: p?.name || '未知',
          岗位: a.role,
          是否请假: onLeave ? '是' : '否',
          是否到场: checkin?.confirmed ? '已确认' : '未确认',
          确认时间: checkin?.confirmedAt ? formatDateTime(checkin.confirmedAt) : '',
        }
      })
      exportToCSV(personnelData, `${eventName}_${dateStr}_人员.csv`)
    }

    const eventPropAssignments = state.eventPropAssignments.filter((a) => a.eventId === selectedEventId)
    if (eventPropAssignments.length > 0) {
      const propsData = eventPropAssignments.map((a) => {
        const p = state.props.find((x) => x.id === a.propId)
        const checkin = state.propCheckins.find((c) => c.assignmentId === a.id)
        return {
          名称: p?.name || '未知',
          分类: p?.category || '',
          数量: a.quantity,
          位置: p?.location || '',
          是否到位: checkin?.confirmed ? '已确认' : '未确认',
          确认时间: checkin?.confirmedAt ? formatDateTime(checkin.confirmedAt) : '',
          备注: a.notes || '',
        }
      })
      exportToCSV(propsData, `${eventName}_${dateStr}_道具.csv`)
    }

    const eventCostumeAssignments = state.eventCostumeAssignments.filter((a) => a.eventId === selectedEventId)
    if (eventCostumeAssignments.length > 0) {
      const costumesData = eventCostumeAssignments.map((a) => {
        const c = state.costumes.find((x) => x.id === a.costumeId)
        const checkin = state.costumeCheckins.find((ci) => ci.assignmentId === a.id)
        return {
          名称: c?.name || '未知',
          角色: c?.character || '',
          尺码: c?.size || '',
          数量: a.quantity,
          是否到位: checkin?.confirmed ? '已确认' : '未确认',
          确认时间: checkin?.confirmedAt ? formatDateTime(checkin.confirmedAt) : '',
          备注: a.notes || '',
        }
      })
      exportToCSV(costumesData, `${eventName}_${dateStr}_服装.csv`)
    }

    const eventTickets = state.ticketSales.filter((t) => t.eventId === selectedEventId)
    const eventComp = state.complementaryTickets.filter((t) => t.eventId === selectedEventId)
    if (eventTickets.length > 0 || eventComp.length > 0) {
      const ticketData = [
        ...eventTickets.map((t) => ({
          类型: '售票',
          票种: ({ normal: '普通票', vip: 'VIP票', student: '学生票', complementary: '赠票' } as Record<string, string>)[t.type],
          数量: t.quantity,
          单价: t.price,
          总价: t.total,
        })),
        ...eventComp.map((t) => ({
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

    const eventCheckItems = state.checkItems.filter((c) => c.eventId === selectedEventId)
    if (eventCheckItems.length > 0) {
      const checksData = eventCheckItems.map((c) => ({
        分类: ({ lighting: '灯光', sound: '音响', stage: '舞台', other: '其他' } as Record<string, string>)[c.category],
        检查项: c.name,
        状态: c.checked ? '✓ 已检查' : '✗ 未检查',
      }))
      exportToCSV(checksData, `${eventName}_${dateStr}_检查清单.csv`)
    }

    const eventLogs = state.logs.filter((l) => l.eventId === selectedEventId)
    if (eventLogs.length > 0) {
      const logsData = eventLogs.map((l) => ({
        时间: formatDateTime(l.timestamp),
        类型: ({ info: '信息', warning: '警告', action: '操作' } as Record<string, string>)[l.category],
        内容: l.content,
      }))
      exportToCSV(logsData, `${eventName}_${dateStr}_日志.csv`)
    }

    const eventIncidents = state.incidents.filter((i) => i.eventId === selectedEventId)
    if (eventIncidents.length > 0) {
      const incidentsData = eventIncidents.map((i) => ({
        时间: formatDateTime(i.timestamp),
        标题: i.title,
        严重程度: { minor: '轻微', moderate: '一般', serious: '严重' }[i.severity],
        描述: i.description,
        状态: i.handled ? '已处理' : '待处理',
        处理结果: i.resolution || '',
      }))
      exportToCSV(incidentsData, `${eventName}_${dateStr}_事故记录.csv`)
    }

    const eventTimeline = state.timeline.filter((t) => t.eventId === selectedEventId)
      .slice()
      .sort((a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime())
    if (eventTimeline.length > 0) {
      const timelineData = eventTimeline.map((t) => ({
        时间: formatDateTime(t.timestamp),
        类型: timelineTypeLabels[t.type] || t.type,
        标题: t.title,
        说明: t.description || '',
      }))
      exportToCSV(timelineData, `${eventName}_${dateStr}_执行时间线.csv`)
    }
  }

  const exportOptions = [
    {
      key: 'events',
      label: '排期数据',
      description: '导出所有演出、排练、装台、撤场的排期信息',
      data: state.events.map((e) => ({
        类型: { show: '演出', rehearsal: '排练', setup: '装台', teardown: '撤场' }[e.type],
        标题: e.title,
        开始时间: formatDate(e.start),
        结束时间: formatDate(e.end),
        场地: e.venue || '',
        备注: e.description || '',
      })),
    },
    {
      key: 'personnel',
      label: '人员名单',
      description: '导出所有演职人员的信息',
      data: state.personnel.map((p) => ({
        姓名: p.name,
        角色: p.role,
        部门: p.department || '',
        电话: p.phone || '',
        邮箱: p.email || '',
      })),
    },
    {
      key: 'tickets',
      label: '票务数据',
      description: '导出所有售票记录和赠票记录',
      data: ([
        ...state.ticketSales.map((t) => ({
          类型: '售票',
          票种: ({ normal: '普通票', vip: 'VIP票', student: '学生票', complementary: '赠票' } as Record<string, string>)[t.type] || t.type,
          数量: t.quantity,
          单价: t.price,
          总价: t.total,
          受赠方: '',
          事由: '',
          时间: formatDate(t.soldAt),
        })),
        ...state.complementaryTickets.map((t) => ({
          类型: '赠票',
          票种: '赠票',
          数量: t.quantity,
          单价: 0,
          总价: 0,
          受赠方: t.recipient,
          事由: t.reason,
          时间: formatDate(t.issuedAt),
        })),
      ] as any[]),
    },
    {
      key: 'props',
      label: '道具清单',
      description: '导出所有道具的库存和状态信息',
      data: state.props.map((p) => ({
        名称: p.name,
        分类: p.category,
        数量: p.quantity,
        状态: { in_stock: '在库', in_use: '使用中', borrowed: '已借出', maintenance: '维护中' }[p.status],
        位置: p.location || '',
        借用人: state.personnel.find((x) => x.id === p.borrowerId)?.name || '',
      })),
    },
    {
      key: 'costumes',
      label: '服装清单',
      description: '导出所有服装的库存和借还信息',
      data: state.costumes.map((c) => ({
        名称: c.name,
        角色: c.character || '',
        尺码: c.size,
        数量: c.quantity,
        状态: { in_stock: '在库', in_use: '使用中', borrowed: '已借出', cleaning: '清洗中' }[c.status],
        借用人: state.personnel.find((x) => x.id === c.borrowerId)?.name || '',
      })),
    },
    {
      key: 'expenses',
      label: '费用记录',
      description: '导出所有支出记录',
      data: state.expenses.map((e) => ({
        日期: formatDate(e.date),
        分类: e.category,
        说明: e.description,
        金额: e.amount,
        登记人: e.recordedBy || '',
      })),
    },
    {
      key: 'attendance',
      label: '入场统计',
      description: '导出所有场次的观众入场统计',
      data: state.attendance.map((a) => ({
        场次: state.events.find((e) => e.id === a.eventId)?.title || '',
        普通票: a.normalTickets,
        VIP票: a.vipTickets,
        学生票: a.studentTickets,
        赠票: a.complementaryTickets,
        总人数: a.totalAudience,
        统计时间: formatDate(a.recordedAt),
      })),
    },
  ]

  return (
    <div className="space-y-6">
      <Card
        title={
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-500" />
            <span>场次执行包导出</span>
          </div>
        }
        subtitle="选择一个场次，一键导出排期、人员、物资、票务、清单和日志"
      >
        <div className="flex items-end gap-4">
          <div className="flex-1 max-w-md">
            <Select
              label="选择场次"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              options={[
                { value: '', label: '请选择场次...' },
                ...state.events
                  .slice()
                  .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime())
                  .map((e) => ({
                    value: e.id,
                    label: `${e.title}（${formatDateTime(e.start)}）`,
                  })),
              ]}
            />
          </div>
          <Button
            onClick={handleExportPack}
            disabled={!selectedEventId}
          >
            <Download className="w-4 h-4" />
            导出执行包
          </Button>
        </div>
        {selectedEventId && (() => {
          const ev = state.events.find((e) => e.id === selectedEventId)
          if (!ev) return null
          const eventAssignments = state.assignments.filter((a) => a.eventId === selectedEventId)
          const eventTickets = state.ticketSales.filter((t) => t.eventId === selectedEventId)
          const eventComp = state.complementaryTickets.filter((t) => t.eventId === selectedEventId)
          const eventLogs = state.logs.filter((l) => l.eventId === selectedEventId)
          const eventIncidents = state.incidents.filter((i) => i.eventId === selectedEventId)
          const eventPropAssignments = state.eventPropAssignments.filter((a) => a.eventId === selectedEventId)
          const eventCostumeAssignments = state.eventCostumeAssignments.filter((a) => a.eventId === selectedEventId)
          const eventCheckItems = state.checkItems.filter((c) => c.eventId === selectedEventId)
          const eventTimeline = state.timeline.filter((t) => t.eventId === selectedEventId)
          const personnelCheckins = state.personnelCheckins.filter((c) => c.eventId === selectedEventId)
          const propCheckins = state.propCheckins.filter((c) => c.eventId === selectedEventId)
          const costumeCheckins = state.costumeCheckins.filter((c) => c.eventId === selectedEventId)
          const pConfirmed = personnelCheckins.filter(c => c.confirmed).length
          const prConfirmed = propCheckins.filter(c => c.confirmed).length
          const cConfirmed = costumeCheckins.filter(c => c.confirmed).length
          const packItems = [
            { label: '排期信息', count: 1 },
            { label: '人员排班', count: eventAssignments.length, sub: `${pConfirmed}/${eventAssignments.length} 已确认` },
            { label: '道具清单', count: eventPropAssignments.length, sub: `${prConfirmed}/${eventPropAssignments.length} 已确认` },
            { label: '服装清单', count: eventCostumeAssignments.length, sub: `${cConfirmed}/${eventCostumeAssignments.length} 已确认` },
            { label: '票务数据', count: eventTickets.length + eventComp.length },
            { label: '检查清单', count: eventCheckItems.length },
            { label: '演出日志', count: eventLogs.length },
            { label: '事故记录', count: eventIncidents.length },
            { label: '执行时间线', count: eventTimeline.length },
          ]
          return (
            <div className="mt-4 p-4 rounded-xl bg-amber-50/50 border border-amber-200">
              <p className="text-sm font-medium text-amber-800 mb-3">
                即将导出「{ev.title}」的执行包，包含以下内容：
              </p>
              <div className="grid grid-cols-3 gap-2">
                {packItems.map((item) => (
                  <div key={item.label} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white text-sm">
                    <div>
                      <span className="text-slate-600">{item.label}</span>
                      {item.sub && <span className="text-[10px] text-slate-400 ml-1">（{item.sub}）</span>}
                    </div>
                    <span className={cn('font-medium', item.count > 0 ? 'text-amber-600' : 'text-slate-300')}>
                      {item.count} 条
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        })()}
      </Card>

      <Card
        title="分类数据导出"
        subtitle="支持将各类数据导出为 CSV 格式，可用 Excel 打开"
      >
        <div className="grid grid-cols-2 gap-4">
          {exportOptions.map((opt) => (
            <div
              key={opt.key}
              className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/30 transition-all"
            >
              <div>
                <h4 className="font-semibold text-slate-800">{opt.label}</h4>
                <p className="text-sm text-slate-500 mt-0.5">{opt.description}</p>
                <p className="text-xs text-slate-400 mt-1">共 {opt.data.length} 条记录</p>
              </div>
              <Button
                size="sm"
                onClick={() => exportToCSV(opt.data, `${opt.label}_${formatDate(new Date())}.csv`)}
              >
                <Download className="w-4 h-4" />
                导出
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
