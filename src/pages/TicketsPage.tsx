import { useState, useMemo } from 'react'
import {
  DollarSign,
  Ticket,
  Users,
  Gift,
  Plus,
  BarChart3,
  TrendingUp,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { useAppStore } from '../store'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Input from '../components/Input'
import Select from '../components/Select'
import Modal from '../components/Modal'
import { cn, formatDate, formatDateTime } from '../lib/utils'
import type { TicketType } from '../types'

const ticketTypeLabels: Record<TicketType, string> = {
  normal: '普通票',
  vip: 'VIP票',
  student: '学生票',
  complementary: '赠票',
}

const ticketColors: Record<TicketType, string> = {
  normal: '#64748b',
  vip: '#f59e0b',
  student: '#3b82f6',
  complementary: '#10b981',
}

type TabType = 'sales' | 'complementary' | 'attendance'

export default function TicketsPage() {
  const [tab, setTab] = useState<TabType>('sales')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">票务统计</h2>
        <p className="text-sm text-slate-500 mt-1">管理票房录入、赠票登记和观众入场统计</p>
      </div>

      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
        <button
          onClick={() => setTab('sales')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
            tab === 'sales' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700',
          )}
        >
          票房录入
        </button>
        <button
          onClick={() => setTab('complementary')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
            tab === 'complementary' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700',
          )}
        >
          赠票登记
        </button>
        <button
          onClick={() => setTab('attendance')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
            tab === 'attendance' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700',
          )}
        >
          入场统计
        </button>
      </div>

      <StatsOverview />

      {tab === 'sales' && <SalesRecord />}
      {tab === 'complementary' && <ComplementaryRecord />}
      {tab === 'attendance' && <AttendanceStats />}
    </div>
  )
}

function StatsOverview() {
  const ticketSales = useAppStore((s) => s.ticketSales)
  const complementary = useAppStore((s) => s.complementaryTickets)
  const attendance = useAppStore((s) => s.attendance)

  const totalRevenue = ticketSales.reduce((sum, t) => sum + t.total, 0)
  const totalTicketsSold = ticketSales.reduce((sum, t) => sum + t.quantity, 0)
  const totalComplementary = complementary.reduce((sum, t) => sum + t.quantity, 0)
  const totalAttendance = attendance.reduce((sum, a) => sum + a.totalAudience, 0)

  const stats = [
    { label: '总票房', value: `¥${totalRevenue.toLocaleString()}`, icon: <DollarSign className="w-5 h-5 text-amber-500" />, trend: '+12%' },
    { label: '售票数量', value: `${totalTicketsSold} 张`, icon: <Ticket className="w-5 h-5 text-blue-500" />, trend: '+8%' },
    { label: '赠票数量', value: `${totalComplementary} 张`, icon: <Gift className="w-5 h-5 text-green-500" />, trend: '+5%' },
    { label: '累计观众', value: `${totalAttendance} 人`, icon: <Users className="w-5 h-5 text-purple-500" />, trend: '+15%' },
  ]

  return (
    <div className="grid grid-cols-4 gap-4">
      {stats.map((s) => (
        <Card key={s.label}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">{s.label}</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{s.value}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50">{s.icon}</div>
          </div>
          <div className="flex items-center gap-1 mt-3 text-xs text-green-600">
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="font-medium">{s.trend}</span>
            <span className="text-slate-400">较上周</span>
          </div>
        </Card>
      ))}
    </div>
  )
}

