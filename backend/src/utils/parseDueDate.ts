/** Parse DD-MM-YYYY or ISO date strings */
export function parseDueDate(value: string): Date {
  const dmy = value.match(/^(\d{2})-(\d{2})-(\d{4})$/)
  if (dmy) {
    const [, dd, mm, yyyy] = dmy
    return new Date(Number(yyyy), Number(mm) - 1, Number(dd))
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Invalid due date format')
  }
  return parsed
}
