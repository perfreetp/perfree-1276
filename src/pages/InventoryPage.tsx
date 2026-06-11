import { useState } from 'react'
import {
  Package,
  Shirt,
  Plus,
  Trash2,
  Search,
  ArrowLeftRight,
  MapPin,
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
import { cn, formatDate } from '../lib/utils'
import type { PropStatus, CostumeStatus, EventPropAssignment, EventCostumeAssignment } from '../types'

const propStatusLabels: Record<PropStatus, string> = {
  in_stock: '在库',
  in_use: '使用中',
  borrowed: '已借出',
  maintenance: '维护中',
}

const propStatusVariants: Record<PropStatus, 'success' | 'warning' | 'info' | 'danger'> = {
  in_stock: 'success',
  in_use: 'warning',
  borrowed: 'info',
  maintenance: 'danger',
}

const costumeStatusLabels: Record<CostumeStatus, string> = {
  in_stock: '在库',
  in_use: '使用中',
  borrowed: '已借出',
  cleaning: '清洗中',
}

const costumeStatusVariants: Record<CostumeStatus, 'success' | 'warning' | 'info' | 'purple'> = {
  in_stock: 'success',
  in_use: 'warning',
  borrowed: 'info',
  cleaning: 'purple',
}

type TabType = 'props' | 'costumes'

export default function InventoryPage() {
  const [tab, setTab] = useState<TabType>('props')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">物资管理</h2>
        <p className="text-sm text-slate-500 mt-1">管理道具、服装的库存和借还记录</p>
      </div>

      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
        <button
          onClick={() => setTab('props')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
            tab === 'props' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700',
          )}
        >
          <Package className="w-4 h-4" />
          道具清单
        </button>
        <button
          onClick={() => setTab('costumes')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
            tab === 'costumes' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700',
          )}
        >
          <Shirt className="w-4 h-4" />
          服装管理
        </button>
      </div>

      {tab === 'props' && <PropsList />}
      {tab === 'costumes' && <CostumesList />}
    </div>
  )
}