function SalesRecord() {
  const ticketSales = useAppStore((s) => s.ticketSales)
  const shows = useAppStore((s) => s.shows)
  const events = useAppStore((s) => s.events)
  const addTicketSale = useAppStore((s) => s.addTicketSale)

  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    eventId: '',
    type: 'normal' as TicketType,
    quantity: 1,
    price: 180,
    soldBy: '',
    notes: '',
  })

  const getShowTitle = (showId?: string) => shows.find((s) => s.id === showId)?.title || '-'
  const getEventTitle = (eventId?: string) => events.find((e) => e.id === eventId)?.title || '-'

  const chartData = useMemo(() => {
    const byType: Record<string, number> = {}
    ticketSales.forEach((t) => {
      byType[ticketTypeLabels[t.type]] = (byType[ticketTypeLabels[t.type]] || 0) + t.quantity
    })
    return Object.entries(byType).map(([name, value]) => ({ name, value }))
  }, [ticketSales])

  const handleSave = () => {
    if (!formData.eventId) return
    const event = events.find((e) => e.id === formData.eventId)
    addTicketSale({
      ...formData,
      showId: event?.showId || '',
      total: formData.quantity * formData.price,
      soldAt: new Date().toISOString(),
      notes: formData.notes || undefined,
      soldBy: formData.soldBy || undefined,
    })
    setShowModal(false)
    setFormData({ eventId: '', type: 'normal', quantity: 1, price: 180, soldBy: '', notes: '' })
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-6">
        <Card title="售票记录" className="col-span-2" rightAction={
          <Button size="sm" onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4" />
            录入售票
          </Button>
        }>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-slate-500 border-b border-slate-100">
                  <th className="py-3 px-4 font-medium">场次</th>
                  <th className="py-3 px-4 font-medium">票种</th>
                  <th className="py-3 px-4 font-medium">数量</th>
                  <th className="py-3 px-4 font-medium">单价</th>
                  <th className="py-3 px-4 font-medium">小计</th>
                  <th className="py-3 px-4 font-medium">时间</th>
                </tr>
              </thead>
              <tbody>
                {ticketSales.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      暂无售票记录
                    </td>
                  </tr>
                ) : (
                  [...ticketSales]
                    .sort((a, b) => new Date(b.soldAt).getTime() - new Date(a.soldAt).getTime())
                    .map((t) => (
                      <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="py-3 px-4 text-sm text-slate-800">{getEventTitle(t.eventId)}</td>
                        <td className="py-3 px-4">
                          <Badge variant={t.type === 'vip' ? 'warning' : t.type === 'student' ? 'info' : 'default'}>
                            {ticketTypeLabels[t.type]}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600">{t.quantity} 张</td>
                        <td className="py-3 px-4 text-sm text-slate-600">¥{t.price}</td>
                        <td className="py-3 px-4 text-sm font-semibold text-slate-800">¥{t.total.toLocaleString()}</td>
                        <td className="py-3 px-4 text-sm text-slate-500">{formatDateTime(t.soldAt)}</td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="票种分布">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={Object.values(ticketColors)[index % Object.values(ticketColors).length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4">
            {chartData.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: Object.values(ticketColors)[i % Object.values(ticketColors).length] }}
                  />
                  <span className="text-slate-600">{d.name}</span>
                </div>
                <span className="font-medium text-slate-800">{d.value} 张</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="录入售票"
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
            label="场次"
            value={formData.eventId}
            onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
            options={[
              { value: '', label: '请选择场次' },
              ...events.map((e) => ({ value: e.id, label: `${e.title} (${formatDate(e.start)})` })),
            ]}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="票种"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as TicketType })}
              options={Object.entries(ticketTypeLabels)
                .filter(([k]) => k !== 'complementary')
                .map(([v, l]) => ({ value: v, label: l }))}
            />
            <Input
              label="售票人"
              value={formData.soldBy}
              onChange={(e) => setFormData({ ...formData, soldBy: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="数量"
              type="number"
              min={1}
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
            />
            <Input
              label="单价 (¥)"
              type="number"
              min={0}
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="p-4 rounded-lg bg-amber-50 flex items-center justify-between">
            <span className="text-sm text-amber-700">应收金额</span>
            <span className="text-2xl font-bold text-amber-700">
              ¥{(formData.quantity * formData.price).toLocaleString()}
            </span>
          </div>
          <Input
            label="备注"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>
      </Modal>
    </>
  )
}

function ComplementaryRecord() {
  const complementary = useAppStore((s) => s.complementaryTickets)
  const events = useAppStore((s) => s.events)
  const shows = useAppStore((s) => s.shows)
  const addComplementaryTicket = useAppStore((s) => s.addComplementaryTicket)

  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    eventId: '',
    recipient: '',
    quantity: 1,
    reason: '',
    issuedBy: '',
  })

  const getEventTitle = (eventId?: string) => events.find((e) => e.id === eventId)?.title || '-'

  const handleSave = () => {
    if (!formData.eventId || !formData.recipient) return
    const event = events.find((e) => e.id === formData.eventId)
    addComplementaryTicket({
      ...formData,
      showId: event?.showId || '',
      issuedAt: new Date().toISOString(),
      issuedBy: formData.issuedBy || undefined,
    })
    setShowModal(false)
    setFormData({ eventId: '', recipient: '', quantity: 1, reason: '', issuedBy: '' })
  }

  return (
    <>
      <Card
        title="赠票登记"
        subtitle={`共 ${complementary.reduce((s, t) => s + t.quantity, 0)} 张赠票已登记`}
        rightAction={
          <Button size="sm" onClick={() => setShowModal(true)}>
            <Gift className="w-4 h-4" />
            登记赠票
          </Button>
        }
      >
        {complementary.length === 0 ? (
          <p className="text-slate-400 text-center py-8">暂无赠票记录</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-slate-500 border-b border-slate-100">
                  <th className="py-3 px-4 font-medium">场次</th>
                  <th className="py-3 px-4 font-medium">受赠方</th>
                  <th className="py-3 px-4 font-medium">数量</th>
                  <th className="py-3 px-4 font-medium">事由</th>
                  <th className="py-3 px-4 font-medium">登记人</th>
                  <th className="py-3 px-4 font-medium">登记时间</th>
                </tr>
              </thead>
              <tbody>
                {[...complementary]
                  .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime())
                  .map((t) => (
                    <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="py-3 px-4 text-sm text-slate-800">{getEventTitle(t.eventId)}</td>
                      <td className="py-3 px-4 text-sm font-medium text-slate-800">{t.recipient}</td>
                      <td className="py-3 px-4">
                        <Badge variant="success">{t.quantity} 张</Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">{t.reason}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{t.issuedBy || '-'}</td>
                      <td className="py-3 px-4 text-sm text-slate-500">{formatDateTime(t.issuedAt)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="登记赠票"
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
            label="场次"
            value={formData.eventId}
            onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
            options={[
              { value: '', label: '请选择场次' },
              ...events.map((e) => ({ value: e.id, label: `${e.title} (${formatDate(e.start)})` })),
            ]}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="受赠方"
              value={formData.recipient}
              onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
              placeholder="如：媒体嘉宾、合作单位"
            />
            <Input
              label="数量"
              type="number"
              min={1}
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
            />
          </div>
          <Input
            label="事由"
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            placeholder="如：媒体宣传、商务合作"
          />
          <Input
            label="登记人"
            value={formData.issuedBy}
            onChange={(e) => setFormData({ ...formData, issuedBy: e.target.value })}
          />
        </div>
      </Modal>
    </>
  )
}

function AttendanceStats() {
  const attendance = useAppStore((s) => s.attendance)
  const events = useAppStore((s) => s.events)
  const addAttendance = useAppStore((s) => s.addAttendance)

  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    eventId: '',
    normalTickets: 0,
    vipTickets: 0,
    studentTickets: 0,
    complementaryTickets: 0,
  })

  const getEventTitle = (eventId?: string) => events.find((e) => e.id === eventId)?.title || '-'

  const chartData = attendance.map((a) => ({
    name: getEventTitle(a.eventId).slice(0, 8),
    普通票: a.normalTickets,
    VIP票: a.vipTickets,
    学生票: a.studentTickets,
    赠票: a.complementaryTickets,
  }))

  const handleSave = () => {
    if (!formData.eventId) return
    addAttendance({
      ...formData,
      totalAudience:
        formData.normalTickets +
        formData.vipTickets +
        formData.studentTickets +
        formData.complementaryTickets,
      recordedAt: new Date().toISOString(),
    })
    setShowModal(false)
    setFormData({ eventId: '', normalTickets: 0, vipTickets: 0, studentTickets: 0, complementaryTickets: 0 })
  }

  return (
    <>
      <Card
        title="观众入场统计"
        rightAction={
          <Button size="sm" onClick={() => setShowModal(true)}>
            <Users className="w-4 h-4" />
            录入统计
          </Button>
        }
      >
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="普通票" fill="#64748b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="VIP票" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="学生票" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="赠票" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title="历史记录">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-slate-500 border-b border-slate-100">
                <th className="py-3 px-4 font-medium">场次</th>
                <th className="py-3 px-4 font-medium">普通票</th>
                <th className="py-3 px-4 font-medium">VIP票</th>
                <th className="py-3 px-4 font-medium">学生票</th>
                <th className="py-3 px-4 font-medium">赠票</th>
                <th className="py-3 px-4 font-medium">总人数</th>
                <th className="py-3 px-4 font-medium">统计时间</th>
              </tr>
            </thead>
            <tbody>
              {attendance.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    暂无入场统计
                  </td>
                </tr>
              ) : (
                [...attendance]
                  .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
                  .map((a) => (
                    <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="py-3 px-4 text-sm text-slate-800">{getEventTitle(a.eventId)}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{a.normalTickets}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{a.vipTickets}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{a.studentTickets}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{a.complementaryTickets}</td>
                      <td className="py-3 px-4">
                        <Badge variant="success" className="font-semibold">{a.totalAudience} 人</Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-500">{formatDateTime(a.recordedAt)}</td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="录入入场统计"
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
            label="场次"
            value={formData.eventId}
            onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
            options={[
              { value: '', label: '请选择场次' },
              ...events.map((e) => ({ value: e.id, label: `${e.title} (${formatDate(e.start)})` })),
            ]}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="普通票入场"
              type="number"
              min={0}
              value={formData.normalTickets}
              onChange={(e) => setFormData({ ...formData, normalTickets: parseInt(e.target.value) || 0 })}
            />
            <Input
              label="VIP票入场"
              type="number"
              min={0}
              value={formData.vipTickets}
              onChange={(e) => setFormData({ ...formData, vipTickets: parseInt(e.target.value) || 0 })}
            />
            <Input
              label="学生票入场"
              type="number"
              min={0}
              value={formData.studentTickets}
              onChange={(e) => setFormData({ ...formData, studentTickets: parseInt(e.target.value) || 0 })}
            />
            <Input
              label="赠票入场"
              type="number"
              min={0}
              value={formData.complementaryTickets}
              onChange={(e) => setFormData({ ...formData, complementaryTickets: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="p-4 rounded-lg bg-green-50 flex items-center justify-between">
            <span className="text-sm text-green-700">入场总人数</span>
            <span className="text-2xl font-bold text-green-700">
              {formData.normalTickets +
                formData.vipTickets +
                formData.studentTickets +
                formData.complementaryTickets}{' '}
              人
            </span>
          </div>
        </div>
      </Modal>
    </>
  )
}
