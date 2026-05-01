import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const NOTIFY_EMAIL = Deno.env.get('NOTIFY_EMAIL') ?? 'edivar@gobeaute.com.br'

Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  const hoje = new Date()
  const em30dias = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const { data: docs, error } = await supabase
    .from('documentos')
    .select('id, nome, tipo, fornecedor_nome, data_validade')
    .not('data_validade', 'is', null)
    .lte('data_validade', em30dias)
    .order('data_validade', { ascending: true })

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  if (!docs || docs.length === 0) {
    return new Response(JSON.stringify({ message: 'Nenhum documento vencendo nos próximos 30 dias.' }), { status: 200 })
  }

  const vencidos = docs.filter(d => new Date(d.data_validade) < hoje)
  const vencendo = docs.filter(d => new Date(d.data_validade) >= hoje)

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

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:24px">
  <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)">
    <div style="background:linear-gradient(135deg,#c84b8a,#a8376e);padding:24px 32px">
      <p style="color:rgba(255,255,255,.8);font-size:12px;margin:0 0 4px">Lab Gobeaute P&D</p>
      <h1 style="color:#fff;font-size:20px;font-weight:700;margin:0">Alerta de Documentos Vencendo</h1>
    </div>
    <div style="padding:24px 32px">
      <p style="color:#374151;font-size:14px;margin:0 0 16px">
        ${vencidos.length > 0 ? `<strong>${vencidos.length} documento${vencidos.length > 1 ? 's' : ''} já vencido${vencidos.length > 1 ? 's' : ''}</strong> e ` : ''}
        ${vencendo.length} documento${vencendo.length !== 1 ? 's' : ''} vencendo nos próximos 30 dias.
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead>
          <tr style="background:#f9fafb;border-bottom:2px solid #e5e7eb">
            <th style="padding:10px 12px;text-align:left;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:.05em">Documento</th>
            <th style="padding:10px 12px;text-align:left;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:.05em">Tipo</th>
            <th style="padding:10px 12px;text-align:left;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:.05em">Fornecedor</th>
            <th style="padding:10px 12px;text-align:left;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:.05em">Validade</th>
            <th style="padding:10px 12px;text-align:left;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:.05em">Status</th>
          </tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
      <div style="margin-top:24px;padding:16px;background:#fdf2f8;border-radius:8px;border-left:4px solid #c84b8a">
        <p style="color:#374151;font-size:13px;margin:0">
          Acesse o <a href="https://lab-gobeaute.vercel.app/dashboard/documentos" style="color:#c84b8a;font-weight:600">Lab Gobeaute</a> para revisar e atualizar os documentos.
        </p>
      </div>
    </div>
    <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb">
      <p style="color:#9ca3af;font-size:11px;margin:0">Lab Gobeaute P&D · Gogroup · Enviado automaticamente</p>
    </div>
  </div>
</body>
</html>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Lab Gobeaute P&D <noreply@gobeaute.com.br>',
      to: [NOTIFY_EMAIL],
      subject: `🔔 ${docs.length} documento${docs.length > 1 ? 's' : ''} vencendo — Lab Gobeaute`,
      html,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    return new Response(JSON.stringify({ error: `Resend: ${err}` }), { status: 500 })
  }

  return new Response(JSON.stringify({ sent: true, docs: docs.length }), { status: 200 })
})
