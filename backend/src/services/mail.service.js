import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

console.log("[mail] SMTP_USER =", JSON.stringify(process.env.SMTP_USER));
console.log("[mail] SMTP_PASS defined =", !!process.env.SMTP_PASS);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

if (process.env.NODE_ENV !== "production") {
  transporter.verify((err, success) => {
    if (err) {
      console.error("❌ SMTP verification failed:", err.message);
    } else {
      console.log("✅ SMTP server is ready to take messages");
    }
  });
}

export async function sendMail({ to, subject, text, html }) {
  const from = process.env.MAIL_FROM || '"BuildLink" <buildlink634@gmail.com>';

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
    console.log("📧 Email sent:", info.messageId);
    return info;
  } catch (err) {
    console.error("❌ Error sending email:", err);
    throw err;
  }
}
