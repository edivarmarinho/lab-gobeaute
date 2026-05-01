'use client'

import { useState, useMemo, useTransition } from 'react'
import {
  Users, Search, CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp,
  Package, FileWarning, Shield, ShieldOff, Phone, Globe, MessageCircle,
  Star, ExternalLink, Building2, Truck, Award, Edit3, Save, X,
  Mail, Linkedin, Clock, BadgeCheck, Info, BarChart3, ChevronRight,
  Plus, Loader2, GitBranch, FileCheck, CheckCheck
} from 'lucide-react'
import { clsx } from 'clsx'

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Contato = {
  id: string
  fornecedor_id: string
  nome: string
  cargo: string | null
  email: string | null
  telefone: string | null
  whatsapp: string | null
  linkedin: string | null
  tipo: 'comercial' | 'tecnico' | 'financeiro' | 'diretoria' | 'outro'
  principal: boolean
}

type Fornecedor = {
  id: string
  nome: string
  uf: string
  cnpj: string | null
  contato: string | null
  status: string
  iso22716: boolean
  iso9001: boolean
  pendencias: number
  mps_ativas: number
  whatsapp: string | null
  site: string | null
  descricao: string | null
  especialidade: string | null
  linkedin: string | null
  instagram: string | null
  porte: string | null
  categoria_fornecedor: string | null
  avaliacao_geral: number | null
  prazo_entrega_dias: number | null
  condicao_pagamento: string | null
  observacoes: string | null
  [k: string]: any
}

type CRMEvent = {
  id: string
  fornecedor_id: string
  tipo: string
  titulo: string
  detalhe: string | null
  data_evento: string | null
}

// ─── Configs ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { color: string; dot: string }> = {
  'Homologado':   { color: 'bg-green-100 text-green-700',   dot: 'bg-green-500' },
  'Em Avaliação': { color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  'Reprovado':    { color: 'bg-red-100 text-red-700',       dot: 'bg-red-500' },
  'Inativo':      { color: 'bg-gray-100 text-gray-500',     dot: 'bg-gray-400' },
}

