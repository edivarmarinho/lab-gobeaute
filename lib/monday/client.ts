// Cliente server-side da Monday API v2.
// Token nunca vai pro client — sempre proxy via /api/monday/*.

const ENDPOINT = 'https://api.monday.com/v2'

// Boards de marca conhecidos. Quando o vínculo for feito, gravamos
// monday_board_id direto na fórmula — esse mapa é só fallback/UX.
export const BOARD_BY_MARCA: Record<string, string> = {
  'Apice': '18397194546',
  'Barbours': '18384262695',
  'By Samia': '18399523892',
  'Kokeshi': '9829941868',
  'Lescent': '18301165693',
  'Yenzah': '',
  'Rituaria': '',
  'Aua Natural': '10083315942',
}

export type MondayProject = {
  id: string
  name: string
  url: string
  etapa: string | null
  status: string | null
  categoria: string | null
  data_lancamento: string | null
  mes_lancamento: string | null
}

async function gql<T>(query: string, variables?: Record<string, any>): Promise<T> {
  const token = process.env.MONDAY_API_TOKEN
  if (!token) throw new Error('MONDAY_API_TOKEN não configurado')

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': token,
      'Content-Type': 'application/json',
      'API-Version': '2024-01',
    },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Monday API ${res.status}`)
  const json = await res.json()
  if (json.errors) throw new Error(json.errors[0]?.message ?? 'Monday error')
  return json.data as T
}

// Lista projetos em "Validação de fórmula" do board da marca.
export async function listProjetosEmFormulacao(boardId: string): Promise<MondayProject[]> {
  const data = await gql<{ boards: any[] }>(`
    query ($boardId: ID!) {
      boards(ids: [$boardId]) {
        items_page(limit: 200) {
          items {
            id
            name
            url
            column_values(ids: ["color_mkt2mbqb", "project_status", "color_mkt32eb7", "date_mkt3144r", "color_mm0gcp3k"]) {
              id
              text
            }
          }
        }
      }
    }
  `, { boardId })

  const items = data.boards?.[0]?.items_page?.items ?? []
  return items
    .map((it: any): MondayProject => {
      const cv = Object.fromEntries(it.column_values.map((c: any) => [c.id, c.text]))
      return {
        id: it.id,
        name: it.name,
        url: it.url,
        etapa: cv['color_mkt2mbqb'] || null,
        status: cv['project_status'] || null,
        categoria: cv['color_mkt32eb7'] || null,
        data_lancamento: cv['date_mkt3144r'] || null,
        mes_lancamento: cv['color_mm0gcp3k'] || null,
      }
    })
    .filter((p: MondayProject) => p.etapa === 'Validação de formula')
}

export async function getProjetoById(itemId: string): Promise<MondayProject | null> {
  const data = await gql<{ items: any[] }>(`
    query ($id: ID!) {
      items(ids: [$id]) {
        id
        name
        url
        board { id name }
        column_values(ids: ["color_mkt2mbqb", "project_status", "color_mkt32eb7", "date_mkt3144r", "color_mm0gcp3k"]) {
          id
          text
        }
      }
    }
  `, { id: itemId })

  const it = data.items?.[0]
  if (!it) return null
  const cv = Object.fromEntries(it.column_values.map((c: any) => [c.id, c.text]))
  return {
    id: it.id,
    name: it.name,
    url: it.url,
    etapa: cv['color_mkt2mbqb'] || null,
    status: cv['project_status'] || null,
    categoria: cv['color_mkt32eb7'] || null,
    data_lancamento: cv['date_mkt3144r'] || null,
    mes_lancamento: cv['color_mm0gcp3k'] || null,
  }
}

// Posta um update (comentário) no item Monday — usado quando fórmula é aprovada/locked.
export async function postUpdate(itemId: string, body: string): Promise<void> {
  await gql(`
    mutation ($itemId: ID!, $body: String!) {
      create_update(item_id: $itemId, body: $body) { id }
    }
  `, { itemId, body })
}