function PropsList() {
  const props = useAppStore((s) => s.props)
  const personnel = useAppStore((s) => s.personnel)
  const events = useAppStore((s) => s.events)
  const eventPropAssignments = useAppStore((s) => s.eventPropAssignments)
  const addProp = useAppStore((s) => s.addProp)
  const updateProp = useAppStore((s) => s.updateProp)
  const deleteProp = useAppStore((s) => s.deleteProp)
  const addEventPropAssignment = useAppStore((s) => s.addEventPropAssignment)
  const deleteEventPropAssignment = useAppStore((s) => s.deleteEventPropAssignment)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: 1,
    status: 'in_stock' as PropStatus,
    location: '',
    borrowerId: '',
    borrowDate: '',
    returnDate: '',
    notes: '',
  })
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assignTargetId, setAssignTargetId] = useState<string | null>(null)
  const [assignForm, setAssignForm] = useState({
    eventId: '',
    quantity: 1,
    notes: '',
  })

  const getEventTitle = (id: string) => events.find((e) => e.id === id)?.title || '-'
  const getAssignmentsForProp = (propId: string) =>
    eventPropAssignments.filter((a) => a.propId === propId)

  const openAssignModal = (propId: string) => {
    setAssignTargetId(propId)
    setAssignForm({ eventId: '', quantity: 1, notes: '' })
    setShowAssignModal(true)
  }

  const handleAssign = () => {
    if (!assignTargetId || !assignForm.eventId) return
    addEventPropAssignment({
      eventId: assignForm.eventId,
      propId: assignTargetId,
      quantity: assignForm.quantity || 1,
      notes: assignForm.notes || undefined,
    })
    setShowAssignModal(false)
    setAssignTargetId(null)
  }

  const filtered = props.filter(
    (p) =>
      (statusFilter === 'all' ? true : p.status === statusFilter) &&
      (search
        ? p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.category.toLowerCase().includes(search.toLowerCase())
        : true),
  )

  const openModal = (p?: any) => {
    if (p) {
      setEditing(p)
      setFormData({
        name: p.name,
        category: p.category,
        quantity: p.quantity,
        status: p.status,
        location: p.location || '',
        borrowerId: p.borrowerId || '',
        borrowDate: p.borrowDate ? formatDate(p.borrowDate) : '',
        returnDate: p.returnDate ? formatDate(p.returnDate) : '',
        notes: p.notes || '',
      })
    } else {
      setEditing(null)
      setFormData({
        name: '',
        category: '',
        quantity: 1,
        status: 'in_stock',
        location: '',
        borrowerId: '',
        borrowDate: '',
        returnDate: '',
        notes: '',
      })
    }
    setShowModal(true)
  }

  const handleSave = () => {
    if (!formData.name || !formData.category) return
    const data = {
      ...formData,
      borrowDate: formData.borrowDate || undefined,
      returnDate: formData.returnDate || undefined,
      borrowerId: formData.borrowerId || undefined,
      location: formData.location || undefined,
      notes: formData.notes || undefined,
    }
    if (editing) {
      updateProp(editing.id, data)
    } else {
      addProp(data)
    }
    setShowModal(false)
  }

  const getBorrowerName = (id?: string) => personnel.find((p) => p.id === id)?.name || '-'

  const stats = [
    { label: '总道具数', value: props.length, variant: 'default' as const },
    { label: '在库', value: props.filter((p) => p.status === 'in_stock').length, variant: 'success' as const },
    { label: '使用中', value: props.filter((p) => p.status === 'in_use').length, variant: 'warning' as const },
    { label: '已借出', value: props.filter((p) => p.status === 'borrowed').length, variant: 'info' as const },
  ]

  return (
    <>
      <div className="grid grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <p className="text-sm text-slate-500">{s.label}</p>
            <div className="flex items-end justify-between mt-1">
              <p className="text-3xl font-bold text-slate-800">{s.value}</p>
              <Badge variant={s.variant}>{s.label}</Badge>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="搜索道具..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-40"
          options={[
            { value: 'all', label: '全部状态' },
            ...Object.entries(propStatusLabels).map(([v, l]) => ({ value: v, label: l })),
          ]}
        />
        <Button onClick={() => openModal()}>
          <Plus className="w-4 h-4" />
          添加道具
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-slate-500 border-b border-slate-100">
                <th className="py-3 px-4 font-medium">名称</th>
                <th className="py-3 px-4 font-medium">分类</th>
                <th className="py-3 px-4 font-medium">数量</th>
                <th className="py-3 px-4 font-medium">状态</th>
                <th className="py-3 px-4 font-medium">位置</th>
                <th className="py-3 px-4 font-medium">已分配场次</th>
                <th className="py-3 px-4 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    暂无道具数据
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const assignments = getAssignmentsForProp(p.id)
                  return (
                    <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-medium text-slate-800">{p.name}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{p.category}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{p.quantity}</td>
                      <td className="py-3 px-4">
                        <Badge variant={propStatusVariants[p.status]}>{propStatusLabels[p.status]}</Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">{p.location || '-'}</td>
                      <td className="py-3 px-4">
                        {assignments.length === 0 ? (
                          <span className="text-xs text-slate-400">未分配</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {assignments.map((a) => (
                              <div key={a.id} className="group relative inline-flex items-center gap-1">
                                <Badge variant="warning" className="text-[10px] py-0 h-5">
                                  {getEventTitle(a.eventId)} ×{a.quantity}
                                </Badge>
                                <button
                                  onClick={() => {
                                    if (confirm('确定取消此场次的分配吗？')) deleteEventPropAssignment(a.id)
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-100 text-slate-400 hover:text-red-500 transition-all"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <button
                            onClick={() => openAssignModal(p.id)}
                            className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600"
                            title="分配到场次"
                          >
                            <ArrowLeftRight className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openModal(p)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('确定删除此道具吗？')) deleteProp(p.id)
                            }}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? '编辑道具' : '添加道具'}
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
              label="道具名称"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              label="分类"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="如：家具、灯具、装饰"
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
            <Select
              label="状态"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as PropStatus })}
              options={Object.entries(propStatusLabels).map(([v, l]) => ({ value: v, label: l }))}
            />
          </div>
          <Input
            label="存放位置"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="如：道具库A-1"
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="借用人"
              value={formData.borrowerId}
              onChange={(e) => setFormData({ ...formData, borrowerId: e.target.value })}
              options={[
                { value: '', label: '无' },
                ...personnel.map((p) => ({ value: p.id, label: p.name })),
              ]}
            />
            <div />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="借用日期"
              type="date"
              value={formData.borrowDate}
              onChange={(e) => setFormData({ ...formData, borrowDate: e.target.value })}
            />
            <Input
              label="预计归还"
              type="date"
              value={formData.returnDate}
              onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
            />
          </div>
          <TextArea
            label="备注"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
          />
        </div>
      </Modal>

      <Modal
        open={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="分配道具到场次"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowAssignModal(false)}>取消</Button>
            <Button onClick={handleAssign}>分配</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Select
            label="选择场次"
            value={assignForm.eventId}
            onChange={(e) => setAssignForm({ ...assignForm, eventId: e.target.value })}
            options={[
              { value: '', label: '请选择场次' },
              ...events.map((e) => ({ value: e.id, label: e.title })),
            ]}
          />
          <Input
            label="分配数量"
            type="number"
            min={1}
            value={assignForm.quantity}
            onChange={(e) => setAssignForm({ ...assignForm, quantity: parseInt(e.target.value) || 1 })}
          />
          <TextArea
            label="备注"
            value={assignForm.notes}
            onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
            rows={2}
          />
        </div>
      </Modal>
    </>
  )
}

