import { CheckCircle2, Circle, FlaskConical, Zap, Rocket } from 'lucide-react'

const FASES = [
  {
    fase: 'Fase 1',
    periodo: 'Q2 2026',
    titulo: 'Fundação Operacional',
    icon: FlaskConical,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    itens: [
      { label: 'Dashboard executivo com KPIs do lab', done: true },
      { label: 'Biblioteca de Matérias-Primas (200+ MPs)', done: true },
      { label: 'CRM de Fornecedores com contatos e histórico', done: true },
      { label: 'Kanban de Projetos P&D com 6 etapas', done: true },
      { label: 'Biblioteca de Fórmulas com ingredientes e versões', done: true },
      { label: 'Central de Documentos com alertas de vencimento', done: true },
      { label: 'Categoria Fragrâncias com campos IFRA e notas olfativas', done: true },
      { label: 'Formulários de cadastro de MP, Fornecedor, Projeto e Fórmula', done: true },
      { label: 'Google Drive Sync — importação automática de documentos', done: true },
      { label: 'Controle de acesso por perfil (Admin, P&D, Visualizador)', done: true },
    ],
  },
  {
    fase: 'Fase 2',
    periodo: 'Q3 2026',
    titulo: 'Inteligência e Rastreabilidade',
    icon: Zap,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
    itens: [
      { label: 'Workflow de Homologação com avanço por etapas', done: false },
      { label: 'Modal Comparativo Homologado × Candidato', done: false },
      { label: 'Painel de Gaps — MPs faltantes na sequência', done: false },
      { label: 'Portal do Fornecedor com login por código GB-2026-XXXX', done: false },
      { label: 'Aba Documentos por fornecedor com checkmarks', done: false },
      { label: 'Notificações de documentos vencendo por e-mail', done: false },
    ],
  },
  {
    fase: 'Fase 3',
    periodo: 'Q4 2026',
    titulo: 'Automação e Escala',
    icon: Rocket,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
    itens: [
      { label: 'Integração ERP — sync de pedidos e notas fiscais', done: false },
      { label: 'Análise de custo de fórmula com cotação de MPs em tempo real', done: false },
      { label: 'Geração automática de INCI list para regulatório ANVISA', done: false },
      { label: 'App mobile (PWA) para acesso em campo', done: false },
      { label: 'Relatórios exportáveis (PDF, Excel) por marca e categoria', done: false },
    ],
  },
]

export default function RoadmapPage() {
  const totalFeitos = FASES.flatMap(f => f.itens).filter(i => i.done).length
  const totalItens = FASES.flatMap(f => f.itens).length

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Roadmap do Lab Gobeaute P&D</h1>
        <p className="text-sm text-gray-500">Evolução planejada do sistema em 3 fases — 2026</p>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${Math.round((totalFeitos / totalItens) * 100)}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-emerald-600 shrink-0">
            {totalFeitos}/{totalItens} entregues
          </span>
        </div>
      </div>

      {/* Fases */}
      <div className="space-y-6">
        {FASES.map(fase => {
          const feitos = fase.itens.filter(i => i.done).length
          const pct = Math.round((feitos / fase.itens.length) * 100)
          return (
            <div key={fase.fase} className={`bg-white rounded-2xl border ${fase.border} shadow-sm overflow-hidden`}>
              {/* Header da fase */}
              <div className={`px-6 py-4 ${fase.bg} border-b ${fase.border} flex items-center gap-4`}>
                <div className={`w-10 h-10 rounded-xl ${fase.bg} border ${fase.border} flex items-center justify-center`}>
                  <fase.icon className={`w-5 h-5 ${fase.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold uppercase tracking-wide ${fase.color}`}>{fase.fase}</span>
                    <span className="text-xs text-gray-400 font-medium">{fase.periodo}</span>
                  </div>
                  <p className="font-semibold text-gray-900">{fase.titulo}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-xl font-bold ${fase.color}`}>{pct}%</p>
                  <p className="text-xs text-gray-400">{feitos}/{fase.itens.length} itens</p>
                </div>
              </div>

              {/* Itens */}
              <div className="px-6 py-4 space-y-3">
                {fase.itens.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    {item.done
                      ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      : <Circle className="w-5 h-5 text-gray-300 shrink-0 mt-0.5" />
                    }
                    <span className={`text-sm ${item.done ? 'text-gray-700' : 'text-gray-400'}`}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
