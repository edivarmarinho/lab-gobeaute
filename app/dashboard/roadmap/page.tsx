import { CheckCircle2, Circle, FlaskConical, Zap, Rocket, Star } from 'lucide-react'

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
      { label: 'Biblioteca de Matérias-Primas (700+ MPs)', done: true },
      { label: 'CRM de Fornecedores com contatos e histórico', done: true },
      { label: 'Kanban de Projetos P&D com 6 etapas', done: true },
      { label: 'Biblioteca de Fórmulas com ingredientes e versões', done: true },
      { label: 'Central de Documentos com alertas de vencimento', done: true },
      { label: 'Categoria Fragrâncias com campos IFRA e notas olfativas', done: true },
      { label: 'Formulários de cadastro de MP, Fornecedor, Projeto e Fórmula', done: true },
      { label: 'Google Drive Sync — importação automática de documentos', done: true },
      { label: 'Controle de acesso por perfil (Admin, P&D, Visualizador)', done: true },
      { label: 'Catálogo de Produtos com crossover de cobertura de fórmulas', done: true },
      { label: 'Indicador de cobertura de fórmulas por marca no dashboard', done: true },
      { label: 'Feed de notícias ANVISA + tendências de ingredientes em tempo real', done: true },
      { label: 'Módulo de Acessos com convites e gestão granular de permissões', done: true },
      { label: 'Login enterprise com apresentação visual do sistema', done: true },
      { label: 'Migration SQL: audit_log, sessions, user_invites, compliance_flags', done: true },
    ],
  },
  {
    fase: 'Fase 2',
    periodo: 'Q3 2026',
    titulo: 'Compliance & Rastreabilidade — Nível Coptis PLM',
    icon: Zap,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
    referencia: 'Inspirado em: Coptis Lab · Veeva RegulatoryOne · RDC 48/2013',
    itens: [
      { label: 'Compliance ANVISA inline: semáforo verde/amarelo/vermelho por ingrediente na fórmula', done: true },
      { label: 'Banco de substâncias restritas/proibidas (IN 39/2016 + RDC 44/2012)', done: true },
      { label: 'Geração automática de Lista INCI em ordem decrescente de concentração', done: true },
      { label: 'Workflow de aprovação de fórmulas: Em Dev → Estabilidade → Aprovada Internamente → Aprovada QA', done: true },
      { label: 'Audit trail imutável: quem alterou o quê, quando, valor anterior e posterior', done: true },
      { label: 'Flags ANVISA nas MPs: alérgeno, CMR, nanomaterial, preservante, corante, filtro UV', done: true },
      { label: 'Página /dashboard/admin/auditoria com audit log + histórico de sessões', done: true },
      { label: 'Página de detalhe de fórmula com 4 tabs: Composição, Regulatório, INCI, Histórico', done: true },
      { label: 'Aba "A Validar BID" para Patrícia revisar fórmulas importadas do BID', done: true },
      { label: 'Feed de notícias automático com agente Claude classificando relevância', done: true },
      { label: 'Campo "% ANVISA" vs "% Desenvolvimento" por ingrediente (Fórmula Mestra RDC 48/2013)', done: false },
      { label: 'Divisão de fórmula em Fases (Fase A, Fase B, Fase C...) com modo operatório', done: false },
      { label: 'Classificação de produto: Grau 1 ou Grau 2 ANVISA (RDC 752/2022)', done: false },
      { label: 'Checklist de documentação obrigatória por grau (notificação vs. registro)', done: false },
      { label: 'Calculadora de custo de fórmula com custo/kg em BRL por ingrediente', done: false },
      { label: 'Rastreabilidade bidirecional: quais fórmulas usam esta MP e vice-versa', done: false },
      { label: 'Notificações de documentos vencidos por e-mail (Sendgrid ou Resend)', done: false },
    ],
  },
  {
    fase: 'Fase 3',
    periodo: 'Q4 2026',
    titulo: 'Inteligência e Escala — Nível Infor PLM + Arena',
    icon: Star,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
    referencia: 'Inspirado em: Infor Optiva · Arena PLM · Veeva QualityOne',
    itens: [
      { label: 'Gestão de testes e estudos: estabilidade, segurança, eficácia com timepoints', done: false },
      { label: 'Workflow de homologação de MP com etapas e responsáveis', done: false },
      { label: 'Portal do Fornecedor com login por código GB-2026-XXXX', done: false },
      { label: 'Modal Comparativo Homologado × Candidato por MP', done: false },
      { label: 'Painel de Gaps — MPs faltantes por marca e categoria', done: false },
      { label: 'Gestão de lotes recebidos de MP com COA vinculado e status (Quarentena → Liberada)', done: false },
      { label: 'Registro de produção por lote com rastreabilidade de MPs consumidas', done: false },
      { label: 'CAPA (Ação Corretiva e Preventiva) por não-conformidade', done: false },
      { label: 'Relatórios exportáveis (PDF, Excel) por marca, categoria e período', done: false },
      { label: 'App mobile PWA para acesso em campo (iPad no laboratório)', done: false },
    ],
  },
  {
    fase: 'Fase 4',
    periodo: '2027',
    titulo: 'Automação e IA — Nível Veeva AI + Coptis AI',
    icon: Rocket,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    dot: 'bg-orange-500',
    referencia: 'Inspirado em: Coptis AI · Veeva AI Agents · Arena AI Engine',
    itens: [
      { label: 'RegulAI: IA para conformidade regulatória ANVISA integrada nas fórmulas', done: false },
      { label: 'Sugestão de substituição de ingrediente por IA (custo + compliance + função)', done: false },
      { label: 'Calculadora de naturality score automático (% natural, % orgânico)', done: false },
      { label: 'Análise de impacto: "se eu banir esta MP, quais fórmulas são afetadas?"', done: false },
      { label: 'Integração ERP Tiny — sync de pedidos, custos e estoque de MP', done: false },
      { label: 'Geração automática de dossier ANVISA (PIF simplificado para Grau 1)', done: false },
      { label: 'Alertas automáticos quando ANVISA publica nova resolução impactando ingredientes', done: false },
      { label: 'BI avançado: análise de portfólio, ROI de P&D, time-to-market por marca', done: false },
    ],
  },
]

