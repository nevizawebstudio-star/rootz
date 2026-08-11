(function () {
  "use strict";

  var money = function (n) {
    return "$" + n.toLocaleString("es-MX", { maximumFractionDigits: 0 });
  };

  /* ---------- Sticky nav shadow ---------- */
  var nav = document.getElementById("nav");
  var stickyCta = document.getElementById("sticky-cta");
  window.addEventListener("scroll", function () {
    nav.classList.toggle("is-scrolled", window.scrollY > 12);
    var packagesEl = document.getElementById("paquetes");
    var footerEl = document.querySelector(".footer");
    if (!packagesEl || !footerEl) return;
    var pastPackages = window.scrollY > packagesEl.offsetTop - 200;
    var beforeFooter = window.scrollY + window.innerHeight < footerEl.offsetTop;
    stickyCta.classList.toggle("is-visible", pastPackages && beforeFooter);
  });

  /* ---------- Weekly menu tabs ---------- */
  var tabs = document.querySelectorAll(".menu-tab");
  var panels = {
    desayunos: document.getElementById("panel-desayunos"),
    comida: document.getElementById("panel-comida"),
    chef: document.getElementById("panel-chef")
  };
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      tabs.forEach(function (t) { t.classList.remove("is-active"); });
      Object.keys(panels).forEach(function (key) { panels[key].classList.remove("is-active"); });
      tab.classList.add("is-active");
      panels[tab.dataset.tab].classList.add("is-active");
    });
  });

  /* ---------- Package selection + order summary ---------- */
  var packageEls = document.querySelectorAll(".package");
  var qtyValueEl = document.getElementById("qty-value");
  var summaryPackageEl = document.getElementById("summary-package");
  var summaryUnitEl = document.getElementById("summary-unit");
  var summaryTotalEl = document.getElementById("summary-total");
  var stickyTotalEl = document.getElementById("sticky-total");

  var summaryEnvioEl = document.getElementById("summary-envio");

  var state = {
    packageId: "10",
    packageName: "Paquete Balance",
    meals: 10,
    price: 1399,
    qty: 1,
    zone: null,
    envio: 0,
    coloniaName: "",
    coloniaBlocked: false
  };

  function refreshSummary() {
    var subtotal = state.price * state.qty;
    var total = subtotal + (state.envio || 0);
    summaryPackageEl.textContent = state.packageName + " · " + state.meals + " meals";
    summaryUnitEl.textContent = money(state.price);
    summaryEnvioEl.textContent = state.coloniaName ? (money(state.envio) + " MXN") : "Selecciona tu zona";
    summaryTotalEl.textContent = money(total) + " MXN";
    stickyTotalEl.textContent = money(total) + " MXN";
    qtyValueEl.textContent = state.qty;
  }

  packageEls.forEach(function (el) {
    el.addEventListener("click", function () {
      packageEls.forEach(function (p) { p.classList.remove("is-selected"); });
      el.classList.add("is-selected");
      state.packageId = el.dataset.id;
      state.packageName = el.dataset.name;
      state.meals = parseInt(el.dataset.meals, 10);
      state.price = parseInt(el.dataset.price, 10);
      refreshSummary();
    });
  });

  function bumpQty() {
    qtyValueEl.classList.remove("bump");
    void qtyValueEl.offsetWidth;
    qtyValueEl.classList.add("bump");
  }

  document.getElementById("qty-minus").addEventListener("click", function () {
    if (state.qty > 1) { state.qty -= 1; refreshSummary(); bumpQty(); }
  });
  document.getElementById("qty-plus").addEventListener("click", function () {
    if (state.qty < 10) { state.qty += 1; refreshSummary(); bumpQty(); }
  });

  /* ---------- Delivery zone selection ---------- */
  var ZONE_LABEL = { A: "Zona A", B: "Zona B", C: "Zona C" };
  var zoneCards = document.querySelectorAll(".zone-card");
  zoneCards.forEach(function (el) {
    el.addEventListener("click", function () {
      zoneCards.forEach(function (z) { z.classList.remove("is-selected"); });
      el.classList.add("is-selected");
      state.zone = el.dataset.zone;
      state.envio = parseInt(el.dataset.price, 10);
      state.coloniaName = ZONE_LABEL[state.zone];
      state.coloniaBlocked = false;
      refreshSummary();
    });
  });

  refreshSummary();

  /* ---------- Card number formatting (demo only) ---------- */
  var cardInput = document.getElementById("f-card");
  cardInput.addEventListener("input", function () {
    var digits = cardInput.value.replace(/\D/g, "").slice(0, 16);
    cardInput.value = digits.replace(/(.{4})/g, "$1 ").trim();
  });
  var expInput = document.getElementById("f-exp");
  expInput.addEventListener("input", function () {
    var digits = expInput.value.replace(/\D/g, "").slice(0, 4);
    expInput.value = digits.length > 2 ? digits.slice(0, 2) + "/" + digits.slice(2) : digits;
  });

  /* ---------- Order submit (demo) ---------- */
  var form = document.getElementById("order-form");
  var confirmPanel = document.getElementById("confirm-panel");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    if (!state.zone) {
      document.getElementById("zone-picker").scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    var subtotal = state.price * state.qty;
    var total = subtotal + state.envio;

    document.getElementById("c-package").textContent = state.packageName + " (" + state.meals + " meals)";
    document.getElementById("c-qty").textContent = state.qty + " paquete" + (state.qty > 1 ? "s" : "");
    document.getElementById("c-colonia").textContent = state.coloniaName;
    document.getElementById("c-envio").textContent = money(state.envio) + " MXN";
    document.getElementById("c-total").textContent = money(total) + " MXN";

    form.style.display = "none";
    confirmPanel.classList.add("is-visible");
    confirmPanel.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  document.getElementById("confirm-reset").addEventListener("click", function () {
    form.reset();
    form.style.display = "block";
    confirmPanel.classList.remove("is-visible");
    state.zone = null;
    state.envio = 0;
    state.coloniaName = "";
    state.coloniaBlocked = false;
    zoneCards.forEach(function (z) { z.classList.remove("is-selected"); });
    refreshSummary();
    document.getElementById("ordenar").scrollIntoView({ behavior: "smooth" });
  });

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Animated hero stat counters ---------- */
  var countEls = document.querySelectorAll("[data-count]");
  function animateCount(el) {
    var target = parseInt(el.dataset.count, 10) || 0;
    var prefix = el.dataset.prefix || "";
    var suffix = el.dataset.suffix || "";
    var duration = 1200;
    var start = null;

    function step(timestamp) {
      if (start === null) start = timestamp;
      var progress = Math.min((timestamp - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var value = Math.round(target * eased);
      el.textContent = prefix + value + suffix;
      if (progress < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }

  if (countEls.length) {
    if ("IntersectionObserver" in window) {
      var countObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            countObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.4 });
      countEls.forEach(function (el) { countObserver.observe(el); });
    } else {
      countEls.forEach(function (el) {
        el.textContent = (el.dataset.prefix || "") + el.dataset.count + (el.dataset.suffix || "");
      });
    }
  }
})();
