import { google } from 'googleapis';
import type { InstructorEmailVars, StudentEmailVars } from '../../src/types';

// Initialize Gmail client
function getGoogleAuth() {
  const credentials = JSON.parse(
    Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '', 'base64').toString()
  );

  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/gmail.send'],
  });
}

function getGmail() {
  const auth = getGoogleAuth();
  return google.gmail({ version: 'v1', auth });
}

const INSTRUCTOR_EMAIL = process.env.INSTRUCTOR_EMAIL || 'lihi.cyn@gmail.com';

// Helper to create email message
function createMessage(to: string, subject: string, htmlBody: string): string {
  const messageParts = [
    `From: "מערכת מבחנים בעל-פה" <${INSTRUCTOR_EMAIL}>`,
    `To: ${to}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: =?utf-8?B?${Buffer.from(subject).toString('base64')}?=`,
    '',
    htmlBody,
  ];

  const message = messageParts.join('\n');
  return Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Send instructor notification email
export async function sendInstructorEmail(vars: InstructorEmailVars): Promise<boolean> {
  const gmail = getGmail();

  const subject = `✅ מבחן הושלם - ${vars.first_name} ${vars.last_name} (${vars.id_last4})`;

  const htmlBody = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; direction: rtl; }
        .container { max-width: 700px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; }
        .header { background: #4CAF50; color: white; padding: 15px; text-align: center; }
        .section { margin: 20px 0; padding: 15px; background: #f9f9f9; }
        .question { border-right: 4px solid #2196F3; padding-right: 10px; margin: 15px 0; }
        .score { font-size: 1.3em; font-weight: bold; }
        .verdict-correct { color: #4CAF50; }
        .verdict-partial { color: #FF9800; }
        .verdict-wrong { color: #F44336; }
        .dimensions { font-size: 0.9em; color: #666; }
        .button { display: inline-block; padding: 12px 24px; background: #2196F3; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>✅ מבחן בעל-פה הושלם</h2>
        </div>

        <div class="section">
            <h3>פרטי סטודנט</h3>
            <p><strong>שם:</strong> ${vars.first_name} ${vars.last_name}</p>
            <p><strong>ת"ז:</strong> ****${vars.id_last4}</p>
            <p><strong>תאריך:</strong> ${vars.date_hebrew}</p>
            <p><strong>משך מבחן:</strong> ${vars.duration_minutes} דקות</p>
        </div>

        <div class="section">
            <h3>📊 תוצאות אוטומטיות</h3>

            <div class="question">
                <h4>שאלה 1 (מזהה: ${vars.q1_id})</h4>
                <p><strong>שאלה:</strong> ${vars.q1_text}</p>
                <p><strong>תמלול תשובת הסטודנט:</strong></p>
                <p style="background: #fff; padding: 10px; border-radius: 5px;">${vars.q1_transcript}</p>
                <p class="score ${vars.q1_verdict === 'correct' ? 'verdict-correct' : vars.q1_verdict === 'partial' ? 'verdict-partial' : 'verdict-wrong'}">
                    ${vars.q1_verdict_emoji} ${vars.q1_verdict_he} (${vars.q1_score}/100)
                </p>
                <p class="dimensions">דיוק: ${vars.q1_accuracy} | מבנה: ${vars.q1_structure} | מינוח: ${vars.q1_terminology} | לוגיקה: ${vars.q1_logic} | התאמה: ${vars.q1_alignment}</p>
                <p><strong>רמז:</strong> ${vars.q1_hint_text}</p>
                <p><em>${vars.q1_explanation}</em></p>
            </div>

            <div class="question">
                <h4>שאלה 2 (מזהה: ${vars.q2_id})</h4>
                <p><strong>שאלה:</strong> ${vars.q2_text}</p>
                <p><strong>תמלול תשובת הסטודנט:</strong></p>
                <p style="background: #fff; padding: 10px; border-radius: 5px;">${vars.q2_transcript}</p>
                <p class="score ${vars.q2_verdict === 'correct' ? 'verdict-correct' : vars.q2_verdict === 'partial' ? 'verdict-partial' : 'verdict-wrong'}">
                    ${vars.q2_verdict_emoji} ${vars.q2_verdict_he} (${vars.q2_score}/100)
                </p>
                <p class="dimensions">דיוק: ${vars.q2_accuracy} | מבנה: ${vars.q2_structure} | מינוח: ${vars.q2_terminology} | לוגיקה: ${vars.q2_logic} | התאמה: ${vars.q2_alignment}</p>
                <p><strong>רמז:</strong> ${vars.q2_hint_text}</p>
                <p><em>${vars.q2_explanation}</em></p>
            </div>

            <div class="question">
                <h4>שאלה 3 (מזהה: ${vars.q3_id})</h4>
                <p><strong>שאלה:</strong> ${vars.q3_text}</p>
                <p><strong>תמלול תשובת הסטודנט:</strong></p>
                <p style="background: #fff; padding: 10px; border-radius: 5px;">${vars.q3_transcript}</p>
                <p class="score ${vars.q3_verdict === 'correct' ? 'verdict-correct' : vars.q3_verdict === 'partial' ? 'verdict-partial' : 'verdict-wrong'}">
                    ${vars.q3_verdict_emoji} ${vars.q3_verdict_he} (${vars.q3_score}/100)
                </p>
                <p class="dimensions">דיוק: ${vars.q3_accuracy} | מבנה: ${vars.q3_structure} | מינוח: ${vars.q3_terminology} | לוגיקה: ${vars.q3_logic} | התאמה: ${vars.q3_alignment}</p>
                <p><strong>רמז:</strong> ${vars.q3_hint_text}</p>
                <p><em>${vars.q3_explanation}</em></p>
            </div>
        </div>

        <div class="section">
            <h3>📈 סיכום</h3>
            <p><strong>ציון כולל: ${vars.total_score_0_100}/100</strong></p>
            <p><strong>שאלות נכונות: ${vars.total_correct}/3</strong></p>
            <p><a href="${vars.video_link}" class="button">🎥 צפייה בהקלטה (Google Drive)</a></p>
        </div>

        <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>⚠️ שים לב:</strong> זהו ציון אוטומטי ראשוני. נא לבדוק בדשבורד ולאשר או לערוך:</p>
            <p><a href="${vars.dashboard_link}" class="button">👉 לדשבורד ניהול</a></p>
        </div>

        <div style="text-align: center; color: #666; font-size: 0.9em; margin-top: 30px;">
            <p>מייל זה נשלח אוטומטית ממערכת הבחינות של אונו אקדמית.</p>
            <p>לשאלות: lihi.cyn@gmail.com</p>
        </div>
    </div>
</body>
</html>
  `;

  try {
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: createMessage(INSTRUCTOR_EMAIL, subject, htmlBody),
      },
    });
    return true;
  } catch (error) {
    console.error('Failed to send instructor email:', error);
    return false;
  }
}

// Send student confirmation email
export async function sendStudentEmail(
  studentEmail: string,
  vars: StudentEmailVars
): Promise<boolean> {
  const gmail = getGmail();

  const subject = `✅ מבחן בעל-פה התקבל - ${vars.first_name}`;

  const htmlBody = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; direction: rtl; }
        .container { max-width: 600px; margin: 20px auto; padding: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <p>שלום ${vars.first_name},</p>

        <p>תודה על השתתפותך במבחן בעל-פה בקורס "יישומי בינה מלאכותית בעולם העסקי".</p>

        <p>✅ <strong>המבחן שלך התקבל בהצלחה</strong> ב-${vars.date_hebrew} בשעה ${vars.time}.</p>

        <p>התוצאות יעובדו ויישלחו אליך במייל בהמשך (עד 48 שעות).</p>

        <p>במידה ויש שאלות, ניתן לפנות למרצה:<br>
        <a href="mailto:lihi.cyn@gmail.com">lihi.cyn@gmail.com</a></p>

        <p>בהצלחה,<br>
        צוות הקורס</p>
    </div>
</body>
</html>
  `;

  try {
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: createMessage(studentEmail, subject, htmlBody),
      },
    });
    return true;
  } catch (error) {
    console.error('Failed to send student email:', error);
    return false;
  }
}