export default function RoadmapPage() {
  const totalFeitos = FASES.flatMap(f => f.itens).filter(i => i.done).length
  const totalItens = FASES.flatMap(f => f.itens).length

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Roadmap — Lab Gobeaute P&D</h1>
        <p className="text-sm text-gray-500 mb-1">Evolução planejada em 4 fases · Benchmark: Coptis, Veeva, Infor, Arena PLM</p>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${Math.round((totalFeitos / totalItens) * 100)}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-emerald-600 shrink-0">
            {totalFeitos}/{totalItens} entregues ({Math.round((totalFeitos / totalItens) * 100)}%)
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {FASES.map(fase => {
          const feitos = fase.itens.filter(i => i.done).length
          const pct = Math.round((feitos / fase.itens.length) * 100)
          return (
            <div key={fase.fase} className={`bg-white rounded-2xl border ${fase.border} shadow-sm overflow-hidden`}>
              <div className={`px-6 py-4 ${fase.bg} border-b ${fase.border} flex items-center gap-4`}>
                <div className={`w-10 h-10 rounded-xl ${fase.bg} border ${fase.border} flex items-center justify-center`}>
                  <fase.icon className={`w-5 h-5 ${fase.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-bold uppercase tracking-wide ${fase.color}`}>{fase.fase}</span>
                    <span className="text-xs text-gray-400 font-medium">{fase.periodo}</span>
                    {'referencia' in fase && (
                      <span className="text-xs text-gray-300 font-normal hidden md:inline">· {(fase as any).referencia}</span>
                    )}
                  </div>
                  <p className="font-semibold text-gray-900">{fase.titulo}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-xl font-bold ${fase.color}`}>{pct}%</p>
                  <p className="text-xs text-gray-400">{feitos}/{fase.itens.length}</p>
                </div>
              </div>

              <div className="px-6 py-4 space-y-2.5">
                {fase.itens.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    {item.done
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      : <Circle className="w-4 h-4 text-gray-200 shrink-0 mt-0.5" />
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
