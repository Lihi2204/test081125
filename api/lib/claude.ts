import Anthropic from '@anthropic-ai/sdk';
import type { ScoringResult, Verdict } from '../../src/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SCORING_PROMPT = `You are grading a Hebrew oral exam answer for an academic course on AI Applications in Business.

Question: {question}

Expected Answer (for reference): {sample_answer}

Student's Answer (transcribed): {student_answer}

Grade on a scale of 0-100 based on these 5 dimensions:

1. **Accuracy** (0-1): Is the answer factually correct?
2. **Structure** (0-1): Is the answer well-organized and logical?
3. **Terminology** (0-1): Does the student use correct technical terms?
4. **Logic** (0-1): Is the reasoning sound and coherent?
5. **Alignment** (0-1): Does the answer address the question directly?

Based on the overall score:
- 80-100: verdict = "correct"
- 50-79: verdict = "partial"
- 0-49: verdict = "wrong"

Return ONLY valid JSON in this exact format (no markdown, no explanation outside JSON):
{
  "accuracy": 0.85,
  "structure": 0.75,
  "terminology": 0.90,
  "logic": 0.80,
  "alignment": 0.95,
  "per_question_score_0_100": 85,
  "verdict": "correct",
  "short_explanation_he": "תשובה מצוינת. הסטודנט הראה הבנה טובה של הנושא והשתמש במונחים נכונים."
}`;

export async function scoreAnswer(
  question: string,
  sampleAnswer: string,
  studentAnswer: string
): Promise<ScoringResult> {
  const prompt = SCORING_PROMPT.replace('{question}', question)
    .replace('{sample_answer}', sampleAnswer)
    .replace('{student_answer}', studentAnswer);

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  // Extract text content from response
  const textContent = message.content.find((block) => block.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text content in Claude response');
  }

  // Parse JSON response
  let result: ScoringResult;
  try {
    result = JSON.parse(textContent.text);
  } catch (parseError) {
    // Try to extract JSON from response if it contains extra text
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      result = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('Failed to parse Claude response as JSON');
    }
  }

  // Validate result structure
  if (
    typeof result.accuracy !== 'number' ||
    typeof result.structure !== 'number' ||
    typeof result.terminology !== 'number' ||
    typeof result.logic !== 'number' ||
    typeof result.alignment !== 'number' ||
    typeof result.per_question_score_0_100 !== 'number' ||
    !['correct', 'partial', 'wrong'].includes(result.verdict) ||
    typeof result.short_explanation_he !== 'string'
  ) {
    throw new Error('Invalid scoring result structure');
  }

  return result;
}

// Score multiple answers
export async function scoreMultipleAnswers(
  answers: Array<{
    questionId: number;
    questionText: string;
    sampleAnswer: string;
    transcript: string;
  }>
): Promise<Map<number, ScoringResult>> {
  const results = new Map<number, ScoringResult>();

  for (const answer of answers) {
    try {
      const result = await scoreAnswer(answer.questionText, answer.sampleAnswer, answer.transcript);
      results.set(answer.questionId, result);
    } catch (error) {
      console.error(`Failed to score question ${answer.questionId}:`, error);
      // Return a default low score on error
      results.set(answer.questionId, {
        accuracy: 0,
        structure: 0,
        terminology: 0,
        logic: 0,
        alignment: 0,
        per_question_score_0_100: 0,
        verdict: 'wrong' as Verdict,
        short_explanation_he: 'שגיאה בניקוד אוטומטי - נדרשת סקירה ידנית',
      });
    }
  }

  return results;
}
