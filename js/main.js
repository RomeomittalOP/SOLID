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
  const header = document.querySelector(".site-header, .header");
  if (header) {
    const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---- Mobile nav (with Products dropdown accordion) ---- */
  const burger = document.querySelector(".hamburger");
  const links = document.querySelector(".nav-links");
  const isMobile = () => window.matchMedia("(max-width:760px)").matches;
  if (burger && links) {
    burger.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      burger.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", open);
    });
    links.querySelectorAll("a").forEach(a => {
      const parentLi = a.parentElement;
      const isDropParent = parentLi && parentLi.classList.contains("has-drop");
      a.addEventListener("click", (e) => {
        if (isDropParent && isMobile()) {
          e.preventDefault();                 // tap toggles the submenu on mobile
          parentLi.classList.toggle("open-sub");
          return;
        }
        links.classList.remove("open");
        burger.classList.remove("open");
      });
    });
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
    // Pre-select a filter from the URL hash (e.g. products.html#downlights)
    const hash = (location.hash || "").replace("#", "");
    if (hash) {
      const target = [...filters].find(f => f.getAttribute("data-filter") === hash);
      if (target) target.click();
    }
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

  /* ---- Product selection (wattage / colour temp / variant) -> WhatsApp ---- */
  const COLOUR_TEMPS = ["Warm White", "Cool White", "Natural White"];
  document.querySelectorAll(".prod-card").forEach((card) => {
    const optWrap = card.querySelector(".prod-options");
    const btn = card.querySelector(".prod-enquire");
    if (!optWrap || !btn) return;

    const name = (card.querySelector("h3")?.textContent || "Product").trim();
    const model = card.getAttribute("data-model") || "";
    const split = (a) => (a ? a.split(",").map((s) => s.trim()).filter(Boolean) : []);

    const groups = [];
    const watt = split(card.getAttribute("data-watt"));
    if (watt.length) groups.push({ key: "Wattage", label: "Wattage", options: watt });
    if (!card.hasAttribute("data-notemp")) groups.push({ key: "Colour", label: "Colour Temperature", options: COLOUR_TEMPS });
    const variant = split(card.getAttribute("data-variant"));
    if (variant.length) groups.push({ key: "Variant", label: "Variant / Finish", options: variant });
    const length = split(card.getAttribute("data-length"));
    if (length.length) groups.push({ key: "Length", label: "Length", options: length });
    if (!groups.length) return;

    const selection = {};
    const escAttr = (s) => String(s).replace(/"/g, "&quot;");
    optWrap.innerHTML = groups
      .map((g) => `
      <div class="opt-group">
        <span class="opt-label">${g.label}</span>
        <div class="opt-chips">
          ${g.options.map((o) => `<button type="button" class="opt-chip" data-key="${g.key}" data-val="${escAttr(o)}">${o}</button>`).join("")}
        </div>
      </div>`)
      .join("");

    const refresh = () => { btn.disabled = !groups.every((g) => selection[g.key]); };
    refresh();

    optWrap.addEventListener("click", (e) => {
      const chip = e.target.closest(".opt-chip");
      if (!chip) return;
      selection[chip.getAttribute("data-key")] = chip.getAttribute("data-val");
      chip.parentElement.querySelectorAll(".opt-chip").forEach((c) => c.classList.toggle("sel", c === chip));
      refresh();
    });

    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      const lines = ["Hi, I am interested in the following product:", "", `Product: ${name}`];
      if (model) lines.push(`Model: ${model}`);
      ["Wattage", "Colour", "Variant", "Length"].forEach((k) => { if (selection[k]) lines.push(`${k}: ${selection[k]}`); });
      lines.push("", "Please share more details.");
      window.open(waLink(lines.join("\n")), "_blank", "noopener");
    });
  });

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
