export function parseNum(raw: string): number {
  const cleaned = raw.replace(/,/g, '').trim()
  if (cleaned === '' || cleaned === '.') return 0
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : 0
}
