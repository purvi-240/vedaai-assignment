import { Router } from 'express'
import multer from 'multer'
import {
  extractReferenceText,
  ReferenceExtractError,
} from '../services/reference/extractReferenceText.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
})

export const referenceRouter = Router()

referenceRouter.post('/extract', upload.single('file'), async (req, res) => {
  try {
    const file = req.file
    if (!file) {
      res.status(400).json({ success: false, error: 'No file uploaded' })
      return
    }

    const text = await extractReferenceText(file.buffer, file.mimetype, file.originalname)

    res.json({
      success: true,
      data: {
        text,
        fileName: file.originalname,
        hasText: text.length > 0,
        charCount: text.length,
      },
    })
  } catch (error) {
    if (error instanceof ReferenceExtractError) {
      res.status(400).json({ success: false, error: error.message })
      return
    }

    console.error('Reference extract failed:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to extract reference text',
    })
  }
})
