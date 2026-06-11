import { useState, useMemo } from 'react'
import { parseISO, format, isWithinInterval } from 'date-fns'
import {
  UserPlus,
  Mail,
  Phone,
  Building2,
  CalendarX,
  Plus,
  Trash2,
  Edit2,
  Search,
  Check,
  X,
  Clock,
} from 'lucide-react'
import { useAppStore } from '../store'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Input from '../components/Input'
import Select from '../components/Select'
import TextArea from '../components/TextArea'
import Modal from '../components/Modal'
import { cn, formatDate, formatDateTime } from '../lib/utils'
import type { PersonnelRole, LeaveRecord } from '../types'

const roleLabels: Record<PersonnelRole, string> = {
  director: '导演',
  actor: '演员',
  stage_manager: '舞台监督',
  lighting: '灯光',
  sound: '音响',
  costume: '服装',
  prop: '道具',
  ticket: '票务',
  usher: '场务',
  other: '其他',
}

const roleColors: Record<PersonnelRole, string> = {
  director: 'from-rose-400 to-rose-600',
  actor: 'from-blue-400 to-blue-600',
  stage_manager: 'from-amber-400 to-amber-600',
  lighting: 'from-yellow-400 to-yellow-600',
  sound: 'from-green-400 to-green-600',
  costume: 'from-purple-400 to-purple-600',
  prop: 'from-orange-400 to-orange-600',
  ticket: 'from-teal-400 to-teal-600',
  usher: 'from-cyan-400 to-cyan-600',
  other: 'from-slate-400 to-slate-600',
}

const leaveStatusLabels: Record<LeaveRecord['status'], string> = {
  pending: '待审批',
  approved: '已批准',
  rejected: '已拒绝',
}

const leaveStatusVariants: Record<LeaveRecord['status'], 'warning' | 'success' | 'danger'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
}

type TabType = 'personnel' | 'leaves' | 'schedule'

export default function PersonnelPage() {
  const [tab, setTab] = useState<TabType>('personnel')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">人员排班</h2>
        <p className="text-sm text-slate-500 mt-1">管理人员信息、请假申请和排班安排</p>
      </div>

      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
        {[
          { key: 'personnel', label: '人员名单' },
          { key: 'leaves', label: '请假登记' },
          { key: 'schedule', label: '排班总览' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as TabType)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              tab === t.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'personnel' && <PersonnelList />}
      {tab === 'leaves' && <LeaveList />}
      {tab === 'schedule' && <ScheduleOverview />}
    </div>
  )
}

