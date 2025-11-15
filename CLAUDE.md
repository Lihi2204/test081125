# 🧠 Oral Exam Bot - Project Context & Specification

## Project Overview
Building an automated Hebrew oral exam system for Ono Academic College:
- 40-50 student pilot
- 3 questions per student, 5-10 min total
- WebRTC video+audio recording → Google Drive
- Whisper transcription → Claude scoring
- Email notifications to instructor only
- Google Sheets as database (NO SQL)

## Tech Stack (LOCKED)
- Frontend: React + Vite + TypeScript + TailwindCSS
- Backend: Vercel Serverless Functions
- Database: Google Sheets
- Storage: Google Drive
- Email: Gmail API
- Transcription: OpenAI Whisper API
- Scoring: Anthropic Claude API (Sonnet 4.5)
- Auth: JWT magic links
- Deployment: Vercel

## 💰 CRITICAL: API COST MANAGEMENT

### YOU MUST ASK LIHI BEFORE ANY PAID API INTEGRATION

**Paid APIs:**
1. Anthropic Claude API (~$0.03/student) - Total: ~$1.50 for 50 students
2. OpenAI Whisper API (~$0.05/student) - Total: ~$2.50 for 50 students

**Free APIs:**
- Google Drive, Sheets, Gmail (within free quotas)

**BEFORE writing code that calls api.anthropic.com or api.openai.com:**
```
🚨 PAID API NEEDED - APPROVAL REQUIRED

I need to implement [feature].
This requires: [API name]
Cost: $X per student
Total for 50 students: $X

Alternatives:
1. [Option A]
2. [Option B]

Do you approve?
```

**You CAN implement without asking:**
✅ Google APIs (Drive, Sheets, Gmail)
✅ Frontend (React, recording, UI)
✅ Vercel Functions
✅ Auth/JWT logic

## Critical Design Decisions

### Email Flow
- Trigger: After automatic scoring completes
- Recipient: ONLY lihi.cyn@gmail.com
- Content: Full question TEXT (not just ID), scores, verdicts, video link
- Student: Separate simple confirmation (no scores)
- Format: Per-student (not batch)

### Data Storage
- Single Google Sheet: `exam_sessions`
- Columns: session_id, student_id_hash, id_last4, first_name, last_name, email, started_at, ended_at, duration_minutes, status, consent, precheck_passed, video_link, q1_id, q1_text, q1_verdict, q1_score, q1_hint, q1_transcript, q1_json, (repeat for q2, q3), total_correct, total_score_0_100, finalized, reviewed_by, notes, email_sent_at, cleaned_at

### Session Resumption
- If student loses connection → can re-enter same session
- Save video chunks progressively
- Continue from last completed question
- Session expires only after slot_end time

### Admin Dashboard
- Auth: Google OAuth (lihi.cyn@gmail.com ONLY)
- Simple table + detail view
- Can edit scores manually
- Finalize button locks scores

### Student UX
- After exam: "✅ תודה! המבחן שלך התקבל. התוצאות יישלחו במייל."
- No scores shown to student
- No dashboard for students

## Priorities (Guide All Decisions)
1. Reliability (5/5) - No data loss, robust errors, retries
2. Scoring Accuracy (5/5) - Claude prompt tuned well
3. Instructor UX (5/5) - Dashboard intuitive, fast review
4. Student UX (4/5) - Clear, simple
5. Speed (3/5) - OK if transcription takes 2-5 min

## Non-Negotiables
- NO SQL database (only Google Sheets)
- NO mobile support (desktop only)
- NO real-time transcription (batch only)
- NO student dashboard
- NO face detection enforcement (nice-to-have)
- Question bank built later (make it generic)

## When to Ask Lihi
- Security/privacy concerns
- UI/UX decisions not covered
- Trade-offs between priorities
- Google Workspace integration points
- Anything affecting pedagogy
- **ANY paid API usage**

## Model
Use Claude Sonnet 4.5 (NOT Opus): "claude-sonnet-4-20250514"

---

# 📋 Technical Specification

[כאן תעתיק את כל האיפיון הטכני המלא שהכנתי - זה ארוך אז אני לא אשכפל אותו פה]

---

**Ready to build? Ask before starting if you have any questions!**
