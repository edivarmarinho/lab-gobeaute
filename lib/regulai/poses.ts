export type RegulAIPose =
  | 'idle'
  | 'analyzing'
  | 'approved'
  | 'inspecting'
  | 'investigating'
  | 'formulating'
  | 'alert'
  | 'support'
  | 'studying'
  | 'certified'

export const POSE_SRC: Record<RegulAIPose, string> = {
  idle: '/regulai/poses/idle.png',
  analyzing: '/regulai/poses/analyzing.png',
  approved: '/regulai/poses/approved.png',
  inspecting: '/regulai/poses/inspecting.png',
  investigating: '/regulai/poses/investigating.png',
  formulating: '/regulai/poses/formulating.png',
  alert: '/regulai/poses/alert.png',
  support: '/regulai/poses/support.png',
  studying: '/regulai/poses/studying.png',
  certified: '/regulai/poses/certified.png',
}

type Rule = { pose: RegulAIPose; patterns: RegExp[] }

const RULES: Rule[] = [
  { pose: 'investigating', patterns: [/microsc[óo]pi/i, /matéria[- ]?prima/i, /\bMP\b/, /ingrediente/i, /ativo regulat/i] },
  { pose: 'formulating', patterns: [/formula[çc][ãa]o/i, /formular/i, /criar f[óo]rmula/i, /desenvolver/i, /receita/i] },
  { pose: 'inspecting', patterns: [/verificar/i, /analisar/i, /checar/i, /avaliar/i, /produto acabado/i] },
  { pose: 'studying', patterns: [/RDC/i, /ANVISA/i, /regulament/i, /norma/i, /legisla[çc][ãa]o/i, /resolu[çc][ãa]o/i] },
  { pose: 'certified', patterns: [/aprovad/i, /homologad/i, /registr/i, /notifica[çc][ãa]o/i, /conform/i, /selo/i, /certifica/i] },
  { pose: 'approved', patterns: [/INCI/i, /claim/i, /r[óo]tulo/i, /permitid/i, /liberad/i] },
]

export function poseForText(text: string): RegulAIPose {
  for (const rule of RULES) {
    if (rule.patterns.some(p => p.test(text))) return rule.pose
  }
  return 'idle'
}

export function poseForState(opts: {
  isLoading: boolean
  isError: boolean
  lastUserText?: string
  lastAssistantText?: string
  feedbackPositive?: boolean
}): RegulAIPose {
  if (opts.isError) return 'alert'
  if (opts.isLoading) return 'support'
  if (opts.feedbackPositive) return 'approved'
  if (opts.lastAssistantText) return poseForText(opts.lastAssistantText)
  if (opts.lastUserText) return poseForText(opts.lastUserText)
  return 'idle'
}
