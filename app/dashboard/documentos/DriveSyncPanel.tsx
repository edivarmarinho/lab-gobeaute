'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, CheckCircle2, AlertTriangle, Clock, CloudOff, Cloud } from 'lucide-react'
import { clsx } from 'clsx'

type SyncLog = {
  id: string
  executado_em: string
  arquivos_novos: number
  arquivos_total: number
  status: 'ok' | 'erro'
  detalhe: string | null
}

type SyncStatus = {
  isConfigured: boolean
  lastSync: SyncLog | null
}

export default function DriveSyncPanel({ canSync }: { canSync: boolean }) {
  const [status, setStatus] = useState<SyncStatus | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function fetchStatus() {
    try {
      const res = await fetch('/api/sync/drive')
      if (res.ok) setStatus(await res.json())
    } catch {}
  }

  useEffect(() => { fetchStatus() }, [])

  async function handleSync() {
    setSyncing(true)
    setResult(null)
    try {
      const res = await fetch('/api/sync/drive', { method: 'POST' })
      const json = await res.json()
      if (res.ok) {
        setResult(`✅ Sync concluído — ${json.novos} novos arquivos de ${json.total} encontrados`)
        await fetchStatus()
      } else {
        setResult(`❌ ${json.error}`)
      }
    } catch (e: any) {
      setResult(`❌ ${e.message}`)
    } finally {
      setSyncing(false)
    }
  }

  const lastSync = status?.lastSync
  const isConfigured = status?.isConfigured ?? false

  function timeAgo(iso: string) {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
    if (diff < 60) return 'agora mesmo'
    if (diff < 3600) return `há ${Math.floor(diff / 60)} min`
    if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`
    return `há ${Math.floor(diff / 86400)} dias`
  }

  return (
    <div className={clsx(
      'flex items-center gap-3 px-4 py-3 rounded-xl border text-sm',
      !isConfigured
        ? 'bg-gray-50 border-gray-200'
        : lastSync?.status === 'erro'
          ? 'bg-red-50 border-red-100'
          : 'bg-emerald-50 border-emerald-100'
    )}>
      {/* Ícone de status */}
      <div className="shrink-0">
        {!isConfigured
          ? <CloudOff className="w-5 h-5 text-gray-400" />
          : lastSync?.status === 'erro'
            ? <AlertTriangle className="w-5 h-5 text-red-500" />
            : <Cloud className="w-5 h-5 text-emerald-500" />
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        {!isConfigured ? (
          <p className="text-gray-500 text-xs">
            Google Drive não configurado.{' '}
            <a
              href="https://console.cloud.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 underline"
            >
              Configurar agora
            </a>
          </p>
        ) : lastSync ? (
          <div className="flex items-center gap-3 flex-wrap">
            <span className={clsx(
              'text-xs font-medium',
              lastSync.status === 'ok' ? 'text-emerald-700' : 'text-red-600'
            )}>
              {lastSync.status === 'ok'
                ? `Drive sincronizado — ${lastSync.arquivos_total} arquivos · ${lastSync.arquivos_novos} novos`
                : `Erro na última sync: ${lastSync.detalhe}`
              }
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              {timeAgo(lastSync.executado_em)}
            </span>
          </div>
        ) : (
          <p className="text-xs text-gray-500">Nenhuma sync executada ainda.</p>
        )}

        {result && (
          <p className="text-xs mt-1 text-gray-600">{result}</p>
        )}
      </div>

      {/* Botão */}
      {canSync && isConfigured && (
        <button
          onClick={handleSync}
          disabled={syncing}
          className="shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
        >
          <RefreshCw className={clsx('w-3.5 h-3.5', syncing && 'animate-spin')} />
          {syncing ? 'Sincronizando...' : 'Sync agora'}
        </button>
      )}
    </div>
  )
}