function CostumesList() {
  const costumes = useAppStore((s) => s.costumes)
  const personnel = useAppStore((s) => s.personnel)
  const events = useAppStore((s) => s.events)
  const eventCostumeAssignments = useAppStore((s) => s.eventCostumeAssignments)
  const addCostume = useAppStore((s) => s.addCostume)
  const updateCostume = useAppStore((s) => s.updateCostume)
  const deleteCostume = useAppStore((s) => s.deleteCostume)
  const addEventCostumeAssignment = useAppStore((s) => s.addEventCostumeAssignment)
  const deleteEventCostumeAssignment = useAppStore((s) => s.deleteEventCostumeAssignment)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    character: '',
    size: 'M',
    quantity: 1,
    status: 'in_stock' as CostumeStatus,
    borrowerId: '',
    borrowDate: '',
    returnDate: '',
    notes: '',
  })
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assignTargetId, setAssignTargetId] = useState<string | null>(null)
  const [assignForm, setAssignForm] = useState({
    eventId: '',
    quantity: 1,
    notes: '',
  })

  const getEventTitle = (id: string) => events.find((e) => e.id === id)?.title || '-'
  const getAssignmentsForCostume = (costumeId: string) =>
    eventCostumeAssignments.filter((a) => a.costumeId === costumeId)

  const openAssignModal = (costumeId: string) => {
    setAssignTargetId(costumeId)
    setAssignForm({ eventId: '', quantity: 1, notes: '' })
    setShowAssignModal(true)
  }

  const handleAssign = () => {
    if (!assignTargetId || !assignForm.eventId) return
    addEventCostumeAssignment({
      eventId: assignForm.eventId,
      costumeId: assignTargetId,
      quantity: assignForm.quantity || 1,
      notes: assignForm.notes || undefined,
    })
    setShowAssignModal(false)
    setAssignTargetId(null)
  }

  const filtered = costumes.filter(
    (c) =>
      (statusFilter === 'all' ? true : c.status === statusFilter) &&
      (search
        ? c.name.toLowerCase().includes(search.toLowerCase()) ||
          (c.character?.toLowerCase() || '').includes(search.toLowerCase())
        : true),
  )

  const openModal = (c?: any) => {
    if (c) {
      setEditing(c)
      setFormData({
        name: c.name,
        character: c.character || '',
        size: c.size,
        quantity: c.quantity,
        status: c.status,
        borrowerId: c.borrowerId || '',
        borrowDate: c.borrowDate ? formatDate(c.borrowDate) : '',
        returnDate: c.returnDate ? formatDate(c.returnDate) : '',
        notes: c.notes || '',
      })
    } else {
      setEditing(null)
      setFormData({
        name: '',
        character: '',
        size: 'M',
        quantity: 1,
        status: 'in_stock',
        borrowerId: '',
        borrowDate: '',
        returnDate: '',
        notes: '',
      })
    }
    setShowModal(true)
  }

  const handleSave = () => {
    if (!formData.name) return
    const data = {
      ...formData,
      character: formData.character || undefined,
      borrowDate: formData.borrowDate || undefined,
      returnDate: formData.returnDate || undefined,
      borrowerId: formData.borrowerId || undefined,
      notes: formData.notes || undefined,
    }
    if (editing) {
      updateCostume(editing.id, data)
    } else {
      addCostume(data)
    }
    setShowModal(false)
  }

  const getBorrowerName = (id?: string) => personnel.find((p) => p.id === id)?.name || '-'

  return (
    <>
      <div className="flex gap-4 flex-wrap">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="搜索服装..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-40"
          options={[
            { value: 'all', label: '全部状态' },
            ...Object.entries(costumeStatusLabels).map(([v, l]) => ({ value: v, label: l })),
          ]}
        />
        <Button onClick={() => openModal()}>
          <Plus className="w-4 h-4" />
          添加服装
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <Card className="col-span-full">
            <p className="text-slate-400 text-center py-8">暂无服装数据</p>
          </Card>
        ) : (
          filtered.map((c) => {
            const assignments = getAssignmentsForCostume(c.id)
            return (
              <Card key={c.id}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
                      <Shirt className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800">{c.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{c.character || '通用角色'} · {c.size}</p>
                    </div>
                  </div>
                  <Badge variant={costumeStatusVariants[c.status]}>{costumeStatusLabels[c.status]}</Badge>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">数量</span>
                    <span className="text-slate-800">{c.quantity} 件</span>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-500 flex items-center gap-1">
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                        已分配场次
                      </span>
                    </div>
                    {assignments.length === 0 ? (
                      <span className="text-xs text-slate-400">未分配</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {assignments.map((a) => (
                          <div key={a.id} className="group relative inline-flex items-center gap-1">
                            <Badge variant="warning" className="text-[10px] py-0 h-5">
                              {getEventTitle(a.eventId)} ×{a.quantity}
                            </Badge>
                            <button
                              onClick={() => {
                                if (confirm('确定取消此场次的分配吗？')) deleteEventCostumeAssignment(a.id)
                              }}
                              className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-100 text-slate-400 hover:text-red-500 transition-all"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                  <Button size="sm" className="flex-1" onClick={() => openAssignModal(c.id)}>
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    分配
                  </Button>
                  <Button variant="secondary" size="sm" className="flex-1" onClick={() => openModal(c)}>
                    <Edit2 className="w-3.5 h-3.5" />
                    编辑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => {
                      if (confirm('确定删除此服装吗？')) deleteCostume(c.id)
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </Card>
            )
          })
        )}
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? '编辑服装' : '添加服装'}
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
            label="服装名称"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="如：民国长衫、旗袍"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="适用角色"
              value={formData.character}
              onChange={(e) => setFormData({ ...formData, character: e.target.value })}
              placeholder="如：周朴园、繁漪"
            />
            <Select
              label="尺码"
              value={formData.size}
              onChange={(e) => setFormData({ ...formData, size: e.target.value })}
              options={[
                { value: 'XS', label: 'XS' },
                { value: 'S', label: 'S' },
                { value: 'M', label: 'M' },
                { value: 'L', label: 'L' },
                { value: 'XL', label: 'XL' },
                { value: 'XXL', label: 'XXL' },
              ]}
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
            <Select
              label="状态"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as CostumeStatus })}
              options={Object.entries(costumeStatusLabels).map(([v, l]) => ({ value: v, label: l }))}
            />
          </div>
          <Select
            label="借用人"
            value={formData.borrowerId}
            onChange={(e) => setFormData({ ...formData, borrowerId: e.target.value })}
            options={[
              { value: '', label: '无' },
              ...personnel.map((p) => ({ value: p.id, label: p.name })),
            ]}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="借用日期"
              type="date"
              value={formData.borrowDate}
              onChange={(e) => setFormData({ ...formData, borrowDate: e.target.value })}
            />
            <Input
              label="预计归还"
              type="date"
              value={formData.returnDate}
              onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
            />
          </div>
          <TextArea
            label="备注"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
          />
        </div>
      </Modal>

      <Modal
        open={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="分配服装到场次"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowAssignModal(false)}>取消</Button>
            <Button onClick={handleAssign}>分配</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Select
            label="选择场次"
            value={assignForm.eventId}
            onChange={(e) => setAssignForm({ ...assignForm, eventId: e.target.value })}
            options={[
              { value: '', label: '请选择场次' },
              ...events.map((e) => ({ value: e.id, label: e.title })),
            ]}
          />
          <Input
            label="分配数量"
            type="number"
            min={1}
            value={assignForm.quantity}
            onChange={(e) => setAssignForm({ ...assignForm, quantity: parseInt(e.target.value) || 1 })}
          />
          <TextArea
            label="备注"
            value={assignForm.notes}
            onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
            rows={2}
          />
        </div>
      </Modal>
    </>
  )
}
