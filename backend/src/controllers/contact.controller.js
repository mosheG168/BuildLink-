import { sendMail } from "../services/mail.service.js";

export async function submitContactForm(req, res, next) {
  try {
    const { name, email, message } = req.body || {};

    if (!name || !email || !message) {
      return res
        .status(400)
        .json({ error: "Name, email and message are required." });
    }

    const safeName = String(name).trim();
    const safeEmail = String(email).trim();
    const safeMsg = String(message).trim();

    const to = process.env.CONTACT_TO || process.env.SMTP_USER;

    await sendMail({
      to,
      subject: `[BuildLink Contact] ${safeName}`,
      text: `From: ${safeName} <${safeEmail}>\n\nMessage:\n${safeMsg}`,
      html: `
        <p><strong>From:</strong> ${safeName} &lt;${safeEmail}&gt;</p>
        <p><strong>Message:</strong></p>
        <p>${safeMsg.replace(/\n/g, "<br />")}</p>
      `,
      replyTo: safeEmail,
    });

    return res.json({
      message: "Message sent. We'll get back to you soon.",
    });
  } catch (err) {
    next(err);
  }
}
