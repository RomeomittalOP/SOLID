/**
 * Optional email notifications via nodemailer.
 * If SMTP_* env vars are not set, this no-ops (enquiries are still saved).
 */
const nodemailer = require("nodemailer");

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  NOTIFY_TO,
  NOTIFY_FROM,
  WHATSAPP_NUMBER,
} = process.env;

const enabled = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);

let transporter = null;
if (enabled) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: String(SMTP_SECURE).toLowerCase() === "true",
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

function esc(s = "") {
  return String(s).replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]));
}

async function sendEnquiryEmail(e) {
  if (!enabled) return { sent: false, reason: "smtp-not-configured" };
  const to = NOTIFY_TO || SMTP_USER;
  const from = NOTIFY_FROM || SMTP_USER;
  const waReply = e.phone
    ? `https://wa.me/${String(e.phone).replace(/\D/g, "")}`
    : WHATSAPP_NUMBER
    ? `https://wa.me/${WHATSAPP_NUMBER}`
    : "";

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
      <div style="background:#005AAA;color:#fff;padding:18px 22px;border-radius:10px 10px 0 0">
        <h2 style="margin:0">New Website Enquiry — SOLID</h2>
      </div>
      <div style="border:1px solid #e3e9f0;border-top:0;padding:22px;border-radius:0 0 10px 10px">
        <p><b>Name:</b> ${esc(e.name)}</p>
        ${e.phone ? `<p><b>Phone:</b> ${esc(e.phone)}</p>` : ""}
        ${e.email ? `<p><b>Email:</b> ${esc(e.email)}</p>` : ""}
        ${e.product ? `<p><b>Interested in:</b> ${esc(e.product)}</p>` : ""}
        <p><b>Message:</b><br>${esc(e.message).replace(/\n/g, "<br>")}</p>
        <p style="color:#5b6b7b;font-size:12px">Received: ${new Date(e.createdAt).toLocaleString()}</p>
        ${waReply ? `<a href="${waReply}" style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;padding:10px 18px;border-radius:50px;font-weight:bold">Reply on WhatsApp</a>` : ""}
      </div>
    </div>`;

  await transporter.sendMail({
    from: `"SOLID Website" <${from}>`,
    to,
    replyTo: e.email || undefined,
    subject: `New enquiry from ${e.name}${e.product ? " — " + e.product : ""}`,
    html,
  });
  return { sent: true };
}

module.exports = { sendEnquiryEmail, emailEnabled: enabled };
