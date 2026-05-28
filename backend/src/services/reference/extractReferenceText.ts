import { PDFParse } from 'pdf-parse'
import OpenAI from 'openai'
import { env } from '../../config/env.js'

const MAX_REFERENCE_CHARS = 12000
const MAX_PDF_BYTES = 10 * 1024 * 1024
const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const MAX_PDF_PAGES = 15

const openai = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null

export class ReferenceExtractError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ReferenceExtractError'
  }
}

function resolveMimeType(mimeType: string, fileName: string): string {
  const lower = fileName.toLowerCase()
  if (mimeType && mimeType !== 'application/octet-stream') return mimeType
  if (lower.endsWith('.pdf')) return 'application/pdf'
  if (lower.endsWith('.txt') || lower.endsWith('.text')) return 'text/plain'
  if (lower.endsWith('.md')) return 'text/markdown'
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
  if (lower.endsWith('.png')) return 'image/png'
  return mimeType
}

function truncate(text: string): string {
  const normalized = text.trim()
  if (normalized.length <= MAX_REFERENCE_CHARS) return normalized
  const cut = normalized.slice(0, MAX_REFERENCE_CHARS)
  const lastBreak = cut.lastIndexOf('\n')
  return lastBreak > 500 ? cut.slice(0, lastBreak) : cut
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  if (buffer.byteLength > MAX_PDF_BYTES) {
    throw new ReferenceExtractError('PDF must be 10MB or smaller')
  }

  const parser = new PDFParse({ data: new Uint8Array(buffer) })
  try {
      const result = await parser.getText({ first: MAX_PDF_PAGES })
      const normalized = result.text
        .replace(/\r\n/g, '\n')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
      return truncate(normalized)
  } finally {
    await parser.destroy()
  }
}

async function extractImageText(buffer: Buffer, mimeType: string): Promise<string> {
  if (buffer.byteLength > MAX_IMAGE_BYTES) {
    throw new ReferenceExtractError('Image must be 10MB or smaller')
  }

  if (!openai) {
    throw new ReferenceExtractError(
      'Image uploads need OPENAI_API_KEY set on the server to read text from photos.',
    )
  }

  const base64 = buffer.toString('base64')
  const completion = await openai.chat.completions.create({
    model: env.LLM_MODEL,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Extract every question, answer, heading, and instruction from this document image. Return plain text only, preserving numbering where visible.',
          },
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${base64}` },
          },
        ],
      },
    ],
    max_tokens: 2000,
  })

  const content = completion.choices[0]?.message?.content
  if (!content?.trim()) {
    throw new ReferenceExtractError('Could not read text from this image.')
  }

  return truncate(content.replace(/\r\n/g, '\n').trim())
}

export async function extractReferenceText(
  buffer: Buffer,
  mimeType: string,
  fileName: string,
): Promise<string> {
  const resolvedMime = resolveMimeType(mimeType, fileName)
  const lowerName = fileName.toLowerCase()

  if (
    resolvedMime === 'text/plain' ||
    resolvedMime === 'text/markdown' ||
    lowerName.endsWith('.txt') ||
    lowerName.endsWith('.md')
  ) {
    const text = buffer.toString('utf8').trim()
    if (!text) {
      throw new ReferenceExtractError('Text file is empty.')
    }
    return truncate(text)
  }

  if (resolvedMime === 'application/pdf' || lowerName.endsWith('.pdf')) {
    const pdfText = await extractPdfText(buffer)
    if (pdfText.length > 0) {
      return truncate(pdfText)
    }

    throw new ReferenceExtractError(
      'No readable text in this PDF. It may be scanned — try a text-based PDF, upload a clear photo (JPEG/PNG), or paste content in Additional Instructions.',
    )
  }

  if (resolvedMime.startsWith('image/') || /\.(jpe?g|png)$/i.test(lowerName)) {
    const imageMime =
      resolvedMime.startsWith('image/') ? resolvedMime : lowerName.endsWith('.png') ? 'image/png' : 'image/jpeg'
    return truncate(await extractImageText(buffer, imageMime))
  }

  throw new ReferenceExtractError(
    'Unsupported file type. Use PDF, TXT, JPEG, or PNG.',
  )
}