function PersonnelList() {
  const personnel = useAppStore((s) => s.personnel)
  const addPersonnel = useAppStore((s) => s.addPersonnel)
  const updatePersonnel = useAppStore((s) => s.updatePersonnel)
  const deletePersonnel = useAppStore((s) => s.deletePersonnel)

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    role: 'actor' as PersonnelRole,
    phone: '',
    email: '',
    department: '',
    notes: '',
  })

  const filtered = useMemo(() => {
    return personnel
      .filter((p) => (roleFilter === 'all' ? true : p.role === roleFilter))
      .filter(
        (p) =>
          search
            ? p.name.toLowerCase().includes(search.toLowerCase()) ||
              p.department?.toLowerCase().includes(search.toLowerCase())
            : true,
      )
  }, [personnel, search, roleFilter])

  const openModal = (p?: any) => {
    if (p) {
      setEditing(p)
      setFormData({
        name: p.name,
        role: p.role,
        phone: p.phone || '',
        email: p.email || '',
        department: p.department || '',
        notes: p.notes || '',
      })
    } else {
      setEditing(null)
      setFormData({ name: '', role: 'actor', phone: '', email: '', department: '', notes: '' })
    }
    setShowModal(true)
  }

  const handleSave = () => {
    if (!formData.name) return
    if (editing) {
      updatePersonnel(editing.id, formData)
    } else {
      addPersonnel(formData)
    }
    setShowModal(false)
  }

  const handleDelete = (id: string) => {
    if (confirm('确定删除此人员吗？')) {
      deletePersonnel(id)
    }
  }

  return (
    <>
      <div className="flex gap-4 flex-wrap">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="搜索人员..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-40"
          options={[
            { value: 'all', label: '全部角色' },
            ...Object.entries(roleLabels).map(([v, l]) => ({ value: v, label: l })),
          ]}
        />
        <Button onClick={() => openModal()}>
          <UserPlus className="w-4 h-4" />
          添加人员
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => (
          <Card key={p.id} className="hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-lg',
                    roleColors[p.role],
                  )}
                >
                  {p.name[0]}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">{p.name}</h4>
                  <Badge variant="default">{roleLabels[p.role]}</Badge>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => openModal(p)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              {p.department && (
                <div className="flex items-center gap-2 text-slate-500">
                  <Building2 className="w-4 h-4" />
                  {p.department}
                </div>
              )}
              {p.phone && (
                <div className="flex items-center gap-2 text-slate-500">
                  <Phone className="w-4 h-4" />
                  {p.phone}
                </div>
              )}
              {p.email && (
                <div className="flex items-center gap-2 text-slate-500">
                  <Mail className="w-4 h-4" />
                  {p.email}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? '编辑人员' : '添加人员'}
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
          <Input
            label="姓名"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Select
            label="角色"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as PersonnelRole })}
            options={Object.entries(roleLabels).map(([v, l]) => ({ value: v, label: l }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="联系电话"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Input
              label="邮箱"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <Input
            label="所属部门"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          />
          <TextArea
            label="备注"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
          />
        </div>
      </Modal>
    </>
  )
}

function LeaveList() {
  const leaves = useAppStore((s) => s.leaves)
  const personnel = useAppStore((s) => s.personnel)
  const addLeave = useAppStore((s) => s.addLeave)
  const updateLeave = useAppStore((s) => s.updateLeave)
  const deleteLeave = useAppStore((s) => s.deleteLeave)

  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    personnelId: '',
    startDate: '',
    endDate: '',
    reason: '',
    status: 'pending' as LeaveRecord['status'],
  })

  const handleSave = () => {
    if (!formData.personnelId || !formData.startDate || !formData.endDate || !formData.reason) return
    addLeave(formData)
    setShowModal(false)
    setFormData({ personnelId: '', startDate: '', endDate: '', reason: '', status: 'pending' })
  }

  const getPersonnelName = (id: string) => personnel.find((p) => p.id === id)?.name || '未知'

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => setShowModal(true)}>
          <CalendarX className="w-4 h-4" />
          登记请假
        </Button>
      </div>

      <Card>
        {leaves.length === 0 ? (
          <p className="text-slate-400 text-center py-8">暂无请假记录</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-slate-500 border-b border-slate-100">
                  <th className="py-3 px-4 font-medium">申请人</th>
                  <th className="py-3 px-4 font-medium">请假时间</th>
                  <th className="py-3 px-4 font-medium">请假原因</th>
                  <th className="py-3 px-4 font-medium">状态</th>
                  <th className="py-3 px-4 font-medium">申请时间</th>
                  <th className="py-3 px-4 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((l) => (
                  <tr key={l.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{getPersonnelName(l.personnelId)}</div>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {formatDate(l.startDate)} ~ {formatDate(l.endDate)}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600 max-w-xs truncate">{l.reason}</td>
                    <td className="py-3 px-4">
                      <Badge variant={leaveStatusVariants[l.status]}>{leaveStatusLabels[l.status]}</Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-500">{formatDate(l.createdAt)}</td>
                    <td className="py-3 px-4">
                      {l.status === 'pending' && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => updateLeave(l.id, { status: 'approved' })}
                            className="p-1.5 rounded-lg hover:bg-green-50 text-green-500"
                            title="批准"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => updateLeave(l.id, { status: 'rejected' })}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"
                            title="拒绝"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      <button
                        onClick={() => {
                          if (confirm('确定删除此请假记录吗？')) deleteLeave(l.id)
                        }}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
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
        title="登记请假"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              取消
            </Button>
            <Button onClick={handleSave}>提交</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Select
            label="请假人"
            value={formData.personnelId}
            onChange={(e) => setFormData({ ...formData, personnelId: e.target.value })}
            options={[
              { value: '', label: '请选择' },
              ...personnel.map((p) => ({ value: p.id, label: p.name })),
            ]}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="开始日期"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
            <Input
              label="结束日期"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </div>
          <TextArea
            label="请假原因"
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            rows={4}
          />
        </div>
      </Modal>
    </>
  )
}

function ScheduleOverview() {
  const events = useAppStore((s) => s.events)
  const personnel = useAppStore((s) => s.personnel)
  const assignments = useAppStore((s) => s.assignments)
  const leaves = useAppStore((s) => s.leaves)

  const sortedEvents = [...events].sort(
    (a, b) => parseISO(a.start).getTime() - parseISO(b.start).getTime(),
  )

  const isOnLeave = (personnelId: string, eventStart: string, eventEnd: string) => {
    return leaves.some(
      (l) =>
        l.status !== 'rejected' &&
        isWithinInterval(parseISO(eventStart), {
          start: parseISO(l.startDate),
          end: new Date(parseISO(l.endDate).getTime() + 86400000),
        }) &&
        l.personnelId === personnelId,
    )
  }

  return (
    <Card title="本周排班" subtitle="查看近7天所有场次的人员安排">
      {sortedEvents.length === 0 ? (
        <p className="text-slate-400 text-center py-8">暂无排期</p>
      ) : (
        <div className="space-y-4">
          {sortedEvents.slice(0, 7).map((event) => {
            const eventAssignments = assignments.filter((a) => a.eventId === event.id)
            return (
              <div key={event.id} className="p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-slate-800">{event.title}</h4>
                    <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDateTime(event.start)}
                    </p>
                  </div>
                  <Badge variant="info">{eventAssignments.length} 人排班</Badge>
                </div>
                {eventAssignments.length === 0 ? (
                  <p className="text-sm text-slate-400">暂无排班人员</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {eventAssignments.map((a) => {
                      const p = personnel.find((per) => per.id === a.personnelId)
                      const onLeave = p && isOnLeave(p.id, event.start, event.end)
                      return (
                        <div
                          key={a.id}
                          className={cn(
                            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm',
                            onLeave ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-700',
                          )}
                        >
                          <div
                            className={cn(
                              'w-6 h-6 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-xs font-medium',
                              roleColors[p?.role || 'other'],
                            )}
                          >
                            {p?.name[0] || '?'}
                          </div>
                          <span className="font-medium">{p?.name || '未知'}</span>
                          <span className="text-xs opacity-70">({a.role})</span>
                          {onLeave && <Badge variant="danger">请假</Badge>}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
