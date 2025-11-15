import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSession, updateSession, getQuestion } from '../lib/sheets';
import { scoreAnswer } from '../lib/claude';
import type { ScoringResult, Verdict } from '../../src/types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { session_id } = req.body;

  if (!session_id) {
    return res.status(400).json({ error: 'Missing session_id' });
  }

  try {
    // Get session
    const session = await getSession(session_id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.status !== 'transcribing') {
      return res.status(400).json({
        error: 'Session must be in transcribing status',
        current_status: session.status
      });
    }

    // Verify we have transcripts
    if (!session.q1_transcript || !session.q2_transcript || !session.q3_transcript) {
      return res.status(400).json({ error: 'Missing transcripts for scoring' });
    }

    // Update status to scoring
    await updateSession(session_id, {
      status: 'scoring',
    });

    // Get questions from question bank for sample answers
    const questions = await Promise.all([
      session.q1_id ? getQuestion(session.q1_id) : null,
      session.q2_id ? getQuestion(session.q2_id) : null,
      session.q3_id ? getQuestion(session.q3_id) : null,
    ]);

    // Score each answer
    const scores: Record<string, ScoringResult> = {};
    const updates: Record<string, unknown> = {};

    // Question 1
    if (session.q1_id && session.q1_text && session.q1_transcript) {
      const sampleAnswer = questions[0]?.sample_answer || '';
      const result = await scoreAnswer(session.q1_text, sampleAnswer, session.q1_transcript);
      scores.q1 = result;
      updates.q1_score = result.per_question_score_0_100;
      updates.q1_verdict = result.verdict;
      updates.q1_json = result;
    }

    // Question 2
    if (session.q2_id && session.q2_text && session.q2_transcript) {
      const sampleAnswer = questions[1]?.sample_answer || '';
      const result = await scoreAnswer(session.q2_text, sampleAnswer, session.q2_transcript);
      scores.q2 = result;
      updates.q2_score = result.per_question_score_0_100;
      updates.q2_verdict = result.verdict;
      updates.q2_json = result;
    }

    // Question 3
    if (session.q3_id && session.q3_text && session.q3_transcript) {
      const sampleAnswer = questions[2]?.sample_answer || '';
      const result = await scoreAnswer(session.q3_text, sampleAnswer, session.q3_transcript);
      scores.q3 = result;
      updates.q3_score = result.per_question_score_0_100;
      updates.q3_verdict = result.verdict;
      updates.q3_json = result;
    }

    // Calculate totals
    const allScores = [scores.q1, scores.q2, scores.q3].filter(Boolean);
    const totalCorrect = allScores.filter(s => s.verdict === 'correct').length;
    const totalScore = allScores.length > 0
      ? Math.round(allScores.reduce((sum, s) => sum + s.per_question_score_0_100, 0) / allScores.length)
      : 0;

    updates.total_correct = totalCorrect;
    updates.total_score_0_100 = totalScore;
    updates.status = 'completed';

    // Update session with scores
    await updateSession(session_id, updates);

    return res.status(200).json({
      success: true,
      scores: {
        q1: scores.q1 || null,
        q2: scores.q2 || null,
        q3: scores.q3 || null,
      },
      total_correct: totalCorrect,
      total_score_0_100: totalScore,
      status: 'completed',
    });
  } catch (error) {
    console.error('Scoring error:', error);
    // Revert status on error
    await updateSession(session_id, { status: 'transcribing' });
    return res.status(500).json({
      error: 'Scoring failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
