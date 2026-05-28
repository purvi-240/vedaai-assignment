/**
 * Pull question-like strings from extracted PDF/text for mock generation
 * and as fallback context when the LLM is unavailable.
 */
export function extractQuestionSeeds(reference: string): string[] {
  const text = reference.replace(/\r\n/g, '\n').trim()
  if (!text) return []

  const seeds: string[] = []
  const seen = new Set<string>()

  const addSeed = (raw: string) => {
    const cleaned = raw
      .replace(/^\s*(?:\d+|[ivxlc]+)[\.\):\-]\s*/i, '')
      .replace(/^\s*(?:Q|Question)\s*\d+[\.\):\-]\s*/i, '')
      .replace(/\s+/g, ' ')
      .trim()

    if (cleaned.length < 12) return
    const key = cleaned.toLowerCase().slice(0, 120)
    if (seen.has(key)) return
    seen.add(key)
    seeds.push(cleaned.slice(0, 600))
  }

  const numberedBlocks = text.split(/(?=\n\s*(?:\d+|[ivxlc]+)[\.\)]\s+)|(?=\s(?:\d+|[ivxlc]+)[\.\)]\s+)/gi)
  for (const block of numberedBlocks) {
    addSeed(block)
  }

  if (seeds.length < 3) {
    for (const line of text.split('\n')) {
      addSeed(line)
    }
  }

  if (seeds.length < 3) {
    const sentences = text.split(/(?<=[?.!])\s+/)
    for (const sentence of sentences) {
      addSeed(sentence)
    }
  }

  if (seeds.length === 0 && text.length > 0) {
    for (let i = 0; i < text.length; i += 220) {
      addSeed(text.slice(i, i + 220))
    }
  }

  return seeds.slice(0, 80)
}
