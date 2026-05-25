/* ============================================================
   SOLID — main.js
   One place to change the WhatsApp number for the whole site.
============================================================ */
const SOLID = {
  // WhatsApp number in international format, no +, no spaces (91 = India)
  whatsapp: "919860116122",
  phoneDisplay: "+91 98601 16122",
  email: "solidstateindia@gmail.com",
};

/* Build a wa.me link with a prefilled message */
function waLink(message) {
  const text = encodeURIComponent(message || "Hi SOLID, I'm interested in your LED lighting products.");
  return `https://wa.me/${SOLID.whatsapp}?text=${text}`;
}

document.addEventListener("DOMContentLoaded", () => {
  /* ---- Year in footer ---- */
  document.querySelectorAll("[data-year]").forEach(el => el.textContent = new Date().getFullYear());

  /* ---- Wire up any element with data-wa (custom message) ---- */
  document.querySelectorAll("[data-wa]").forEach(el => {
    el.setAttribute("href", waLink(el.getAttribute("data-wa")));
    el.setAttribute("target", "_blank");
    el.setAttribute("rel", "noopener");
  });

  /* ---- Sticky header shadow ---- */
  const header = document.querySelector(".header");
  if (header) {
    const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---- Mobile nav ---- */
  const burger = document.querySelector(".hamburger");
  const links = document.querySelector(".nav-links");
  if (burger && links) {
    burger.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      burger.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", open);
    });
    links.querySelectorAll("a").forEach(a =>
      a.addEventListener("click", () => {
        links.classList.remove("open");
        burger.classList.remove("open");
      })
    );
  }

  /* ---- Scroll reveal ---- */
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add("in"));
  }

  /* ---- Animated stat counters ---- */
  const nums = document.querySelectorAll("[data-count]");
  if (nums.length) {
    const run = (el) => {
      const target = parseFloat(el.getAttribute("data-count"));
      const suffix = el.getAttribute("data-suffix") || "";
      const dur = 1400; const start = performance.now();
      const step = (now) => {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased).toLocaleString() + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const io2 = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { run(e.target); io2.unobserve(e.target); } });
    }, { threshold: 0.5 });
    nums.forEach(n => io2.observe(n));
  }

  /* ---- Product filtering ---- */
  const filters = document.querySelectorAll(".filter");
  const cards = document.querySelectorAll(".prod-card");
  if (filters.length) {
    filters.forEach(f => f.addEventListener("click", () => {
      filters.forEach(x => x.classList.remove("active"));
      f.classList.add("active");
      const cat = f.getAttribute("data-filter");
      cards.forEach(c => {
        const show = cat === "all" || c.getAttribute("data-cat") === cat;
        c.classList.toggle("hide", !show);
      });
    }));
  }

  /* ---- Lightbox (catalog page view) ---- */
  const lb = document.querySelector(".lightbox");
  if (lb) {
    const lbImg = lb.querySelector("img");
    const open = (src) => { lbImg.src = src; lb.classList.add("open"); document.body.style.overflow = "hidden"; };
    const close = () => { lb.classList.remove("open"); document.body.style.overflow = ""; };
    document.querySelectorAll("[data-lightbox]").forEach(el =>
      el.addEventListener("click", () => open(el.getAttribute("data-lightbox")))
    );
    lb.addEventListener("click", (e) => { if (e.target === lb || e.target.classList.contains("lb-close")) close(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  }

  /* ---- Contact form -> WhatsApp ---- */
  const form = document.querySelector("#contactForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const f = new FormData(form);
      const name = (f.get("name") || "").toString().trim();
      const phone = (f.get("phone") || "").toString().trim();
      const product = (f.get("product") || "").toString().trim();
      const message = (f.get("message") || "").toString().trim();
      const lines = [
        `Hello SOLID Lighting,`,
        ``,
        `Name: ${name}`,
        phone ? `Phone: ${phone}` : null,
        product ? `Interested in: ${product}` : null,
        message ? `Message: ${message}` : null,
      ].filter(Boolean);
      window.open(waLink(lines.join("\n")), "_blank", "noopener");
      showToast("Opening WhatsApp to send your enquiry…");
      form.reset();
    });
  }
});

/* ---- Toast ---- */
function showToast(msg) {
  let t = document.querySelector(".toast");
  if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), 3500);
}
