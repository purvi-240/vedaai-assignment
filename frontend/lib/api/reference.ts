const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

interface ExtractReferenceResponse {
  success: boolean
  data?: {
    text: string
    fileName: string
    hasText: boolean
    charCount?: number
  }
  error?: string
}

function isImageFile(file: File): boolean {
  return (
    file.type.startsWith('image/') ||
    /\.(jpe?g|png)$/i.test(file.name)
  )
}

export async function extractReferenceFromFile(file: File): Promise<string> {
  if (file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')) {
    const text = await file.text()
    const trimmed = text.trim()
    if (!trimmed) {
      throw new Error('Text file is empty.')
    }
    return trimmed.slice(0, 12000)
  }

  const formData = new FormData()
  formData.append('file', file, file.name)

  const response = await fetch(`${API_BASE}/api/reference/extract`, {
    method: 'POST',
    body: formData,
  })

  const body = (await response.json()) as ExtractReferenceResponse

  if (!response.ok || !body.success) {
    const message =
      body.error ??
      (isImageFile(file)
        ? 'Could not read this image. Set OPENAI_API_KEY on the backend for photo uploads.'
        : 'Failed to read reference file')
    throw new Error(message)
  }

  const text = body.data?.text?.trim() ?? ''
  if (!text) {
    throw new Error(
      isImageFile(file)
        ? 'No text found in this image. Use a clearer photo or a text-based PDF.'
        : 'No readable text found in this file. Try a text PDF or paste content in Additional Instructions.',
    )
  }

  return text
}
