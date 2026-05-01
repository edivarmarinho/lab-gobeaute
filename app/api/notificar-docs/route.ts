import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getProfile } from '@/lib/supabase/get-profile'

// Chamada manual (admin) ou pelo cron do Vercel via Authorization header
export async function POST(req: Request) {
  const isVercelCron = req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`
  if (!isVercelCron) {
    const profile = await getProfile()
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
  }

  const supabase = createAdminClient()
  const hoje = new Date()
  const em30dias = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const { data: docs } = await supabase
    .from('documentos')
    .select('id, nome, tipo, fornecedor_nome, data_validade')
    .not('data_validade', 'is', null)
    .lte('data_validade', em30dias)
    .order('data_validade', { ascending: true })

  if (!docs || docs.length === 0) {
    return NextResponse.json({ message: 'Nenhum documento vencendo nos próximos 30 dias.' })
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY
  const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL ?? 'edivar@gobeaute.com.br'

  if (!RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY não configurada' }, { status: 500 })
  }

  const linhas = docs.map(d => {
    const diff = Math.ceil((new Date(d.data_validade).getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
    const status = diff < 0 ? '🔴 VENCIDO' : diff <= 7 ? '🟠 Crítico' : '🟡 Atenção'
    return `<tr style="border-bottom:1px solid #f3f4f6">
      <td style="padding:10px 12px;font-weight:500;color:#111">${d.nome}</td>
      <td style="padding:10px 12px;color:#6b7280;font-size:12px">${d.tipo ?? '—'}</td>
      <td style="padding:10px 12px;color:#6b7280;font-size:12px">${d.fornecedor_nome ?? '—'}</td>
      <td style="padding:10px 12px;font-size:12px">${new Date(d.data_validade).toLocaleDateString('pt-BR')}</td>
      <td style="padding:10px 12px;font-size:12px">${status}</td>
    </tr>`
  }).join('')

  const html = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:24px">
  <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)">
    <div style="background:linear-gradient(135deg,#c84b8a,#a8376e);padding:24px 32px">
      <p style="color:rgba(255,255,255,.8);font-size:12px;margin:0 0 4px">Lab Gobeaute P&D</p>
      <h1 style="color:#fff;font-size:20px;font-weight:700;margin:0">Alerta de Documentos Vencendo</h1>
    </div>
    <div style="padding:24px 32px">
      <p style="color:#374151;font-size:14px;margin:0 0 16px">${docs.length} documento${docs.length > 1 ? 's' : ''} vencendo nos próximos 30 dias.</p>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead>
          <tr style="background:#f9fafb;border-bottom:2px solid #e5e7eb">
            <th style="padding:10px 12px;text-align:left;color:#6b7280;font-size:11px;text-transform:uppercase">Documento</th>
            <th style="padding:10px 12px;text-align:left;color:#6b7280;font-size:11px;text-transform:uppercase">Tipo</th>
            <th style="padding:10px 12px;text-align:left;color:#6b7280;font-size:11px;text-transform:uppercase">Fornecedor</th>
            <th style="padding:10px 12px;text-align:left;color:#6b7280;font-size:11px;text-transform:uppercase">Validade</th>
            <th style="padding:10px 12px;text-align:left;color:#6b7280;font-size:11px;text-transform:uppercase">Status</th>
          </tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
      <div style="margin-top:24px;padding:16px;background:#fdf2f8;border-radius:8px;border-left:4px solid #c84b8a">
        <p style="color:#374151;font-size:13px;margin:0">
          Acesse o <a href="https://lab-gobeaute.vercel.app/dashboard/documentos" style="color:#c84b8a;font-weight:600">Lab Gobeaute</a> para revisar.
        </p>
      </div>
    </div>
    <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb">
      <p style="color:#9ca3af;font-size:11px;margin:0">Lab Gobeaute P&D · Gogroup · Enviado automaticamente</p>
    </div>
  </div>
</body></html>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Lab Gobeaute P&D <noreply@gobeaute.com.br>',
      to: [NOTIFY_EMAIL],
      subject: `🔔 ${docs.length} documento${docs.length > 1 ? 's' : ''} vencendo — Lab Gobeaute`,
      html,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: `Resend: ${err}` }, { status: 500 })
  }

  return NextResponse.json({ sent: true, docs: docs.length })
}
