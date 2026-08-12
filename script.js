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
  var qtyLabelEl = document.getElementById("qty-label");

  var CUSTOM_MIN = 3;
  var CUSTOM_MAX = 20;

  var state = {
    packageId: "12",
    packageName: "Paquete Balance",
    meals: 12,
    price: 1399,
    qty: 1,
    zone: null,
    envio: 0,
    coloniaName: "",
    coloniaBlocked: false
  };

  function isCustom() {
    return state.packageId === "custom";
  }

  function mealsCount() {
    return isCustom() ? state.qty : state.meals;
  }

  function refreshSummary() {
    var subtotal = state.price * state.qty;
    var total = subtotal + (state.envio || 0);
    summaryPackageEl.textContent = state.packageName + " · " + mealsCount() + " meals";
    summaryUnitEl.textContent = money(state.price) + (isCustom() ? " / meal" : "");
    summaryEnvioEl.textContent = state.coloniaName ? (money(state.envio) + " MXN") : "Selecciona tu zona";
    summaryTotalEl.textContent = money(total) + " MXN";
    stickyTotalEl.textContent = money(total) + " MXN";
    qtyValueEl.textContent = state.qty;
    qtyLabelEl.textContent = isCustom() ? "Cantidad de meals" : "Cantidad de paquetes";
  }

  packageEls.forEach(function (el) {
    el.addEventListener("click", function () {
      packageEls.forEach(function (p) { p.classList.remove("is-selected"); });
      el.classList.add("is-selected");
      state.packageId = el.dataset.id;
      state.packageName = el.dataset.name;
      state.meals = parseInt(el.dataset.meals, 10);
      state.price = parseInt(el.dataset.price, 10);
      if (isCustom()) {
        state.qty = Math.max(state.qty, CUSTOM_MIN);
      } else {
        state.qty = Math.min(state.qty, 10);
      }
      refreshSummary();
      resetDishSelection();
    });
  });

  function bumpQty() {
    qtyValueEl.classList.remove("bump");
    void qtyValueEl.offsetWidth;
    qtyValueEl.classList.add("bump");
  }

  document.getElementById("qty-minus").addEventListener("click", function () {
    var min = isCustom() ? CUSTOM_MIN : 1;
    if (state.qty > min) { state.qty -= 1; refreshSummary(); bumpQty(); resetDishSelection(); }
  });
  document.getElementById("qty-plus").addEventListener("click", function () {
    var max = isCustom() ? CUSTOM_MAX : 10;
    if (state.qty < max) { state.qty += 1; refreshSummary(); bumpQty(); resetDishSelection(); }
  });

  /* ---------- Dish builder (weekly menu selection) ---------- */
  var dishRows = document.querySelectorAll(".dish-row");
  var dishCounts = {};
  dishRows.forEach(function (row) { dishCounts[row.dataset.dish] = 0; });

  var dishProgressWrap = document.getElementById("dish-progress");
  var dishProgressFill = document.getElementById("dish-progress-fill");
  var dishProgressCount = document.getElementById("dish-progress-count");
  var dishProgressTotal = document.getElementById("dish-progress-total");
  var submitBtn = document.getElementById("submit-btn");

  function requiredMeals() {
    return isCustom() ? state.qty : state.meals * state.qty;
  }

  function totalSelectedDishes() {
    return Object.keys(dishCounts).reduce(function (sum, id) { return sum + dishCounts[id]; }, 0);
  }

  function updateDishProgress() {
    var required = requiredMeals();
    var selected = totalSelectedDishes();
    var complete = selected === required;

    dishProgressCount.textContent = selected;
    dishProgressTotal.textContent = required;
    dishProgressFill.style.width = (required ? Math.min(100, (selected / required) * 100) : 0) + "%";
    dishProgressWrap.classList.toggle("is-complete", complete);
    if (submitBtn) submitBtn.disabled = !complete;

    dishRows.forEach(function (row) {
      var plusBtn = row.querySelector(".dish-plus");
      var minusBtn = row.querySelector(".dish-minus");
      var id = row.dataset.dish;
      plusBtn.disabled = selected >= required;
      minusBtn.disabled = dishCounts[id] === 0;
    });
  }

  function resetDishSelection() {
    dishRows.forEach(function (row) {
      dishCounts[row.dataset.dish] = 0;
      row.querySelector(".dish-qty").textContent = "0";
    });
    updateDishProgress();
  }

  dishRows.forEach(function (row) {
    var id = row.dataset.dish;
    var qtyEl = row.querySelector(".dish-qty");
    row.querySelector(".dish-minus").addEventListener("click", function () {
      if (dishCounts[id] > 0) {
        dishCounts[id] -= 1;
        qtyEl.textContent = dishCounts[id];
        updateDishProgress();
      }
    });
    row.querySelector(".dish-plus").addEventListener("click", function () {
      if (totalSelectedDishes() < requiredMeals()) {
        dishCounts[id] += 1;
        qtyEl.textContent = dishCounts[id];
        updateDishProgress();
      }
    });
  });

  function buildDishSummary() {
    var parts = [];
    dishRows.forEach(function (row) {
      var id = row.dataset.dish;
      if (dishCounts[id] > 0) {
        parts.push(dishCounts[id] + "× " + row.querySelector(".dish-row__name").textContent);
      }
    });
    return parts.join(", ");
  }

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
  updateDishProgress();

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

    if (totalSelectedDishes() !== requiredMeals()) {
      document.getElementById("dish-builder").scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    if (!state.zone) {
      document.getElementById("zone-picker").scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    var subtotal = state.price * state.qty;
    var total = subtotal + state.envio;

    document.getElementById("c-package").textContent = state.packageName + " (" + mealsCount() + " meals)";
    document.getElementById("c-qty").textContent = isCustom()
      ? (state.qty + " meal" + (state.qty > 1 ? "s" : ""))
      : (state.qty + " paquete" + (state.qty > 1 ? "s" : ""));
    document.getElementById("c-dishes").textContent = buildDishSummary();
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
    resetDishSelection();
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
