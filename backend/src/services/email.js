import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY || "placeholder");
}

const FROM = "VidyaSetu <onboarding@resend.dev>";

async function sendOne(to, subject, html) {
  const result = await getResend().emails.send({ from: FROM, to, subject, html });
  if (result.error) {
    console.error(`[Email] Failed to ${to}:`, result.error.message);
  } else {
    console.log(`[Email] Sent to ${to}`);
  }
}

export async function notifyStudentsNewNote(noteTitle, subject, teacherName, studentEmails) {
  if (!process.env.RESEND_API_KEY || !studentEmails.length) return;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #16a34a;">New Study Notes Available! 📚</h2>
      <p>Your teacher <strong>${teacherName}</strong> has uploaded new notes:</p>
      <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <h3 style="margin: 0; color: #15803d;">${noteTitle}</h3>
        <p style="margin: 8px 0 0; color: #166534;">Subject: ${subject}</p>
      </div>
      <p>Log in to VidyaSetu to download and study!</p>
      <a href="http://localhost:8080/notes" style="background: #16a34a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin-top: 16px;">
        View Notes →
      </a>
      <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">VidyaSetu — Bridge of Knowledge 🌉</p>
    </div>
  `;
  for (const email of studentEmails) {
    await sendOne(email, `📚 New Notes: ${noteTitle}`, html);
  }
}

export async function notifyStudentsNewVideo(videoTitle, subject, teacherName, studentEmails) {
  if (!process.env.RESEND_API_KEY || !studentEmails.length) return;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #7c3aed;">New Video Lesson Available! 🎥</h2>
      <p>Your teacher <strong>${teacherName}</strong> has uploaded a new video:</p>
      <div style="background: #faf5ff; border-left: 4px solid #7c3aed; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <h3 style="margin: 0; color: #6d28d9;">${videoTitle}</h3>
        <p style="margin: 8px 0 0; color: #5b21b6;">Subject: ${subject}</p>
      </div>
      <p>Log in to VidyaSetu to watch!</p>
      <a href="http://localhost:8080/videos" style="background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin-top: 16px;">
        Watch Video →
      </a>
      <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">VidyaSetu — Bridge of Knowledge 🌉</p>
    </div>
  `;
  for (const email of studentEmails) {
    await sendOne(email, `🎥 New Video: ${videoTitle}`, html);
  }
}