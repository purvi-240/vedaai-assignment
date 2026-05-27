import type { StructuredPrompt } from './inputToStructuredPrompt.js'

export function buildQuestionGenerationPrompt(prompt: StructuredPrompt): string {
  const sectionSpecs = prompt.sections
    .map(
      (section) =>
        `Section ${section.label} — ${section.title}
  - Question type: ${section.questionType}
  - Number of questions: ${section.count}
  - Marks per question: ${section.marksPerQuestion}
  - Section total marks: ${section.totalSectionMarks}`,
    )
    .join('\n\n')

  const referenceBlock = prompt.referenceMaterial
    ? `\nReference material:\n${prompt.referenceMaterial}\n`
    : ''

  return `You are an expert educational assessment creator.

Generate a question paper as valid JSON only. Do not include markdown or explanations.

Assignment due date: ${prompt.dueDate}
Total questions required: ${prompt.totalQuestions}
Total marks required: ${prompt.totalMarks}

Additional instructions: ${prompt.additionalInstructions || 'None'}
${referenceBlock}

Section requirements:
${sectionSpecs}

Respond with ONLY a JSON object in this exact shape:
{
  "title": "string",
  "sections": [
    {
      "label": "A",
      "title": "string",
      "questions": [
        {
          "id": "A1",
          "type": "mcq|true_false|short_answer|long_answer|fill_in_blank|diagram|numerical",
          "question": "string",
          "difficulty": "easy|medium|hard",
          "marks": number,
          "options": ["A", "B", "C", "D"],
          "correctAnswer": "string"
        }
      ]
    }
  ],
  "totalMarks": number
}

Rules:
- Create one section per requirement above, using the exact section labels (A, B, C, ...)
- Generate exactly the requested number of questions per section
- Each question must include difficulty: easy, medium, or hard
- Each question must use the exact marks specified for its section
- MCQ must have 4 options and correctAnswer matching one option
- true_false correctAnswer must be "True" or "False"
- short_answer, long_answer, fill_in_blank may omit options
- Question ids must be unique and prefixed with section label (e.g. A1, A2, B1)
- totalMarks must equal the sum of all question marks
- Distribute difficulty levels appropriately across each section`
}
