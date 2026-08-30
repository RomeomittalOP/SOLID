/* ============================================================
   SOLID — cart.js
   Lightweight cart with localStorage persistence + WhatsApp checkout.
   No backend, no payment gateway — cart contents get compiled into
   a single pre-filled WhatsApp message when the user checks out.
   Works site-wide: injects its own floating button + drawer, so no
   header markup needs to change on any page.
============================================================ */
(function () {
  "use strict";

  const STORAGE_KEY = "solid_cart_v1";
  const WA_NUMBER = "919860116122";

  /* ---------- Cart state ---------- */
  function getCart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveCart(cart) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      /* localStorage unavailable — cart just won't persist across reloads */
    }
    renderBadge();
    renderDrawer();
  }

  function addToCart(item) {
    const cart = getCart();
    const existing = cart.find((c) => c.slug === item.slug && c.variant === item.variant);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push(Object.assign({ qty: 1 }, item));
    }
    saveCart(cart);
    openDrawer();
    toast(`${item.name} added to enquiry cart`);
  }

  function updateQty(index, delta) {
    const cart = getCart();
    if (!cart[index]) return;
    cart[index].qty += delta;
    if (cart[index].qty <= 0) cart.splice(index, 1);
    saveCart(cart);
  }

  function removeItem(index) {
    const cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
  }

  function clearCart() {
    saveCart([]);
  }

  function cartCount() {
    return getCart().reduce((sum, c) => sum + c.qty, 0);
  }

  /* ---------- WhatsApp checkout ---------- */
  function checkoutViaWhatsApp() {
    const cart = getCart();
    if (!cart.length) return;
    const lines = ["Hi SOLID, I'd like to enquire about the following products:", ""];
    cart.forEach((item, i) => {
      let line = `${i + 1}. ${item.name}`;
      if (item.model) line += ` (Model ${item.model})`;
      line += ` — Qty: ${item.qty}`;
      if (item.variant) line += ` [${item.variant}]`;
      lines.push(line);
    });
    lines.push("", "Please share pricing, availability and delivery timeline.");
    const text = encodeURIComponent(lines.join("\n"));
    window.open(`https://wa.me/${WA_NUMBER}?text=${text}`, "_blank", "noopener");
  }

  /* ---------- Toast ---------- */
  function toast(msg) {
    let t = document.querySelector(".cart-toast");
    if (!t) {
      t = document.createElement("div");
      t.className = "cart-toast";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove("show"), 2600);
  }

  /* ---------- UI injection ---------- */
  let floatBtn, drawer, overlay;

  function buildUI() {
    /* Floating cart button */
    floatBtn = document.createElement("button");
    floatBtn.className = "cart-float";
    floatBtn.setAttribute("aria-label", "View enquiry cart");
    floatBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>
      <span class="cart-badge" style="display:none">0</span>
    `;
    floatBtn.addEventListener("click", toggleDrawer);
    document.body.appendChild(floatBtn);

    /* Overlay */
    overlay = document.createElement("div");
    overlay.className = "cart-overlay";
    overlay.addEventListener("click", closeDrawer);
    document.body.appendChild(overlay);

    /* Drawer */
    drawer = document.createElement("aside");
    drawer.className = "cart-drawer";
    drawer.innerHTML = `
      <div class="cart-drawer-head">
        <h3>Enquiry Cart</h3>
        <button class="cart-close" aria-label="Close cart">&times;</button>
      </div>
      <div class="cart-items"></div>
      <div class="cart-drawer-foot">
        <button class="btn btn-ghost cart-clear" type="button">Clear Cart</button>
        <a class="btn btn-wa cart-checkout" href="#" role="button">
          Checkout on WhatsApp
        </a>
      </div>
    `;
    document.body.appendChild(drawer);

    drawer.querySelector(".cart-close").addEventListener("click", closeDrawer);
    drawer.querySelector(".cart-clear").addEventListener("click", () => {
      if (getCart().length && confirm("Clear all items from your enquiry cart?")) clearCart();
    });
    drawer.querySelector(".cart-checkout").addEventListener("click", (e) => {
      e.preventDefault();
      checkoutViaWhatsApp();
    });
  }

  function renderBadge() {
    if (!floatBtn) return;
    const count = cartCount();
    const badge = floatBtn.querySelector(".cart-badge");
    badge.textContent = count;
    badge.style.display = count > 0 ? "flex" : "none";
  }

  function renderDrawer() {
    if (!drawer) return;
    const cart = getCart();
    const itemsWrap = drawer.querySelector(".cart-items");
    const checkoutBtn = drawer.querySelector(".cart-checkout");

    if (!cart.length) {
      itemsWrap.innerHTML = `<div class="cart-empty">
        <svg viewBox="0 0 24 24" width="40" height="40"><path fill="currentColor" opacity=".3" d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>
        <p>Your enquiry cart is empty.</p>
        <p class="cart-empty-sub">Browse products and tap "Add to Cart" to build a multi-product enquiry.</p>
      </div>`;
      checkoutBtn.classList.add("disabled");
      return;
    }
    checkoutBtn.classList.remove("disabled");

    itemsWrap.innerHTML = cart
      .map(
        (item, i) => `
      <div class="cart-item">
        <div class="cart-item-img">${item.image ? `<img src="${item.image}" alt="${escapeHtml(item.name)}" loading="lazy" />` : ""}</div>
        <div class="cart-item-info">
          <div class="cart-item-name">${escapeHtml(item.name)}</div>
          ${item.model ? `<div class="cart-item-model">Model: ${escapeHtml(item.model)}</div>` : ""}
          <div class="cart-item-qty">
            <button type="button" class="qty-btn" data-i="${i}" data-d="-1">&minus;</button>
            <span>${item.qty}</span>
            <button type="button" class="qty-btn" data-i="${i}" data-d="1">+</button>
          </div>
        </div>
        <button type="button" class="cart-item-remove" data-i="${i}" aria-label="Remove item">&times;</button>
      </div>`
      )
      .join("");

    itemsWrap.querySelectorAll(".qty-btn").forEach((btn) =>
      btn.addEventListener("click", () => updateQty(parseInt(btn.dataset.i, 10), parseInt(btn.dataset.d, 10)))
    );
    itemsWrap.querySelectorAll(".cart-item-remove").forEach((btn) =>
      btn.addEventListener("click", () => removeItem(parseInt(btn.dataset.i, 10)))
    );
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function openDrawer() {
    drawer.classList.add("open");
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeDrawer() {
    drawer.classList.remove("open");
    overlay.classList.remove("open");
    document.body.style.overflow = "";
  }
  function toggleDrawer() {
    drawer.classList.contains("open") ? closeDrawer() : openDrawer();
  }

  /* ---------- Wire up any [data-add-to-cart] buttons on the page ---------- */
  function wireAddToCartButtons() {
    document.querySelectorAll("[data-add-to-cart]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        addToCart({
          slug: btn.getAttribute("data-slug") || btn.getAttribute("data-add-to-cart"),
          name: btn.getAttribute("data-name") || "Product",
          model: btn.getAttribute("data-model") || "",
          image: btn.getAttribute("data-image") || "",
          variant: btn.getAttribute("data-variant") || "",
        });
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    buildUI();
    renderBadge();
    renderDrawer();
    wireAddToCartButtons();
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeDrawer();
    });
  });

  /* Expose for inline use if ever needed */
  window.SOLIDCart = { addToCart, getCart, clearCart };
})();
