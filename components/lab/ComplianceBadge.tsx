'use client'

import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react'
import { clsx } from 'clsx'
import type { ComplianceCheck } from '@/lib/anvisa'

const CONFIG = {
  ok:      { color: 'text-green-600',   bg: 'bg-green-50',  icon: CheckCircle2,  label: 'OK' },
  info:    { color: 'text-blue-600',    bg: 'bg-blue-50',   icon: Info,          label: 'Info' },
  warning: { color: 'text-amber-600',   bg: 'bg-amber-50',  icon: AlertTriangle, label: 'Atenção' },
  error:   { color: 'text-red-600',     bg: 'bg-red-50',    icon: XCircle,       label: 'Erro' },
}

export function ComplianceBadge({
  check,
  showLabel = false,
  size = 'sm',
}: {
  check: ComplianceCheck
  showLabel?: boolean
  size?: 'sm' | 'md'
}) {
  const cfg = CONFIG[check.severidade]
  const Icon = cfg.icon
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'

  if (!check.mensagem && check.severidade === 'ok') {
    return (
      <span className={clsx('inline-flex items-center gap-1', cfg.color)} title="Compliance OK — nenhuma restrição encontrada">
        <Icon className={iconSize} />
        {showLabel && <span className="text-xs">OK</span>}
      </span>
    )
  }

  return (
    <span
      className={clsx('inline-flex items-center gap-1', cfg.color)}
      title={`${check.mensagem ?? cfg.label}${check.resolucao ? ' · ' + check.resolucao : ''}`}
    >
      <Icon className={iconSize} />
      {showLabel && <span className="text-xs">{cfg.label}</span>}
    </span>
  )
}

export function ComplianceTooltip({ check }: { check: ComplianceCheck }) {
  if (!check.mensagem) return null
  const cfg = CONFIG[check.severidade]
  return (
    <div className={clsx('text-xs p-2 rounded border', cfg.bg, cfg.color, 'border-current/20')}>
      <p className="font-medium">{check.mensagem}</p>
      {check.resolucao && (
        <p className="text-xs opacity-75 mt-1">📜 {check.resolucao}</p>
      )}
    </div>
  )
}
