# 🎓 Oral Exam Bot - Automated Hebrew Oral Examination System

An automated oral exam system for Ono Academic College, featuring browser-based video recording, AI-powered transcription (Whisper), and automated scoring (Claude).

## Features

- **Student Portal**: Magic link authentication, consent flow, camera/mic pre-check, timed exam questions
- **Video Recording**: WebRTC-based recording with automatic upload to Google Drive
- **AI Processing**: Whisper for transcription, Claude for scoring and feedback
- **Instructor Dashboard**: Google OAuth login, session review, score editing, finalization
- **Email Notifications**: Automatic notifications to instructor with full transcripts and scores
- **Data Management**: Google Sheets as database, automatic cleanup after 14 days

## Tech Stack

- **Frontend**: React 18 + Vite + TypeScript + TailwindCSS
- **Backend**: Vercel Serverless Functions
- **Database**: Google Sheets API
- **Storage**: Google Drive API
- **Email**: Gmail API
- **Transcription**: OpenAI Whisper API
- **Scoring**: Anthropic Claude API (Sonnet 4.5)
- **Authentication**: JWT magic links

## Project Structure

```
oral-exam-bot/
├── src/                    # Frontend React application
│   ├── pages/              # Page components (exam flow, admin dashboard)
│   ├── components/         # Reusable UI components
│   ├── store/              # Zustand state management
│   ├── types/              # TypeScript type definitions
│   └── hooks/              # Custom React hooks
├── api/                    # Vercel serverless functions
│   ├── auth/               # Authentication endpoints
│   ├── session/            # Exam session management
│   ├── upload/             # Video upload handling
│   ├── admin/              # Admin dashboard API
│   └── lib/                # Shared utilities (Sheets, Drive, Gmail wrappers)
├── scripts/                # Utility scripts (magic link generator)
└── public/                 # Static assets
```

## Quick Start

### Prerequisites

- Node.js 18+
- Google Cloud Project with APIs enabled (Drive, Sheets, Gmail)
- OpenAI API key (for Whisper)
- Anthropic API key (for Claude)
- Vercel account

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd oral-exam-bot

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

### Environment Setup

1. Create a Google Cloud Project
2. Enable Google Drive, Sheets, and Gmail APIs
3. Create a Service Account and download JSON key
4. Base64 encode the key: `base64 -i service-account.json`
5. Create Google Sheets for:
   - `roster` - Student enrollment
   - `exam_sessions` - Session data
   - `questions_bank` - Question repository
6. Create Google Drive folder for video storage
7. Share sheets and folder with Service Account email
8. Fill in `.env` file with all credentials

### Google Sheets Structure

**roster (student enrollment)**
- student_id_hash, id_last4, first_name, last_name, email, slot_start, slot_end, token, attempt_status

**exam_sessions (exam data)**
- session_id, student info, timestamps, consent, video_link, q1-q3 data (id, text, transcript, verdict, score, hint), totals, finalized, notes

**questions_bank (question repository)**
- id, question_text, sample_answer, difficulty, topic

### Generating Magic Links

```bash
# Edit the student list in scripts/generate-magic-links.ts
npx ts-node scripts/generate-magic-links.ts
```

## Student Exam Flow

1. **Magic Link Entry** → JWT validation
2. **Consent Screen** → Accept terms and conditions
3. **Pre-Check** → Camera and microphone test
4. **Buffer Room** → 3-minute preparation countdown
5. **Exam** → 3 questions, 90 seconds each, hint available
6. **Upload** → Video uploaded to Google Drive
7. **Completion** → Thank you message

## Admin Dashboard

1. **Login** → Google OAuth (whitelisted emails only)
2. **Dashboard** → View all sessions, filter by status
3. **Session Detail** → Watch video, view transcripts, edit scores
4. **Finalize** → Lock scores permanently

## Deployment

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### Environment Variables (Vercel)

Set these in your Vercel project settings:
- `JWT_SECRET`
- `GOOGLE_SERVICE_ACCOUNT_KEY` (base64)
- `SESSIONS_SHEET_ID`
- `ROSTER_SHEET_ID`
- `QUESTIONS_SHEET_ID`
- `DRIVE_FOLDER_ID`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `INSTRUCTOR_EMAIL`
- `NEXT_PUBLIC_APP_URL`

## Security

- Student IDs are SHA256 hashed
- Only last 4 digits stored
- Videos are private (restricted to instructor)
- JWT tokens expire in 7 days
- Admin access restricted to whitelisted emails
- Automatic video cleanup after 14 days

## API Endpoints

### Student APIs
- `POST /api/auth/verify` - Validate magic link token
- `POST /api/session/create` - Create exam session
- `POST /api/session/start` - Start exam recording
- `POST /api/upload/chunk` - Upload video chunk
- `POST /api/upload/finalize` - Complete upload

### Admin APIs
- `GET /api/admin/sessions` - List all sessions
- `GET /api/admin/session/:id` - Get session details
- `PATCH /api/admin/session/:id` - Update scores
- `POST /api/admin/session/:id/finalize` - Lock scores

### Cron Jobs
- `GET /api/cron/cleanup` - Delete old videos (daily at 3 AM)

## Cost Estimates

For 50 students:
- OpenAI Whisper: ~$2.50 total
- Anthropic Claude: ~$1.50 total
- Google APIs: Free within quotas

## Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Support

For questions or issues, contact: lihi.cyn@gmail.com

## License

Proprietary - Ono Academic College

---

Built with Claude Code for Ono Academic College's "Applied AI in Business" course.
