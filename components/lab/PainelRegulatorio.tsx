'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ShieldCheck, Lock, Unlock, Save, Calendar, Building2, Factory,
  AlertTriangle, CheckCircle2, FileText, Info, Loader2
} from 'lucide-react'
import { clsx } from 'clsx'
import { ComplianceBadge } from './ComplianceBadge'

type Severidade = 'ok' | 'warning' | 'error'

const FORMAS_COSMETICAS = [
  'Creme', 'Loção', 'Gel', 'Sérum', 'Shampoo', 'Condicionador', 'Máscara capilar',
  'Sabonete líquido', 'Sabonete em barra', 'Óleo facial/corporal', 'Body Splash',
  'Desodorante roll-on', 'Desodorante spray', 'Desodorante em pó', 'Protetor solar',
  'Maquiagem fluida', 'Pó compacto', 'Batom', 'Hidratante labial', 'Suplemento (cápsula)',
  'Suplemento (sachê)', 'Suplemento (líquido)', 'Outro',
]

export default function PainelRegulatorio({
  formula,
  canEdit,
  isAdmin,
  statusCompliance,
}: {
  formula: any
  canEdit: boolean
  isAdmin: boolean
  statusCompliance: Severidade
}) {
  const router = useRouter()
  const isLocked = formula.anvisa_locked === true

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const [posse, setPosse] = useState(formula.posse ?? 'gobeaute')
  const [fechadaFabrica, setFechadaFabrica] = useState(formula.fechada_pela_fabrica === true)
  const [fabricaNome, setFabricaNome] = useState(formula.fabrica_nome ?? '')
  const [fabricaObs, setFabricaObs] = useState(formula.fabrica_observacoes ?? '')
  const [grau, setGrau] = useState(formula.anvisa_grau ?? '')
  const [processo, setProcesso] = useState(formula.anvisa_processo ?? '')
  const [protocolo, setProtocolo] = useState(formula.anvisa_data_protocolo ?? '')
  const [vencimento, setVencimento] = useState(formula.anvisa_data_vencimento ?? '')
  const [forma, setForma] = useState(formula.forma_cosmetica ?? '')
  const [detentor, setDetentor] = useState(formula.anvisa_detentor ?? 'gobeaute')

  async function salvar() {
    setSaving(true)
    setErro(null)
    try {
      // Posse / fábrica via PATCH normal (campo livre)
      const res1 = await fetch(`/api/formulas/${formula.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          posse, fechada_pela_fabrica: fechadaFabrica,
          fabrica_nome: fabricaNome || null,
          fabrica_observacoes: fabricaObs || null,
          anvisa_detentor: detentor,
        }),
      })
      // ANVISA específico via endpoint dedicado
      const res2 = await fetch(`/api/formulas/${formula.id}/anvisa`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anvisa_grau: grau || null,
          anvisa_processo: processo || null,
          anvisa_data_protocolo: protocolo || null,
          anvisa_data_vencimento: vencimento || null,
          forma_cosmetica: forma || null,
        }),
      })
      if (!res1.ok || !res2.ok) {
        const j = await (res2.ok ? res1 : res2).json().catch(() => ({}))
        throw new Error(j.error ?? 'Erro ao salvar')
      }
      setEditing(false)
      router.refresh()
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function lockUnlock(action: 'lock' | 'unlock') {
    setSaving(true)
    setErro(null)
    try {
      const res = await fetch(`/api/formulas/${formula.id}/anvisa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro')
      router.refresh()
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setSaving(false)
    }
  }

  // Casos: posse=fabrica + fechada → ANVISA é da fábrica, não precisamos preencher composição/dossier
  const isFabricaFechada = posse === 'fabrica' && fechadaFabrica

  return (
    <div className="space-y-4">

      {/* Lock notice */}
      {isLocked && (
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4 flex items-start gap-3">
          <Lock className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-emerald-800">🔒 Fórmula Registrada na ANVISA — TRAVADA</p>
            <p className="text-xs text-emerald-700 mt-1">
              Esta fórmula está congelada. Qualquer alteração na composição requer abertura de novo processo ANVISA (alteração pós-registro).
              Travada em {formula.anvisa_locked_em ? new Date(formula.anvisa_locked_em).toLocaleString('pt-BR') : '—'}.
            </p>
            {isAdmin && (
              <button
                onClick={() => lockUnlock('unlock')}
                disabled={saving}
                className="mt-3 text-xs flex items-center gap-1.5 bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50 px-3 py-1.5 rounded-lg font-medium transition disabled:opacity-50"
              >
                <Unlock className="w-3.5 h-3.5" />
                {saving ? 'Destravando...' : 'Destravar (admin)'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Posse da fórmula */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-brand-500" />
            <h3 className="font-semibold text-gray-900 text-sm">Posse e Detentor da Fórmula</h3>
          </div>
          {canEdit && !isLocked && !editing && (
            <button onClick={() => setEditing(true)} className="text-xs text-brand-500 hover:text-brand-700 hover:underline transition">
              Editar
            </button>
          )}
        </div>

        {!editing ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400 mb-1">Posse</p>
              <p className="font-medium text-gray-900 flex items-center gap-1.5">
                {posse === 'gobeaute' ? (
                  <><Building2 className="w-3.5 h-3.5 text-brand-500" /> Gobeaute (interna)</>
                ) : (
                  <><Factory className="w-3.5 h-3.5 text-orange-500" /> Fábrica (terceirizada)</>
                )}
              </p>
            </div>
            {posse === 'fabrica' && (
              <>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Fábrica</p>
                  <p className="font-medium text-gray-900">{fabricaNome || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Composição</p>
                  <p className={clsx('font-medium', fechadaFabrica ? 'text-orange-600' : 'text-green-600')}>
                    {fechadaFabrica ? '🔒 Fechada (não compartilhada)' : '🔓 Aberta'}
                  </p>
                </div>
              </>
            )}
            <div>
              <p className="text-xs text-gray-400 mb-1">Detentor do registro ANVISA</p>
              <p className="font-medium text-gray-900 capitalize">{detentor}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Posse da fórmula</label>
                <select value={posse} onChange={e => setPosse(e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white">
                  <option value="gobeaute">Gobeaute (interna)</option>
                  <option value="fabrica">Fábrica (terceirizada)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Detentor do registro ANVISA</label>
                <select value={detentor} onChange={e => setDetentor(e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white">
                  <option value="gobeaute">Gobeaute</option>
                  <option value="fabrica">Fábrica</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
            </div>

            {posse === 'fabrica' && (
              <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 space-y-3">
                <div>
                  <label className="text-xs text-orange-700 font-medium block mb-1">Nome da fábrica</label>
                  <input type="text" value={fabricaNome} onChange={e => setFabricaNome(e.target.value)} placeholder="Ex: Fabricante XYZ Ltda" className="w-full text-sm border border-orange-200 rounded-lg px-3 py-2 bg-white" />
                </div>
                <label className="flex items-center gap-2 text-xs text-orange-700 cursor-pointer">
                  <input type="checkbox" checked={fechadaFabrica} onChange={e => setFechadaFabrica(e.target.checked)} className="rounded" />
                  <span><strong>Fórmula fechada pela fábrica</strong> — composição não compartilhada com a Gobeaute</span>
                </label>
                <div>
                  <label className="text-xs text-orange-700 font-medium block mb-1">Observações</label>
                  <textarea value={fabricaObs} onChange={e => setFabricaObs(e.target.value)} rows={2} placeholder="Ex: Confidencialidade contratual; fábrica detém todos os direitos sobre a fórmula" className="w-full text-sm border border-orange-200 rounded-lg px-3 py-2 bg-white" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Aviso quando fórmula é fechada pela fábrica */}
      {isFabricaFechada && !editing && (
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-start gap-3">
          <Info className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-orange-800">Fórmula fechada — composição mantida pela fábrica</p>
            <p className="text-xs text-orange-700 mt-1">
              A composição completa fica sob responsabilidade de <strong>{fabricaNome || 'fabricante terceiro'}</strong>.
              O Lab Gobeaute mantém apenas o produto e referência. Compliance ANVISA é responsabilidade do detentor do registro.
            </p>
          </div>
        </div>
      )}

      {/* Painel ANVISA */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-500" />
            <h3 className="font-semibold text-gray-900 text-sm">Registro ANVISA</h3>
            {isLocked && <Lock className="w-3.5 h-3.5 text-emerald-600" />}
          </div>
        </div>

        {!editing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400 mb-1">Grau ANVISA</p>
              <p className="font-medium text-gray-900">{grau || <span className="text-amber-600">⚠ Não classificado</span>}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Forma cosmética</p>
              <p className="font-medium text-gray-900">{forma || formula.tipo}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Nº Processo ANVISA</p>
              <p className={clsx('font-mono text-sm', processo ? 'text-gray-900 font-medium' : 'text-amber-600')}>
                {processo || '⚠ Não cadastrado'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Data de protocolo</p>
              <p className="font-medium text-gray-900">{protocolo ? new Date(protocolo).toLocaleDateString('pt-BR') : '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Vencimento do registro</p>
              <p className="font-medium text-gray-900">{vencimento ? new Date(vencimento).toLocaleDateString('pt-BR') : '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Compliance Brasil</p>
              <ComplianceBadge
                showLabel
                check={{
                  severidade: statusCompliance,
                  mensagem: statusCompliance === 'ok' ? 'Compliant' : statusCompliance === 'warning' ? 'Atenção' : 'Não conforme',
                  resolucao: null, restricao: null,
                }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Grau ANVISA</label>
                <select value={grau} onChange={e => setGrau(e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white">
                  <option value="">Não classificado</option>
                  <option value="Grau 1">Grau 1 (notificação simplificada)</option>
                  <option value="Grau 2">Grau 2 (registro completo)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Forma cosmética</label>
                <select value={forma} onChange={e => setForma(e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white">
                  <option value="">Selecione...</option>
                  {FORMAS_COSMETICAS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Nº Processo ANVISA</label>
                <input type="text" value={processo} onChange={e => setProcesso(e.target.value)} placeholder="25351.XXXXXX/YYYY-XX" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 font-mono" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Data de protocolo</label>
                <input type="date" value={protocolo} onChange={e => setProtocolo(e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Vencimento do registro</label>
                <input type="date" value={vencimento} onChange={e => setVencimento(e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2" />
              </div>
            </div>

            {erro && <div className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{erro}</div>}

            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(false)} className="text-sm px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
                Cancelar
              </button>
              <button onClick={salvar} disabled={saving} className="flex items-center gap-1.5 text-sm px-4 py-2 bg-brand-500 text-white hover:bg-brand-600 rounded-lg transition font-medium disabled:opacity-50">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        )}

        {/* Botão de Lock — só mostra se está aprovada e tem dados ANVISA */}
        {!editing && !isLocked && canEdit && processo && grau && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 flex items-start gap-3">
              <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-emerald-800">Travar fórmula como Registrada ANVISA</p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Após travada, a composição fica congelada. Mudanças exigem novo registro.
                </p>
                <button
                  onClick={() => lockUnlock('lock')}
                  disabled={saving}
                  className="mt-2 flex items-center gap-1.5 text-xs bg-emerald-600 text-white hover:bg-emerald-700 px-3 py-1.5 rounded-lg font-medium transition disabled:opacity-50"
                >
                  <Lock className="w-3.5 h-3.5" />
                  {saving ? 'Travando...' : 'Travar fórmula'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
