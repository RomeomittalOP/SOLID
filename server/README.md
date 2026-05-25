# SOLID — Backend (enquiry capture + admin)

A small Node/Express server that:
- **serves the static SOLID website**,
- **captures contact-form enquiries** to a JSON file (no database server needed),
- **emails a notification** for each enquiry (optional — works without it too),
- gives a **password-protected admin dashboard** at `/admin` to view, reply (WhatsApp),
  mark handled and delete enquiries.

> The website still works perfectly **without** this backend — the contact form falls
> back to WhatsApp. The backend is an optional upgrade that *also* stores enquiries.

## Run it locally
```
cd SOLID/server
npm install
npm start
```
Then open:
- Website: http://localhost:5511/
- Admin:   http://localhost:5511/admin   (token is in `.env` → `ADMIN_TOKEN`)

Use `npm run dev` for auto-restart while editing.

## Configuration (`.env`)
Copy `.env.example` → `.env` and edit. Key values:
- `ADMIN_TOKEN` — password for the admin dashboard (a strong random one is already set).
- `CORS_ORIGIN` — set to the live domain in production (e.g. `https://solidlights.in`).
- `SMTP_*` — fill these to enable email notifications (see below). Leave blank to disable.

### Email notifications (optional)
Easiest is Gmail with an **App Password**:
1. Google Account → Security → 2-Step Verification (turn on) → **App passwords**.
2. Create one, copy the 16-char password.
3. In `.env`:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=solidstateindia@gmail.com
   SMTP_PASS=your-16-char-app-password
   NOTIFY_TO=solidstateindia@gmail.com
   ```
Each enquiry then emails a formatted notification with a "Reply on WhatsApp" button.

## API
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET  | `/api/health` | — | status + counts |
| POST | `/api/contact` | — | submit an enquiry `{name, phone?, email?, product?, message, company?}` |
| GET  | `/api/enquiries?handled=true\|false` | admin | list enquiries |
| PATCH| `/api/enquiries/:id` | admin | `{handled:true\|false}` |
| DELETE | `/api/enquiries/:id` | admin | delete |

Admin auth = header `x-admin-token: <ADMIN_TOKEN>`.
Spam protection: hidden **honeypot** field `company` (if filled, the enquiry is dropped) +
rate limiting (8 enquiries / IP / 10 min).

Enquiries are stored in `data/enquiries.json` (auto-created; git-ignored).

---

## Connecting the frontend to this backend (do this LATER — frontend is untouched for now)
The site currently uses WhatsApp only. When you want the contact form to ALSO save to the
backend, make these two small edits (no redesign needed):

**1) In `contact.html`** — add a hidden honeypot field inside the `<form id="contactForm">`
(right after the opening tag):
```html
<input type="text" name="company" tabindex="-1" autocomplete="off"
       style="position:absolute;left:-9999px" aria-hidden="true" />
```
and (optional) set the API base near the top of the page, before `js/main.js`:
```html
<script>window.SOLID_API_URL = "";  // same-origin; or "https://api.yourdomain.com"</script>
```

**2) In `js/main.js`** — inside the `#contactForm` submit handler, before opening WhatsApp,
add a background POST (keeps WhatsApp as the user-facing action):
```js
if (window.SOLID_API_URL !== undefined) {
  fetch((window.SOLID_API_URL || "") + "/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, phone, email: "", product, message, company: f.get("company") || "" })
  }).catch(() => {});
}
```
That's it — enquiries get stored/emailed AND the user still goes to WhatsApp.

---

## Deploying the backend
This server needs a Node host (Render, Railway, a VPS, or any host with Node). Static-only
hosts like Netlify/GitHub Pages can host the **website** but not this server.

**Render (free tier, simple):**
1. Push the repo to GitHub.
2. Render → New → Web Service → pick the repo, root dir = `SOLID/server`.
3. Build: `npm install`  · Start: `npm start`.
4. Add the `.env` values under **Environment**.
5. Point `api.yourdomain.com` (or a path) at the Render URL, set `CORS_ORIGIN` to the site domain.

**Common setup:** website on Netlify (fast/free) + backend on Render, with
`window.SOLID_API_URL` pointing at the Render URL. Or run everything from this one server
(it serves the site too) on a single VPS.
