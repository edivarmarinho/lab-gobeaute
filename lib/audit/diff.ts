// Helper: diff entre dois objetos. Retorna { campo: { before, after } } só pros campos que mudaram.
// Mascara campos sensíveis e ignora ruído (timestamps automáticos, ids).

const SENSITIVE_FIELDS = new Set([
  'password', 'senha', 'secret', 'token', 'api_key', 'private_key',
  'service_role', 'access_token', 'refresh_token',
])

const IGNORE_FIELDS = new Set([
  'created_at', 'updated_at', 'id', 'token_version',
])

const MASK = '••••••'

function isSensitive(key: string): boolean {
  const lower = key.toLowerCase()
  for (const k of SENSITIVE_FIELDS) if (lower.includes(k)) return true
  return false
}

function normalize(v: unknown): unknown {
  if (v === undefined) return null
  if (Array.isArray(v)) return [...v].sort()
  return v
}

function equal(a: unknown, b: unknown): boolean {
  return JSON.stringify(normalize(a)) === JSON.stringify(normalize(b))
}

export type DiffEntry = { before: unknown; after: unknown }
export type Diff = Record<string, DiffEntry>

export function generateDiff(
  before: Record<string, any> | null | undefined,
  after: Record<string, any> | null | undefined
): Diff {
  const diff: Diff = {}
  const b = before ?? {}
  const a = after ?? {}
  const keys = new Set([...Object.keys(b), ...Object.keys(a)])

  for (const key of keys) {
    if (IGNORE_FIELDS.has(key)) continue
    if (equal(b[key], a[key])) continue
    diff[key] = {
      before: isSensitive(key) ? (b[key] != null ? MASK : null) : b[key] ?? null,
      after:  isSensitive(key) ? (a[key] != null ? MASK : null) : a[key] ?? null,
    }
  }
  return diff
}

export function hasDiff(diff: Diff): boolean {
  return Object.keys(diff).length > 0
}
