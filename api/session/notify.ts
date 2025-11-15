import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSession, updateSession } from '../lib/sheets';
import { sendInstructorEmail, sendStudentEmail } from '../lib/gmail';
import type { InstructorEmailVars, StudentEmailVars, Verdict } from '../../src/types';

// Helper to format verdict in Hebrew
function getVerdictHebrew(verdict: Verdict): { text: string; emoji: string } {
  switch (verdict) {
    case 'correct':
      return { text: 'נכון', emoji: '✅' };
    case 'partial':
      return { text: 'חלקי', emoji: '⚠️' };
    case 'wrong':
      return { text: 'שגוי', emoji: '❌' };
    default:
      return { text: 'לא ידוע', emoji: '❓' };
  }
}

// Helper to format dimension score as percentage
function formatDimension(value: number | undefined): string {
  if (value === undefined) return 'N/A';
  return `${Math.round(value * 100)}%`;
}

// Helper to format Hebrew date
function formatHebrewDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Helper to format time
function formatTime(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleTimeString('he-IL', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

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

    if (session.status !== 'completed') {
      return res.status(400).json({
        error: 'Session must be completed before sending notification',
        current_status: session.status
      });
    }

    if (session.email_sent_at) {
      return res.status(400).json({
        error: 'Email already sent',
        sent_at: session.email_sent_at
      });
    }

    const dateHebrew = session.started_at ? formatHebrewDate(session.started_at) : 'לא ידוע';
    const timeStr = session.started_at ? formatTime(session.started_at) : 'לא ידוע';

    // Prepare instructor email variables
    const q1Verdict = getVerdictHebrew(session.q1_verdict || 'wrong');
    const q2Verdict = getVerdictHebrew(session.q2_verdict || 'wrong');
    const q3Verdict = getVerdictHebrew(session.q3_verdict || 'wrong');

    const instructorVars: InstructorEmailVars = {
      first_name: session.first_name,
      last_name: session.last_name,
      id_last4: session.id_last4,
      date_hebrew: dateHebrew,
      duration_minutes: session.duration_minutes || 0,
      video_link: session.video_link || '#',
      dashboard_link: `${process.env.APP_URL || 'https://oral-exam-bot.vercel.app'}/admin/sessions/${session_id}`,

      // Question 1
      q1_id: session.q1_id || 0,
      q1_text: session.q1_text || '',
      q1_transcript: session.q1_transcript || '',
      q1_score: session.q1_score || 0,
      q1_verdict: session.q1_verdict || 'wrong',
      q1_verdict_he: q1Verdict.text,
      q1_verdict_emoji: q1Verdict.emoji,
      q1_accuracy: formatDimension(session.q1_json?.accuracy),
      q1_structure: formatDimension(session.q1_json?.structure),
      q1_terminology: formatDimension(session.q1_json?.terminology),
      q1_logic: formatDimension(session.q1_json?.logic),
      q1_alignment: formatDimension(session.q1_json?.alignment),
      q1_hint_text: session.q1_hint ? 'כן' : 'לא',
      q1_explanation: session.q1_json?.short_explanation_he || '',

      // Question 2
      q2_id: session.q2_id || 0,
      q2_text: session.q2_text || '',
      q2_transcript: session.q2_transcript || '',
      q2_score: session.q2_score || 0,
      q2_verdict: session.q2_verdict || 'wrong',
      q2_verdict_he: q2Verdict.text,
      q2_verdict_emoji: q2Verdict.emoji,
      q2_accuracy: formatDimension(session.q2_json?.accuracy),
      q2_structure: formatDimension(session.q2_json?.structure),
      q2_terminology: formatDimension(session.q2_json?.terminology),
      q2_logic: formatDimension(session.q2_json?.logic),
      q2_alignment: formatDimension(session.q2_json?.alignment),
      q2_hint_text: session.q2_hint ? 'כן' : 'לא',
      q2_explanation: session.q2_json?.short_explanation_he || '',

      // Question 3
      q3_id: session.q3_id || 0,
      q3_text: session.q3_text || '',
      q3_transcript: session.q3_transcript || '',
      q3_score: session.q3_score || 0,
      q3_verdict: session.q3_verdict || 'wrong',
      q3_verdict_he: q3Verdict.text,
      q3_verdict_emoji: q3Verdict.emoji,
      q3_accuracy: formatDimension(session.q3_json?.accuracy),
      q3_structure: formatDimension(session.q3_json?.structure),
      q3_terminology: formatDimension(session.q3_json?.terminology),
      q3_logic: formatDimension(session.q3_json?.logic),
      q3_alignment: formatDimension(session.q3_json?.alignment),
      q3_hint_text: session.q3_hint ? 'כן' : 'לא',
      q3_explanation: session.q3_json?.short_explanation_he || '',

      // Totals
      total_correct: session.total_correct || 0,
      total_score_0_100: session.total_score_0_100 || 0,
    };

    // Send instructor email
    const instructorEmailSent = await sendInstructorEmail(instructorVars);

    if (!instructorEmailSent) {
      throw new Error('Failed to send instructor email');
    }

    // Send student confirmation email (optional, can fail without blocking)
    const studentVars: StudentEmailVars = {
      first_name: session.first_name,
      date_hebrew: dateHebrew,
      time: timeStr,
    };

    try {
      await sendStudentEmail(session.email, studentVars);
    } catch (studentEmailError) {
      console.error('Failed to send student email (non-blocking):', studentEmailError);
    }

    // Update session with email sent timestamp
    const emailSentAt = new Date().toISOString();
    await updateSession(session_id, {
      email_sent_at: emailSentAt,
    });

    return res.status(200).json({
      success: true,
      email_sent_to: process.env.INSTRUCTOR_EMAIL || 'lihi.cyn@gmail.com',
      email_sent_at: emailSentAt,
    });
  } catch (error) {
    console.error('Notification error:', error);
    return res.status(500).json({
      error: 'Failed to send notification',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
