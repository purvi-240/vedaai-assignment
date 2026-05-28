import {
  inputToStructuredPrompt,
  type PromptInput,
  type StructuredPrompt,
  type StructuredPromptSection,
} from './inputToStructuredPrompt.js'

export function buildReferenceToPaperPrompt(
  referenceMaterial: string,
  additionalInstructions: string,
  input?: PromptInput,
): string {
  const structured = input ? inputToStructuredPrompt(input) : null
  const sectionRules = structured
    ? `
Assignment configuration (MUST follow exactly):
${structured.sections
  .map(
    (s) =>
      `- Section ${s.label}: ${s.title}, type ${s.questionType}, exactly ${s.count} questions, ${s.marksPerQuestion} marks each`,
  )
  .join('\n')}
- Total questions: ${structured.totalQuestions}
- Total marks: ${structured.totalMarks} (must match sum of all question marks)
`
    : ''

  return `Convert this teacher reference document into a question paper JSON.

Use question wording from the reference document. Follow the assignment configuration for section counts and marks.
Do NOT replace them with placeholder "Sample" questions.
${sectionRules}
Additional instructions: ${additionalInstructions || 'None'}

Reference document:
${referenceMaterial.slice(0, 12000)}

Respond with ONLY valid JSON:
{
  "title": "string",
  "schoolName": "string",
  "subject": "string",
  "classLabel": "string",
  "timeAllowed": "string",
  "sections": [
    {
      "label": "A",
      "title": "Short Answer Questions",
      "questions": [
        {
          "id": "A1",
          "type": "short_answer",
          "question": "string",
          "difficulty": "easy|medium|hard",
          "marks": number,
          "correctAnswer": "string"
        }
      ]
    }
  ],
  "totalMarks": number
}

Rules:
- Preserve section labels (A, B, C) and titles from the document
- Keep each question wording as in the source
- Map [Easy]->easy, [Moderate]->medium, [Challenging]->hard
- Include full answer key text in correctAnswer for each question
- totalMarks = sum of all question marks`
}

export function buildSectionGenerationPrompt(
  prompt: StructuredPrompt,
  section: StructuredPromptSection,
): string {
  const referenceBlock = prompt.referenceMaterial
    ? `\nReference material from the teacher's uploaded document — base questions, topics, and wording on this:\n${prompt.referenceMaterial}\n`
    : ''

  const referencePriority = prompt.referenceMaterial
    ? `
IMPORTANT: The teacher uploaded a document. You MUST base questions on the reference material below.
- Reuse or closely adapt actual questions/topics from the reference (do not invent unrelated "Sample" questions).
- Match subject matter and difficulty from the source where possible.
`
    : ''

  return `You are an expert educational assessment creator.

Generate ONLY Section ${section.label} of a question paper as valid JSON. No markdown or explanations.
${referencePriority}
Assignment due date: ${prompt.dueDate}
Additional instructions: ${prompt.additionalInstructions || 'None'}
${referenceBlock}

Section ${section.label} requirements:
- Title: ${section.title}
- Question type: ${section.questionType}
- Number of questions: ${section.count} (generate exactly this many)
- Marks per question: ${section.marksPerQuestion}
- Section total marks: ${section.totalSectionMarks}

Respond with ONLY this JSON shape:
{
  "label": "${section.label}",
  "title": "${section.title}",
  "questions": [
    {
      "id": "${section.label}1",
      "type": "${section.questionType}",
      "question": "string",
      "difficulty": "easy|medium|hard",
      "marks": ${section.marksPerQuestion},
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "string"
    }
  ]
}

Rules:
- Generate exactly ${section.count} questions
- Each question must use marks: ${section.marksPerQuestion}
- Question ids: ${section.label}1, ${section.label}2, ... unique within section
- MCQ: 4 options + correctAnswer matching one option
- true_false: correctAnswer "True" or "False"
- short_answer, long_answer, fill_in_blank, diagram, numerical: omit options; include correctAnswer as a complete model answer (1-3 sentences)
- Every question MUST include correctAnswer
- If reference material is provided, align questions with its topics and style (do not ignore it)
- Distribute easy, medium, hard across the section`
}

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
