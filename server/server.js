/**
 * SOLID — Lighting Everything | Backend
 * - Serves the static frontend (the SOLID/ folder, one level up)
 * - POST /api/contact   : save an enquiry (+ optional email notification)
 * - GET  /api/enquiries : list enquiries        (admin token required)
 * - PATCH/DELETE        : mark handled / delete  (admin token required)
 * - GET  /admin         : protected dashboard page
 *
 * The frontend keeps working with WhatsApp even if this server is offline.
 * It only POSTs here when window.SOLID_API_URL is set (see backend README).
 */
require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const store = require("./lib/store");
const { sendEnquiryEmail, emailEnabled } = require("./lib/mailer");

const app = express();
const PORT = Number(process.env.PORT) || 5511;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";
const FRONTEND_DIR = path.join(__dirname, ".."); // the SOLID/ folder

app.set("trust proxy", 1);

// Security headers — relaxed CSP because the static site uses Google Fonts + Maps embed.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        frameSrc: ["https://www.google.com", "https://maps.google.com"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

const origins = (process.env.CORS_ORIGIN || "*").split(",").map((s) => s.trim());
app.use(cors({ origin: origins.includes("*") ? true : origins }));
app.use(express.json({ limit: "16kb" }));

// ---- Helpers ----
function isValidEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}
function clean(v, max) {
  return String(v ?? "").trim().slice(0, max);
}
function requireAdmin(req, res, next) {
  if (!ADMIN_TOKEN) return res.status(503).json({ ok: false, error: "Admin not configured (set ADMIN_TOKEN)." });
  const token = req.get("x-admin-token") || (req.query.token ?? "");
  if (token !== ADMIN_TOKEN) return res.status(401).json({ ok: false, error: "Unauthorized" });
  next();
}

// ---- Health ----
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "solid-backend", email: emailEnabled, ...store.stats() });
});

// ---- Contact form ----
const contactLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 8, // max 8 enquiries per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: "Too many enquiries. Please try again later." },
});

app.post("/api/contact", contactLimiter, async (req, res) => {
  try {
    const b = req.body || {};

    // Honeypot: bots fill hidden "company" field; humans leave it empty.
    if (clean(b.company, 100)) return res.json({ ok: true }); // silently accept + drop

    const name = clean(b.name, 100);
    const phone = clean(b.phone, 30);
    const email = clean(b.email, 120);
    const product = clean(b.product, 100);
    const message = clean(b.message, 2000);

    if (name.length < 2) return res.status(400).json({ ok: false, error: "Please enter your name." });
    if (!phone && !email) return res.status(400).json({ ok: false, error: "Please provide a phone number or email." });
    if (email && !isValidEmail(email)) return res.status(400).json({ ok: false, error: "Please enter a valid email." });
    if (message.length < 3) return res.status(400).json({ ok: false, error: "Please enter a message." });

    const record = store.add({ name, phone, email, product, message, ip: req.ip });

    let emailResult = { sent: false };
    try {
      emailResult = await sendEnquiryEmail(record);
    } catch (err) {
      console.error("[mailer] failed:", err.message); // saved anyway
    }

    res.json({ ok: true, id: record.id, emailed: emailResult.sent });
  } catch (err) {
    console.error("[contact] error:", err);
    res.status(500).json({ ok: false, error: "Something went wrong. Please try WhatsApp." });
  }
});

// ---- Admin API ----
app.get("/api/enquiries", requireAdmin, (req, res) => {
  const handled = req.query.handled === "true" ? true : req.query.handled === "false" ? false : undefined;
  res.json({ ok: true, stats: store.stats(), enquiries: store.list({ handled }) });
});

app.patch("/api/enquiries/:id", requireAdmin, (req, res) => {
  const updated = store.update(req.params.id, { handled: Boolean(req.body?.handled) });
  if (!updated) return res.status(404).json({ ok: false, error: "Not found" });
  res.json({ ok: true, enquiry: updated });
});

app.delete("/api/enquiries/:id", requireAdmin, (req, res) => {
  const removed = store.remove(req.params.id);
  if (!removed) return res.status(404).json({ ok: false, error: "Not found" });
  res.json({ ok: true });
});

// ---- Admin page ----
app.get("/admin", (_req, res) => res.sendFile(path.join(__dirname, "admin.html")));

// ---- Static frontend (served last so /api/* wins) ----
app.use(express.static(FRONTEND_DIR, { extensions: ["html"] }));

app.listen(PORT, () => {
  console.log(`\n  SOLID backend running:  http://localhost:${PORT}`);
  console.log(`  Website:                http://localhost:${PORT}/`);
  console.log(`  Admin dashboard:        http://localhost:${PORT}/admin`);
  console.log(`  Email notifications:    ${emailEnabled ? "ENABLED" : "disabled (SMTP not set)"}`);
  if (!ADMIN_TOKEN) console.log("  WARNING: ADMIN_TOKEN not set — admin API is locked until you set it in .env\n");
});
