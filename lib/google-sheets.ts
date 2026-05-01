import { google } from 'googleapis'

export function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets.readonly',
      'https://www.googleapis.com/auth/drive.readonly',
    ],
  })
  return google.sheets({ version: 'v4', auth })
}

// ID da planilha mestre de cadastro de produtos Gobeaute
export const PRODUTOS_SHEET_ID = process.env.GOOGLE_PRODUTOS_SHEET_ID ?? '1Ma2ynNyv0nNzLU58lVq0R9LKwEGbYr2Pkrbq3V5GB94'

export interface SheetRow {
  [key: string]: string | number | null
}

export async function readSheet(spreadsheetId: string, range: string): Promise<SheetRow[]> {
  const sheets = getSheetsClient()
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range })
  const rows = res.data.values ?? []
  if (rows.length < 2) return []

  const headers = rows[0].map((h: string) => String(h).trim())
  return rows.slice(1).map(row =>
    Object.fromEntries(
      headers.map((h, i) => [h, row[i] ?? null])
    )
  )
}

export async function getSheetTabs(spreadsheetId: string): Promise<string[]> {
  const sheets = getSheetsClient()
  const res = await sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties.title' })
  return (res.data.sheets ?? []).map((s: any) => s.properties?.title ?? '')
}