const CRM_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  green:  { color: 'text-green-700',  bg: 'bg-green-50 border-green-100',   icon: '✅' },
  yellow: { color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-100', icon: '⚠️' },
  red:    { color: 'text-red-700',    bg: 'bg-red-50 border-red-100',       icon: '🚨' },
  blue:   { color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-100',     icon: 'ℹ️' },
}

const PORTE_LABEL: Record<string, string> = {
  micro: 'Micro', pequeno: 'Pequeno', medio: 'Médio',
  grande: 'Grande', multinacional: 'Multinacional',
}

const CATEGORIA_LABEL: Record<string, string> = {
  fabricante: 'Fabricante', distribuidor: 'Distribuidor',
  importador: 'Importador', representante: 'Representante', outro: 'Outro',
}

const TIPO_CONTATO_COLOR: Record<string, string> = {
  comercial: 'bg-blue-50 text-blue-700',
  tecnico: 'bg-purple-50 text-purple-700',
  financeiro: 'bg-amber-50 text-amber-700',
  diretoria: 'bg-gray-50 text-gray-700',
  outro: 'bg-slate-50 text-slate-600',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function waLink(raw: string) {
  const digits = raw.replace(/\D/g, '')
  const number = digits.startsWith('55') ? digits : `55${digits}`
  return `https://wa.me/${number}`
}

function StarRating({ value }: { value: number | null }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={clsx('w-3.5 h-3.5', i <= (value ?? 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200')}
        />
      ))}
    </div>
  )
}

// ─── Formulário de Edição ─────────────────────────────────────────────────────

type EditFormProps = {
  fornecedor: Fornecedor
  contatos: Contato[]
  onSave: (data: Partial<Fornecedor>, contatos: Contato[]) => Promise<void>
  onCancel: () => void
  externalError?: string | null
}

function EditForm({ fornecedor: f, contatos: initialContatos, onSave, onCancel, externalError }: EditFormProps) {
  const [form, setForm] = useState<Partial<Fornecedor>>({
    status: f.status,
    whatsapp: f.whatsapp ?? '',
    site: f.site ?? '',
    descricao: f.descricao ?? '',
    especialidade: f.especialidade ?? '',
    linkedin: f.linkedin ?? '',
    porte: f.porte ?? '',
    categoria_fornecedor: f.categoria_fornecedor ?? '',
    avaliacao_geral: f.avaliacao_geral,
    prazo_entrega_dias: f.prazo_entrega_dias,
    condicao_pagamento: f.condicao_pagamento ?? '',
    observacoes: f.observacoes ?? '',
    iso22716: f.iso22716,
    iso9001: f.iso9001,
  })
  const [contatos, setContatos] = useState<Contato[]>(initialContatos)
  const [saving, startSave] = useTransition()
  const [tab, setTab] = useState<'geral' | 'contatos' | 'qualificacao'>('geral')

  function setField(k: string, v: any) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  function addContato() {
    setContatos(prev => [...prev, {
      id: `new-${Date.now()}`,
      fornecedor_id: f.id,
      nome: '', cargo: null, email: null, telefone: null,
      whatsapp: null, linkedin: null, tipo: 'comercial' as const, principal: false
    }])
  }

  function updateContato(idx: number, field: string, value: any) {
    setContatos(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c))
  }

  function removeContato(idx: number) {
    setContatos(prev => prev.filter((_, i) => i !== idx))
  }

  function handleSave() {
    startSave(async () => { await onSave(form, contatos) })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
          <Edit3 className="w-5 h-5 text-brand-500" />
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-gray-900 truncate">{f.nome}</h2>
            <p className="text-xs text-gray-400">Editar dados do fornecedor</p>
          </div>
          <button onClick={onCancel} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-3 pb-0 border-b border-gray-100">
          {(['geral', 'contatos', 'qualificacao'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={clsx(
                'text-xs font-medium px-3 py-2 rounded-t-lg border-b-2 transition-all capitalize',
                tab === t
                  ? 'border-brand-500 text-brand-600 bg-brand-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              {t === 'geral' ? 'Dados Gerais' : t === 'contatos' ? 'Contatos' : 'Qualificação'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {tab === 'geral' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setField('status', e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300"
                  >
                    {['Homologado', 'Em Avaliação', 'Reprovado', 'Inativo'].map(s => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Categoria</label>
                  <select
                    value={form.categoria_fornecedor ?? ''}
                    onChange={e => setField('categoria_fornecedor', e.target.value || null)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300"
                  >
                    <option value="">Selecionar...</option>
                    {Object.entries(CATEGORIA_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Descrição</label>
                <textarea
                  value={form.descricao ?? ''}
                  onChange={e => setField('descricao', e.target.value)}
                  rows={3}
                  placeholder="Quem é esse fornecedor, história, diferenciais..."
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Especialidade / Portfolio</label>
                <input
                  value={form.especialidade ?? ''}
                  onChange={e => setField('especialidade', e.target.value)}
                  placeholder="Ex: Ativos cosméticos, óleos vegetais, fragrâncias..."
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">WhatsApp (só dígitos)</label>
                  <input
                    value={form.whatsapp ?? ''}
                    onChange={e => setField('whatsapp', e.target.value)}
                    placeholder="5511999990000"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Site</label>
                  <input
                    value={form.site ?? ''}
                    onChange={e => setField('site', e.target.value)}
                    placeholder="https://..."
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">LinkedIn</label>
                  <input
                    value={form.linkedin ?? ''}
                    onChange={e => setField('linkedin', e.target.value)}
                    placeholder="https://linkedin.com/company/..."
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Porte</label>
                  <select
                    value={form.porte ?? ''}
                    onChange={e => setField('porte', e.target.value || null)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300"
                  >
                    <option value="">Selecionar...</option>
                    {Object.entries(PORTE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Observações internas</label>
                <textarea
                  value={form.observacoes ?? ''}
                  onChange={e => setField('observacoes', e.target.value)}
                  rows={2}
                  placeholder="Notas internas, alertas, contexto de negociação..."
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none"
                />
              </div>
            </div>
          )}

          {tab === 'contatos' && (
            <div className="space-y-3">
              {contatos.map((c, idx) => (
                <div key={c.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50 relative">
                  <button
                    onClick={() => removeContato(idx)}
                    className="absolute top-3 right-3 p-1 hover:bg-gray-200 rounded transition"
                  >
                    <X className="w-3.5 h-3.5 text-gray-400" />
                  </button>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Nome *</label>
                      <input
                        value={c.nome}
                        onChange={e => updateContato(idx, 'nome', e.target.value)}
                        placeholder="Nome completo"
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-300"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Cargo</label>
                      <input
                        value={c.cargo ?? ''}
                        onChange={e => updateContato(idx, 'cargo', e.target.value)}
                        placeholder="Ex: Gerente Comercial"
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-300"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">E-mail</label>
                      <input
                        value={c.email ?? ''}
                        onChange={e => updateContato(idx, 'email', e.target.value)}
                        placeholder="contato@empresa.com.br"
                        type="email"
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-300"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">WhatsApp</label>
                      <input
                        value={c.whatsapp ?? ''}
                        onChange={e => updateContato(idx, 'whatsapp', e.target.value)}
                        placeholder="5511999990000"
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-300"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 items-center">
                    <div className="flex-1">
                      <label className="text-xs text-gray-400 block mb-1">Tipo</label>
                      <select
                        value={c.tipo}
                        onChange={e => updateContato(idx, 'tipo', e.target.value)}
                        className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-300"
                      >
                        {Object.keys(TIPO_CONTATO_COLOR).map(t => (
                          <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-gray-500 mt-4 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={c.principal}
                        onChange={e => updateContato(idx, 'principal', e.target.checked)}
                        className="rounded"
                      />
                      Contato principal
                    </label>
                  </div>
                </div>
              ))}

              <button
                onClick={addContato}
                className="w-full flex items-center justify-center gap-2 text-sm text-brand-600 border border-dashed border-brand-300 rounded-xl py-3 hover:bg-brand-50 transition"
              >
                <Plus className="w-4 h-4" /> Adicionar contato
              </button>
            </div>
          )}

          {tab === 'qualificacao' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-2">Avaliação Geral</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => setField('avaliacao_geral', n === form.avaliacao_geral ? null : n)}
                      className={clsx(
                        'w-10 h-10 rounded-lg border-2 text-sm font-bold transition-all',
                        n <= (form.avaliacao_geral ?? 0)
                          ? 'border-amber-400 bg-amber-50 text-amber-600'
                          : 'border-gray-200 text-gray-300 hover:border-amber-300'
                      )}
                    >
                      {n}
                    </button>
                  ))}
                  <span className="self-center text-xs text-gray-400 ml-1">
                    {form.avaliacao_geral ? `${form.avaliacao_geral}/5` : 'Não avaliado'}
                  </span>
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={!!form.iso22716}
                    onChange={e => setField('iso22716', e.target.checked)}
                    className="rounded"
                  />
                  <Shield className="w-4 h-4 text-blue-500" />
                  ISO 22716
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={!!form.iso9001}
                    onChange={e => setField('iso9001', e.target.checked)}
                    className="rounded"
                  />
                  <Shield className="w-4 h-4 text-indigo-500" />
                  ISO 9001
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Prazo de entrega (dias)</label>
                  <input
                    type="number"
                    value={form.prazo_entrega_dias ?? ''}
                    onChange={e => setField('prazo_entrega_dias', e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="Ex: 15"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Condição de pagamento</label>
                  <input
                    value={form.condicao_pagamento ?? ''}
                    onChange={e => setField('condicao_pagamento', e.target.value)}
                    placeholder="Ex: 30/60/90 DDL"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {externalError && (
          <p className="px-6 py-2 text-xs text-red-600 bg-red-50 border-t border-red-100">{externalError}</p>
        )}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button onClick={onCancel} className="text-sm px-4 py-2 text-gray-500 hover:text-gray-700 transition">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 text-sm px-5 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar alterações
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Card do Fornecedor ───────────────────────────────────────────────────────

function FornecedorCard({
  f, events, canEdit, contatos,
  isExpanded, onToggle, onEdit
}: {
  f: Fornecedor
  events: CRMEvent[]
  contatos: Contato[]
  canEdit: boolean
  isExpanded: boolean
  onToggle: () => void
  onEdit: () => void
}) {
  const cfg = STATUS_CONFIG[f.status] ?? STATUS_CONFIG['Inativo']
  const hasCritical = events.some(e => e.tipo === 'red')
  const principalContact = contatos.find(c => c.principal) ?? contatos[0] ?? null

  return (
    <div className={clsx(
      'bg-white rounded-xl border shadow-sm transition-all',
      hasCritical ? 'border-red-200' : 'border-gray-100',
      isExpanded && 'shadow-md'
    )}>
      {/* Row principal */}
      <div
        className="flex items-center gap-3 px-4 md:px-5 py-4 cursor-pointer"
        onClick={onToggle}
      >
        {/* Avatar */}
        <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">{f.nome.charAt(0)}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900 truncate">{f.nome}</p>
            {hasCritical && <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
            <span className="hidden sm:flex"><StarRating value={f.avaliacao_geral} /></span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {f.especialidade
              ? <p className="text-xs text-gray-400 truncate">{f.especialidade}</p>
              : <p className="text-xs text-gray-400 truncate">{f.contato ?? '—'}</p>
            }
            {f.categoria_fornecedor && (
              <span className="hidden md:inline shrink-0 text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                {CATEGORIA_LABEL[f.categoria_fornecedor]}
              </span>
            )}
          </div>
        </div>

        {/* Status */}
        <span className={clsx('shrink-0 text-xs px-2.5 py-1 rounded-full font-medium', cfg.color)}>
          <span className={clsx('inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle', cfg.dot)} />
          <span className="hidden sm:inline">{f.status}</span>
        </span>

        {/* ISO badges — ocultos em mobile */}
        <div className="hidden md:flex gap-1.5 shrink-0">
          <span className={clsx('text-xs px-2 py-0.5 rounded font-medium',
            f.iso22716 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400 line-through'
          )}>22716</span>
          <span className={clsx('text-xs px-2 py-0.5 rounded font-medium',
            f.iso9001 ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-400 line-through'
          )}>9001</span>
        </div>

        {/* MPs + pendências — ocultos em mobile pequeno */}
        <div className="hidden sm:flex items-center gap-3 shrink-0 text-xs">
          <span className="flex items-center gap-1 text-gray-500">
            <Package className="w-3.5 h-3.5" />
            {f.mps_ativas} MPs
          </span>
          {f.pendencias > 0 && (
            <span className="bg-red-100 text-red-600 font-medium px-2 py-0.5 rounded-full">
              {f.pendencias} pend.
            </span>
          )}
        </div>

        {/* WhatsApp rápido — oculto em mobile pequeno */}
        {f.whatsapp && (
          <a
            href={waLink(f.whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="hidden sm:flex shrink-0 items-center gap-1 text-xs text-green-600 bg-green-50 hover:bg-green-100 px-2.5 py-1.5 rounded-lg transition font-medium border border-green-100"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span className="hidden md:inline">WhatsApp</span>
          </a>
        )}

        {/* Site — oculto em mobile */}
        {f.site && (
          <a
            href={f.site}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="hidden md:flex shrink-0 p-1.5 text-gray-400 hover:text-brand-500 hover:bg-brand-50 rounded-lg transition"
          >
            <Globe className="w-4 h-4" />
          </a>
        )}

        {isExpanded
          ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
          : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        }
      </div>

      {/* Expanded */}
      {isExpanded && (
        <div className="px-5 pb-5 pt-0 border-t border-gray-50">
          {/* Edit button */}
          {canEdit && (
            <div className="flex justify-end pt-3 pb-1">
              <button
                onClick={e => { e.stopPropagation(); onEdit() }}
                className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 hover:bg-brand-50 px-3 py-1.5 rounded-lg transition border border-brand-100"
              >
                <Edit3 className="w-3.5 h-3.5" /> Editar fornecedor
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
            {/* Dados cadastrais */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> Dados Cadastrais
              </h4>
              <div className="space-y-2 text-sm">
                {f.cnpj && (
                  <div className="flex gap-2">
                    <span className="text-gray-400 w-16 shrink-0">CNPJ</span>
                    <span className="font-mono text-gray-700">{f.cnpj}</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <span className="text-gray-400 w-16 shrink-0">UF</span>
                  <span className="text-gray-700">{f.uf}</span>
                </div>
                {f.contato && (
                  <div className="flex gap-2">
                    <span className="text-gray-400 w-16 shrink-0">E-mail</span>
                    <a href={`mailto:${f.contato}`} className="text-brand-600 hover:underline text-xs truncate">{f.contato}</a>
                  </div>
                )}
                {f.prazo_entrega_dias && (
                  <div className="flex gap-2">
                    <span className="text-gray-400 w-16 shrink-0">Prazo</span>
                    <span className="text-gray-700">{f.prazo_entrega_dias} dias</span>
                  </div>
                )}
                {f.condicao_pagamento && (
                  <div className="flex gap-2">
                    <span className="text-gray-400 w-16 shrink-0">Pgto</span>
                    <span className="text-gray-700">{f.condicao_pagamento}</span>
                  </div>
                )}

                {/* Certificações */}
                <div className="flex gap-1.5 flex-wrap mt-3">
                  {f.iso22716
                    ? <span className="flex items-center gap-1 text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded"><Shield className="w-3 h-3" /> ISO 22716</span>
                    : <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded"><ShieldOff className="w-3 h-3" /> Sem 22716</span>
                  }
                  {f.iso9001
                    ? <span className="flex items-center gap-1 text-xs text-indigo-700 bg-indigo-50 px-2 py-1 rounded"><Shield className="w-3 h-3" /> ISO 9001</span>
                    : <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded"><ShieldOff className="w-3 h-3" /> Sem 9001</span>
                  }
                </div>

                {/* Links */}
                <div className="flex gap-2 flex-wrap mt-2">
                  {f.whatsapp && (
                    <a href={waLink(f.whatsapp)} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-green-600 bg-green-50 hover:bg-green-100 px-2.5 py-1.5 rounded-lg transition font-medium border border-green-100">
                      <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                    </a>
                  )}
                  {f.site && (
                    <a href={f.site} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 hover:bg-gray-100 px-2.5 py-1.5 rounded-lg transition border border-gray-200">
                      <Globe className="w-3.5 h-3.5" /> Site
                    </a>
                  )}
                  {f.linkedin && (
                    <a href={f.linkedin} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition border border-blue-100">
                      <Linkedin className="w-3.5 h-3.5" /> LinkedIn
                    </a>
                  )}
                </div>
              </div>

              {/* Descrição */}
              {f.descricao && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 leading-relaxed">{f.descricao}</p>
                </div>
              )}
            </div>

            {/* Contatos */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Contatos ({contatos.length})
              </h4>
              {contatos.length === 0 ? (
                <p className="text-xs text-gray-400 italic">Nenhum contato cadastrado.</p>
              ) : (
                <div className="space-y-2">
                  {contatos.map(c => (
                    <div key={c.id} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <p className="text-xs font-semibold text-gray-800">{c.nome}</p>
                            {c.principal && <BadgeCheck className="w-3 h-3 text-brand-500" />}
                            <span className={clsx('text-xs px-1.5 py-0.5 rounded', TIPO_CONTATO_COLOR[c.tipo])}>
                              {c.tipo}
                            </span>
                          </div>
                          {c.cargo && <p className="text-xs text-gray-500 mb-1.5">{c.cargo}</p>}
                          <div className="flex gap-2 flex-wrap">
                            {c.email && (
                              <a href={`mailto:${c.email}`} className="flex items-center gap-1 text-xs text-brand-600 hover:underline">
                                <Mail className="w-3 h-3" /> {c.email}
                              </a>
                            )}
                            {c.whatsapp && (
                              <a href={waLink(c.whatsapp)} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded hover:bg-green-100 transition">
                                <MessageCircle className="w-3 h-3" /> WA
                              </a>
                            )}
                            {c.telefone && (
                              <a href={`tel:${c.telefone}`}
                                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
                                <Phone className="w-3 h-3" /> {c.telefone}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CRM */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Histórico CRM ({events.length})
              </h4>
              {events.length === 0 ? (
                <p className="text-xs text-gray-400 italic">Nenhum evento registrado.</p>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {events.map(ev => {
                    const crmCfg = CRM_CONFIG[ev.tipo] ?? CRM_CONFIG.blue
                    return (
                      <div key={ev.id} className={clsx('border rounded-lg px-3 py-2', crmCfg.bg)}>
                        <div className="flex items-start gap-2">
                          <span className="text-sm mt-0.5">{crmCfg.icon}</span>
                          <div className="min-w-0">
                            <p className={clsx('text-xs font-semibold', crmCfg.color)}>{ev.titulo}</p>
                            {ev.detalhe && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{ev.detalhe}</p>}
                            {ev.data_evento && (
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(ev.data_evento).toLocaleDateString('pt-BR')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Observações internas */}
          {f.observacoes && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">{f.observacoes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Formulário Novo Fornecedor ───────────────────────────────────────────────

type NovoFornForm = {
  nome: string
  uf: string
  cnpj: string
  status: string
  especialidade: string
  categoria_fornecedor: string
  porte: string
  whatsapp: string
  site: string
  linkedin: string
  iso22716: boolean
  iso9001: boolean
  descricao: string
  observacoes: string
}

function NovoFornecedorModal({ onClose, onCreated }: { onClose: () => void; onCreated: (f: Fornecedor) => void }) {
  const [form, setForm] = useState<NovoFornForm>({
    nome: '', uf: 'SP', cnpj: '', status: 'Em Avaliação',
    especialidade: '', categoria_fornecedor: '', porte: '',
    whatsapp: '', site: '', linkedin: '',
    iso22716: false, iso9001: false, descricao: '', observacoes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function f(k: keyof NovoFornForm, v: any) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  async function handleCreate() {
    if (!form.nome.trim()) { setError('Nome é obrigatório'); return }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/fornecedores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro ao criar')
      onCreated(json.fornecedor)
    } catch (e: any) {
      setError(e.message)
      setSaving(false)
    }
  }

  const UFS = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
          <Plus className="w-5 h-5 text-emerald-500" />
          <h2 className="font-bold text-gray-900">Novo Fornecedor</h2>
          <button onClick={onClose} className="ml-auto p-1.5 hover:bg-gray-100 rounded-lg transition">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-500 block mb-1">Nome *</label>
              <input className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300" value={form.nome} onChange={e => f('nome', e.target.value)} placeholder="Razão social ou nome comercial" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">UF</label>
              <select className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300" value={form.uf} onChange={e => f('uf', e.target.value)}>
                {UFS.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">CNPJ</label>
              <input className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300" value={form.cnpj} onChange={e => f('cnpj', e.target.value)} placeholder="00.000.000/0001-00" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Status inicial</label>
              <select className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300" value={form.status} onChange={e => f('status', e.target.value)}>
                <option>Em Avaliação</option>
                <option>Homologado</option>
                <option>Reprovado</option>
                <option>Inativo</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Categoria</label>
              <select className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300" value={form.categoria_fornecedor} onChange={e => f('categoria_fornecedor', e.target.value)}>
                <option value="">— selecione —</option>
                {Object.entries(CATEGORIA_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Porte</label>
              <select className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300" value={form.porte} onChange={e => f('porte', e.target.value)}>
                <option value="">— selecione —</option>
                {Object.entries(PORTE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Especialidade / Portfolio</label>
            <input className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300" value={form.especialidade} onChange={e => f('especialidade', e.target.value)} placeholder="Ex: Ativos cosméticos, óleos vegetais..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">WhatsApp</label>
              <input className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300" value={form.whatsapp} onChange={e => f('whatsapp', e.target.value)} placeholder="5511999990000" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Site</label>
              <input className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300" value={form.site} onChange={e => f('site', e.target.value)} placeholder="https://..." />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Observações</label>
            <textarea rows={2} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none" value={form.observacoes} onChange={e => f('observacoes', e.target.value)} placeholder="Notas internas..." />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" className="rounded" checked={form.iso22716} onChange={e => f('iso22716', e.target.checked)} />
              <Shield className="w-4 h-4 text-blue-500" /> ISO 22716
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" className="rounded" checked={form.iso9001} onChange={e => f('iso9001', e.target.checked)} />
              <Shield className="w-4 h-4 text-indigo-500" /> ISO 9001
            </label>
          </div>
        </div>
        {error && <p className="px-6 py-2 text-xs text-red-600 bg-red-50 border-t border-red-100">{error}</p>}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="text-sm px-4 py-2 text-gray-500 hover:text-gray-700 transition">Cancelar</button>
          <button onClick={handleCreate} disabled={saving} className="flex items-center gap-2 text-sm px-5 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Cadastrar fornecedor
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Workflow Tab ─────────────────────────────────────────────────────────────

const HOMOLOG_ETAPAS = [
  'Aval. Documental',
  'Aprov. Documental',
  'Aprov. Bancada',
  'Testes QA',
  'Homologado',
] as const

type HomologEtapa = typeof HOMOLOG_ETAPAS[number]

const ETAPA_DOT: Record<HomologEtapa, string> = {
  'Aval. Documental':  'bg-blue-400',
  'Aprov. Documental': 'bg-indigo-400',
  'Aprov. Bancada':    'bg-amber-400',
  'Testes QA':         'bg-orange-400',
  'Homologado':        'bg-green-500',
}

function WorkflowTab({
  fornecedores, crm, canEdit, onIniciarHomolog,
}: {
  fornecedores: Fornecedor[]
  crm: CRMEvent[]
  canEdit: boolean
  onIniciarHomolog: () => void
}) {
  const workflows = useMemo(() => {
    return crm
      .filter(ev => ev.titulo?.startsWith('Homologação iniciada'))
      .map(ev => {
        const match = ev.titulo.match(/—\s*(MP\S+)\s+(.+)$/)
        const mpCodigo = match?.[1] ?? '—'
        const mpNome   = match?.[2] ?? '—'
        const detalheParts = ev.detalhe?.split('.') ?? []
        const responsavel = detalheParts[0]?.replace('Responsável:', '').trim() ?? '—'
        const prazoRaw = detalheParts[1]?.replace('Prazo:', '').trim() ?? 'a definir'
        const etapa: HomologEtapa = 'Aval. Documental'
        const forn = fornecedores.find(f => f.id === ev.fornecedor_id)
        return { id: ev.id, fornecedorNome: forn?.nome ?? ev.fornecedor_id, mpCodigo, mpNome, etapa, responsavel, prazo: prazoRaw, data: ev.data_evento }
      })
  }, [crm, fornecedores])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-gray-900">Workflow de Homologação</h2>
          <p className="text-xs text-gray-400 mt-0.5">{workflows.length} processo{workflows.length !== 1 ? 's' : ''} em andamento</p>
        </div>
        {canEdit && (
          <button
            onClick={onIniciarHomolog}
            className="flex items-center gap-1.5 text-sm px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition font-medium"
          >
            <Plus className="w-4 h-4" />
            Iniciar Homologação
          </button>
        )}
      </div>

      {workflows.length === 0 ? (
        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-12 text-center">
          <GitBranch className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Nenhum processo de homologação iniciado.</p>
          {canEdit && (
            <button onClick={onIniciarHomolog} className="mt-3 text-sm text-emerald-600 hover:text-emerald-700 font-medium underline">
              Iniciar o primeiro processo
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-400 pb-3 pr-4">MP</th>
                <th className="text-left text-xs font-medium text-gray-400 pb-3 pr-4">Fornecedor</th>
                <th className="text-left text-xs font-medium text-gray-400 pb-3 pr-4">Etapa</th>
                <th className="text-left text-xs font-medium text-gray-400 pb-3 pr-4">Responsável</th>
                <th className="text-left text-xs font-medium text-gray-400 pb-3 pr-4">Início</th>
                <th className="text-left text-xs font-medium text-gray-400 pb-3">Prazo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {workflows.map(w => (
                <tr key={w.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 pr-4">
                    <p className="font-mono text-xs text-gray-500">{w.mpCodigo}</p>
                    <p className="text-xs text-gray-800 font-medium">{w.mpNome}</p>
                  </td>
                  <td className="py-3 pr-4 text-gray-700">{w.fornecedorNome}</td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={clsx('w-2 h-2 rounded-full shrink-0', ETAPA_DOT[w.etapa])} />
                      <span className="text-xs font-medium text-gray-700">{w.etapa}</span>
                    </div>
                    <div className="flex gap-0.5">
                      {HOMOLOG_ETAPAS.map((e, i) => (
                        <div
                          key={e}
                          className={clsx(
                            'h-1.5 flex-1 rounded-full',
                            i <= HOMOLOG_ETAPAS.indexOf(w.etapa) ? 'bg-emerald-400' : 'bg-gray-200'
                          )}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-gray-600 text-xs">{w.responsavel}</td>
                  <td className="py-3 pr-4 text-gray-500 text-xs">
                    {w.data ? new Date(w.data).toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td className="py-3 text-gray-500 text-xs">{w.prazo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Documentos Tab ───────────────────────────────────────────────────────────

const DOC_TIPOS = ['FISPQ', 'COA', 'Ficha Téc.', 'ISO 22716', 'ISO 9001', 'Laudo Micro'] as const

type DocStatus = 'ok' | 'pendente' | 'vencido'

function DocCell({ status }: { status: DocStatus }) {
  if (status === 'ok')      return <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />
  if (status === 'vencido') return <AlertTriangle className="w-4 h-4 text-amber-400 mx-auto" />
  return <XCircle className="w-4 h-4 text-gray-300 mx-auto" />
}

function DocumentosTab({ fornecedores }: { fornecedores: Fornecedor[] }) {
  const [searchDoc, setSearchDoc] = useState('')

  const visible = fornecedores.filter(f =>
    searchDoc === '' || f.nome.toLowerCase().includes(searchDoc.toLowerCase())
  )

  function docStatus(f: Fornecedor, tipo: string): DocStatus {
    if (tipo === 'ISO 22716') return f.iso22716 ? 'ok' : 'pendente'
    if (tipo === 'ISO 9001')  return f.iso9001  ? 'ok' : 'pendente'
    return 'pendente'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-gray-900">Documentos por Fornecedor</h2>
          <p className="text-xs text-gray-400 mt-0.5">Checkmarks de documentação — ISO, FISPQ, COA, laudos</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={searchDoc}
            onChange={e => setSearchDoc(e.target.value)}
            placeholder="Filtrar fornecedor..."
            className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300 w-52"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 w-48">Fornecedor</th>
              {DOC_TIPOS.map(t => (
                <th key={t} className="text-center text-xs font-medium text-gray-500 px-3 py-3 min-w-[80px]">{t}</th>
              ))}
              <th className="text-center text-xs font-medium text-gray-500 px-3 py-3">Pendências</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {visible.map(f => {
              const statuses = DOC_TIPOS.map(t => docStatus(f, t))
              const pendencias = statuses.filter(s => s !== 'ok').length
              return (
                <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800 text-sm">{f.nome}</p>
                    <p className="text-xs text-gray-400">{f.uf}</p>
                  </td>
                  {DOC_TIPOS.map((t, i) => (
                    <td key={t} className="px-3 py-3">
                      <DocCell status={statuses[i]} />
                    </td>
                  ))}
                  <td className="px-3 py-3 text-center">
                    {pendencias > 0
                      ? <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{pendencias}</span>
                      : <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">OK</span>
                    }
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-4 mt-4 text-xs text-gray-400">
        <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Documento OK</span>
        <span className="flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Vencido / Alerta</span>
        <span className="flex items-center gap-1"><XCircle className="w-3.5 h-3.5 text-gray-300" /> Não informado</span>
      </div>
    </div>
  )
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function FornecedoresClient({ fornecedores, crm, contatos, canEdit }: {
  fornecedores: Fornecedor[]
  crm: CRMEvent[]
  contatos: Contato[]
  canEdit: boolean
}) {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('todos')
  const [filterISO, setFilterISO] = useState<string>('todos')
  const [filterCategoria, setFilterCategoria] = useState<string>('todos')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const [novoModal, setNovoModal] = useState(false)
  const [mainTab, setMainTab] = useState<'painel' | 'workflow' | 'documentos'>('painel')
  const [homologModal, setHomologModal] = useState(false)
  const [homologForm, setHomologForm] = useState({ fornecedor_id: '', mp_codigo: '', mp_nome: '', responsavel: 'Patrícia', prazo: '' })
  const [homologSaving, setHomologSaving] = useState(false)
  const [localFornecedores, setLocalFornecedores] = useState(fornecedores)
  const [localContatos, setLocalContatos] = useState(contatos)

  const filtered = useMemo(() => {
    return localFornecedores.filter(f => {
      const matchSearch = search === '' ||
        f.nome.toLowerCase().includes(search.toLowerCase()) ||
        (f.especialidade ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (f.contato ?? '').toLowerCase().includes(search.toLowerCase())
      const matchStatus = filterStatus === 'todos' || f.status === filterStatus
      const matchISO = filterISO === 'todos' ||
        (filterISO === 'iso22716' && f.iso22716) ||
        (filterISO === 'sem_iso' && !f.iso22716)
      const matchCategoria = filterCategoria === 'todos' || f.categoria_fornecedor === filterCategoria
      return matchSearch && matchStatus && matchISO && matchCategoria
    })
  }, [localFornecedores, search, filterStatus, filterISO, filterCategoria])

  const homologados = localFornecedores.filter(f => f.status === 'Homologado').length
  const emAvaliacao = localFornecedores.filter(f => f.status === 'Em Avaliação').length
  const comPendencias = localFornecedores.filter(f => f.pendencias > 0).length

  const crmByForn = useMemo(() => {
    const m: Record<string, CRMEvent[]> = {}
    for (const ev of crm) {
      if (!m[ev.fornecedor_id]) m[ev.fornecedor_id] = []
      m[ev.fornecedor_id].push(ev)
    }
    return m
  }, [crm])

  const contatosByForn = useMemo(() => {
    const m: Record<string, Contato[]> = {}
    for (const c of localContatos) {
      if (!m[c.fornecedor_id as any]) m[c.fornecedor_id as any] = []
      m[c.fornecedor_id as any].push(c)
    }
    return m
  }, [localContatos])

  async function handleSave(id: string, data: Partial<Fornecedor>, updatedContatos: Contato[]) {
    setEditError(null)
    try {
      const res = await fetch(`/api/fornecedores/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fornecedor: data, contatos: updatedContatos }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro ao salvar')
      setLocalFornecedores(prev => prev.map(f => f.id === id ? { ...f, ...json.fornecedor } : f))
      setLocalContatos(prev => [
        ...prev.filter((c: any) => c.fornecedor_id !== id),
        ...(json.contatos ?? [])
      ])
      setEditing(null)
      setEditError(null)
    } catch (err: any) {
      setEditError(err.message ?? 'Erro ao salvar. Tente novamente.')
    }
  }

  const editingFornecedor = editing ? localFornecedores.find(f => f.id === editing) : null

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Modal de novo fornecedor */}
      {novoModal && (
        <NovoFornecedorModal
          onClose={() => setNovoModal(false)}
          onCreated={f => { setLocalFornecedores(prev => [f, ...prev]); setNovoModal(false) }}
        />
      )}

      {/* Modal de edição */}
      {editingFornecedor && (
        <EditForm
          fornecedor={editingFornecedor}
          contatos={contatosByForn[editingFornecedor.id] ?? []}
          onSave={(data, ctts) => handleSave(editingFornecedor.id, data, ctts)}
          onCancel={() => { setEditing(null); setEditError(null) }}
          externalError={editError}
        />
      )}

      {/* Modal Iniciar Homologação */}
      {homologModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
              <GitBranch className="w-5 h-5 text-emerald-500" />
              <h2 className="font-bold text-gray-900">Iniciar Homologação</h2>
              <button onClick={() => setHomologModal(false)} className="ml-auto p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-500" /></button>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Fornecedor</label>
                <select className="input" value={homologForm.fornecedor_id} onChange={e => setHomologForm(p => ({ ...p, fornecedor_id: e.target.value }))}>
                  <option value="">— selecione —</option>
                  {localFornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Código MP</label>
                  <input className="input" value={homologForm.mp_codigo} onChange={e => setHomologForm(p => ({ ...p, mp_codigo: e.target.value }))} placeholder="MP0022" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Nome MP</label>
                  <input className="input" value={homologForm.mp_nome} onChange={e => setHomologForm(p => ({ ...p, mp_nome: e.target.value }))} placeholder="Ácido Cítrico" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Responsável</label>
                  <input className="input" value={homologForm.responsavel} onChange={e => setHomologForm(p => ({ ...p, responsavel: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Prazo</label>
                  <input className="input" type="date" value={homologForm.prazo} onChange={e => setHomologForm(p => ({ ...p, prazo: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <button onClick={() => setHomologModal(false)} className="text-sm px-4 py-2 text-gray-500">Cancelar</button>
              <button
                disabled={homologSaving || !homologForm.fornecedor_id || !homologForm.mp_codigo}
                onClick={async () => {
                  setHomologSaving(true)
                  await fetch('/api/homolog', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(homologForm) })
                  setHomologSaving(false)
                  setHomologModal(false)
                }}
                className="flex items-center gap-2 text-sm px-5 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition disabled:opacity-50"
              >
                {homologSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitBranch className="w-4 h-4" />}
                Iniciar processo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-6 h-6 text-emerald-500" />
        <h1 className="text-xl font-bold text-gray-900">Fornecedores</h1>
        <span className="text-sm text-gray-400 ml-1">{localFornecedores.length} cadastrados</span>
        {canEdit && (
          <button
            onClick={() => setNovoModal(true)}
            className="ml-auto flex items-center gap-1.5 px-2.5 py-2 md:px-3 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Fornecedor</span>
          </button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Homologados',   value: homologados,  color: 'text-green-600',  bg: 'bg-green-50',  icon: CheckCircle2 },
          { label: 'Em Avaliação',  value: emAvaliacao,  color: 'text-yellow-600', bg: 'bg-yellow-50', icon: AlertTriangle },
          { label: 'Com Pendências',value: comPendencias, color: 'text-red-600',   bg: 'bg-red-50',    icon: FileWarning },
          { label: 'Com ISO 22716', value: localFornecedores.filter(f => f.iso22716).length, color: 'text-blue-600', bg: 'bg-blue-50', icon: Shield },
        ].map(kpi => (
          <div key={kpi.label} className={clsx('rounded-xl p-4 border border-transparent', kpi.bg)}>
            <div className="flex items-center gap-2">
              <kpi.icon className={clsx('w-4 h-4', kpi.color)} />
              <span className="text-xs text-gray-500">{kpi.label}</span>
            </div>
            <p className={clsx('text-2xl font-bold mt-1', kpi.color)}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs principais */}
      <div className="flex gap-1 border-b border-gray-200 mb-5">
        {([
          { key: 'painel', label: 'Painel Geral', icon: BarChart3 },
          { key: 'workflow', label: 'Workflow Homologação', icon: GitBranch },
          { key: 'documentos', label: 'Documentos', icon: FileCheck },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setMainTab(key)}
            className={clsx(
              'flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 border-b-2 transition-all',
              mainTab === key
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── ABA: Painel Geral ── */}
      {mainTab === 'painel' && (
        <>
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-5">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nome, especialidade ou contato..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300"
              />
            </div>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-300"
            >
              <option value="todos">Todos os status</option>
              <option value="Homologado">Homologado</option>
              <option value="Em Avaliação">Em Avaliação</option>
              <option value="Reprovado">Reprovado</option>
              <option value="Inativo">Inativo</option>
            </select>
            <select
              value={filterISO}
              onChange={e => setFilterISO(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-300"
            >
              <option value="todos">Todos (ISO)</option>
              <option value="iso22716">Com ISO 22716</option>
              <option value="sem_iso">Sem ISO 22716</option>
            </select>
            <select
              value={filterCategoria}
              onChange={e => setFilterCategoria(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-300"
            >
              <option value="todos">Todas categorias</option>
              {Object.entries(CATEGORIA_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <span className="text-xs text-gray-400 self-center">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Cards */}
          <div className="space-y-3">
            {filtered.map(f => (
              <FornecedorCard
                key={f.id}
                f={f}
                events={crmByForn[f.id] ?? []}
                contatos={contatosByForn[f.id] ?? []}
                canEdit={canEdit}
                isExpanded={expanded === f.id}
                onToggle={() => setExpanded(expanded === f.id ? null : f.id)}
                onEdit={() => { setExpanded(f.id); setEditing(f.id) }}
              />
            ))}
          </div>
        </>
      )}

      {/* ── ABA: Workflow Homologação ── */}
      {mainTab === 'workflow' && (
        <WorkflowTab
          fornecedores={localFornecedores}
          crm={crm}
          canEdit={canEdit}
          onIniciarHomolog={() => setHomologModal(true)}
        />
      )}

      {/* ── ABA: Documentos ── */}
      {mainTab === 'documentos' && (
        <DocumentosTab fornecedores={localFornecedores} />
      )}
    </div>
  )
}
