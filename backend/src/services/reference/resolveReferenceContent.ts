import { extractReferenceText } from './extractReferenceText.js'

export async function resolveReferenceContent(options: {
  referenceContent?: string
  file?: { buffer: Buffer; mimetype: string; originalname: string }
}): Promise<string | undefined> {
  const fromBody = options.referenceContent?.trim()

  if (!options.file) {
    return fromBody || undefined
  }

  const fromFile = await extractReferenceText(
    options.file.buffer,
    options.file.mimetype,
    options.file.originalname,
  )

  if (fromFile.length > 0) {
    return fromFile
  }

  return fromBody || undefined
}
