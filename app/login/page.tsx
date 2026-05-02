'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { FlaskConical, Shield, Microscope, FileText, Users, ChevronRight, Beaker } from 'lucide-react'

const FEATURES = [
  { icon: Beaker,      title: 'Gestão de Fórmulas',    desc: 'Versionamento, compliance ANVISA, INCI automático' },
  { icon: Microscope,  title: 'P&D Integrado',          desc: 'Pipeline Kanban, projetos, testes e estudos' },
  { icon: FileText,    title: 'Documentos & Laudos',    desc: 'COA, FISPQ, laudos com alertas de vencimento' },
  { icon: Shield,      title: 'Compliance ANVISA',      desc: 'RDC 752/2022 · RDC 48/2013 · IN 39/2016' },
  { icon: Users,       title: 'Multi-marca & Acessos',  desc: 'Controle por perfil, marca e departamento' },
  { icon: FlaskConical,'title': 'Matérias-Primas',      desc: '700+ MPs catalogadas, fornecedores, homologação' },
]

const STATS = [
  { label: 'Marcas', value: '7' },
  { label: 'MPs Catalogadas', value: '700+' },
  { label: 'Fórmulas', value: '358' },
  { label: 'Fornecedores', value: '43' },
]

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function signInWithGoogle() {
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
        queryParams: { prompt: 'select_account' },
      },
    })
    if (error) { setError(error.message); setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col lg:flex-row">

      {/* ── Lado esquerdo — branding e features ── */}
      <div className="flex-1 flex flex-col justify-between p-8 lg:p-12 xl:p-16 bg-gradient-to-br from-gray-950 via-gray-900 to-brand-950 relative overflow-hidden">

        {/* Gradiente decorativo */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-2xl translate-x-1/4 translate-y-1/4 pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/30">
              <FlaskConical className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-white tracking-tight">Lab Gobeaute</p>
              <p className="text-xs text-gray-400">Sistema de P&D · GoGroup</p>
            </div>
          </div>
        </div>

        {/* Hero */}
        <div className="relative z-10 my-12 lg:my-0">
          <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
            Sistema em operação · 2026
          </div>
          <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight leading-tight">
            Gestão de P&D<br />
            <span className="text-brand-400">de nível global</span>
          </h1>
          <p className="text-gray-400 mt-4 text-lg max-w-lg leading-relaxed">
            Do laboratório ao registro ANVISA — controle completo de fórmulas, matérias-primas, fornecedores e compliance regulatório.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-8">
            {STATS.map(s => (
              <div key={s.label} className="bg-white/5 rounded-xl p-3 border border-white/5">
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8">
            {FEATURES.map(f => (
              <div key={f.title} className="flex items-start gap-3 bg-white/3 hover:bg-white/5 transition rounded-xl p-3 border border-white/5">
                <div className="w-8 h-8 bg-brand-500/15 rounded-lg flex items-center justify-center shrink-0">
                  <f.icon className="w-4 h-4 text-brand-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-200">{f.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer branding */}
        <div className="relative z-10">
          <p className="text-xs text-gray-600">
            Desenvolvido para GoGroup · Ápice · Barbours · Kokeshi · Rituária · Yenzah · By Samia · Lescent
          </p>
        </div>
      </div>

      {/* ── Lado direito — login ── */}
      <div className="w-full lg:w-[420px] xl:w-[480px] bg-white flex flex-col items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Entrar no sistema</h2>
            <p className="text-gray-500 text-sm mt-1">Use sua conta @gobeaute.com.br</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={signInWithGoogle}
            disabled={loading}
            className="w-full flex items-center justify-between gap-3 bg-white border-2 border-gray-200 hover:border-brand-400 hover:shadow-lg hover:shadow-brand-100 rounded-xl px-5 py-4 text-sm font-medium text-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>{loading ? 'Autenticando...' : 'Continuar com Google'}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-brand-500 transition" />
          </button>

          <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Shield className="w-3.5 h-3.5 text-green-500 shrink-0" />
              <span>Acesso restrito a <strong className="text-gray-700">@gobeaute.com.br</strong></span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1.5">
              <Shield className="w-3.5 h-3.5 text-green-500 shrink-0" />
              <span>Dados criptografados · Audit trail completo</span>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Problemas de acesso? Fale com o administrador do sistema.
          </p>
        </div>
      </div>
    </div>
  )
}
