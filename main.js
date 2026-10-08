/* Starlight Home Health Services: site behavior.
   Everything here is progressive enhancement. With scripts off, every page is complete,
   readable and fully usable. */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduceQuery = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;

  function motionOn() {
    return root.classList.contains("motion-on");
  }

  /* Motion preference: honors the OS setting, and the on page toggle can override it */
  function setMotion(on, remember) {
    root.classList.toggle("motion-on", on);
    root.classList.toggle("motion-off", !on);
    if (remember) {
      try {
        localStorage.setItem("sl-motion", on ? "on" : "off");
      } catch (e) {
        /* storage unavailable */
      }
    }
    document.querySelectorAll(".motion-toggle").forEach(function (btn) {
      btn.setAttribute("aria-pressed", on ? "false" : "true");
    });
    if (!on) {
      revealAll();
      settleCounters();
      resetScrollEffects();
    } else {
      onScroll();
    }
  }

  document.querySelectorAll(".motion-toggle").forEach(function (btn) {
    btn.setAttribute("aria-pressed", motionOn() ? "false" : "true");
    btn.addEventListener("click", function () {
      setMotion(!motionOn(), true);
    });
  });
  if (reduceQuery && reduceQuery.addEventListener) {
    reduceQuery.addEventListener("change", function (e) {
      var saved = null;
      try {
        saved = localStorage.getItem("sl-motion");
      } catch (err) {
        /* ignore */
      }
      if (!saved) setMotion(!e.matches, false);
    });
  }

  /* Mobile menu */
  var header = document.querySelector(".site-header");
  var menuBtn = document.querySelector(".menu-btn");
  var menu = document.getElementById("site-menu");
  var inertTargets = Array.prototype.slice.call(document.querySelectorAll(".topbar, main, .site-footer, .skip-link"));

  function isMobileNav() {
    return menuBtn && window.getComputedStyle(menuBtn).display !== "none";
  }

  function openMenu() {
    menu.style.setProperty("--menu-top", Math.max(0, header.getBoundingClientRect().bottom) + "px");
    menuBtn.setAttribute("aria-expanded", "true");
    menuBtn.querySelector(".menu-label").textContent = "Close";
    menu.classList.add("is-open");
    header.classList.add("menu-open");
    document.body.style.overflow = "hidden";
    inertTargets.forEach(function (el) {
      el.inert = true;
    });
    var first = menu.querySelector("a");
    if (first)
      window.setTimeout(function () {
        first.focus();
      }, 60);
  }
  function closeMenu(returnFocus) {
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.querySelector(".menu-label").textContent = "Menu";
    menu.classList.remove("is-open");
    header.classList.remove("menu-open");
    document.body.style.overflow = "";
    inertTargets.forEach(function (el) {
      el.inert = false;
    });
    if (returnFocus) menuBtn.focus();
  }
  if (menuBtn && menu) {
    menu.querySelectorAll(".menu-list li").forEach(function (li, i) {
      li.style.setProperty("--i", i);
    });
    menuBtn.addEventListener("click", function () {
      if (menuBtn.getAttribute("aria-expanded") === "true") closeMenu(true);
      else openMenu();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menuBtn.getAttribute("aria-expanded") === "true") closeMenu(true);
    });
    /* Keep keyboard focus inside the open menu panel */
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Tab" || menuBtn.getAttribute("aria-expanded") !== "true") return;
      var items = [menuBtn].concat(Array.prototype.slice.call(menu.querySelectorAll("a")));
      var firstEl = items[0],
        lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    });
    window.addEventListener("resize", function () {
      if (!isMobileNav() && menuBtn.getAttribute("aria-expanded") === "true") closeMenu(false);
    });
  }

  /* Split headline word indexes */
  document.querySelectorAll(".split").forEach(function (el) {
    var words = el.querySelectorAll(".w > span");
    words.forEach(function (w, i) {
      w.style.setProperty("--i", i);
    });
    el.parentElement.style.setProperty("--words", words.length);
  });

  /* Reveal on scroll. Only content outside the first screen is ever hidden. */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
  document.querySelectorAll("[data-stagger]").forEach(function (group) {
    var step = parseFloat(group.getAttribute("data-stagger")) || 0.09;
    Array.prototype.forEach.call(group.children, function (child, i) {
      child.style.setProperty("--d", (i * step).toFixed(2) + "s");
    });
  });
  var io = null;
  function revealAll() {
    revealEls.forEach(function (el) {
      el.classList.remove("is-pending");
    });
    if (io) io.disconnect();
  }
  if ("IntersectionObserver" in window && motionOn()) {
    io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.remove("is-pending");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    var vh = window.innerHeight || document.documentElement.clientHeight;
    revealEls.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.92) return;
      el.classList.add("is-pending");
      io.observe(el);
    });
  }
  /* Anything reached by keyboard or find in page shows at once */
  document.addEventListener("focusin", function (e) {
    var el = e.target.closest && e.target.closest(".is-pending");
    if (!el) return;
    el.style.transition = "none";
    el.classList.remove("is-pending");
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        el.style.transition = "";
      });
    });
  });

  /* Count up numbers. The real value stays in the page for screen readers. */
  var counters = Array.prototype.slice.call(document.querySelectorAll("[data-count]"));
  function settleCounters() {
    counters.forEach(function (el) {
      el.textContent = el.getAttribute("data-count") + (el.getAttribute("data-suffix") || "");
    });
  }
  if ("IntersectionObserver" in window && motionOn() && counters.length) {
    var cio = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          cio.unobserve(entry.target);
          var el = entry.target;
          var to = parseFloat(el.getAttribute("data-count"));
          var from = parseFloat(el.getAttribute("data-from") || "0");
          var suffix = el.getAttribute("data-suffix") || "";
          var start = null,
            dur = 1700;
          function tick(t) {
            if (!motionOn()) {
              el.textContent = to + suffix;
              return;
            }
            if (start === null) start = t;
            var p = Math.min((t - start) / dur, 1);
            var eased = 1 - Math.pow(1 - p, 4);
            el.textContent = Math.round(from + (to - from) * eased) + suffix;
            if (p < 1) requestAnimationFrame(tick);
          }
          el.textContent = from + suffix;
          requestAnimationFrame(tick);
        });
      },
      { threshold: 0.6 },
    );
    counters.forEach(function (el) {
      cio.observe(el);
    });
  }

  /* Scroll linked effects: progress bar, header state, tickers, parallax, statement highlight */
  var progress = document.querySelector(".progress span");
  var tickers = Array.prototype.slice.call(document.querySelectorAll(".ticker"));
  var parallax = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));
  var orbits = Array.prototype.slice.call(document.querySelectorAll(".orbit"));
  var statements = Array.prototype.slice.call(document.querySelectorAll(".statement.is-scrub"));
  statements.forEach(function (st) {
    st._words = st.querySelectorAll(".sw");
  });
  var ticking = false;

  function resetScrollEffects() {
    tickers.forEach(function (t) {
      t.querySelectorAll(".ticker-row").forEach(function (row) {
        row.style.transform = "";
      });
    });
    parallax.forEach(function (el) {
      el.style.transform = "";
    });
    orbits.forEach(function (el) {
      el.style.transform = "";
    });
    statements.forEach(function (st) {
      st._words.forEach(function (w) {
        w.classList.add("on");
      });
    });
  }

  function update() {
    ticking = false;
    var y = window.scrollY || window.pageYOffset;
    var vh = window.innerHeight;
    var docH = document.documentElement.scrollHeight - vh;
    if (progress) progress.style.setProperty("--p", docH > 0 ? (y / docH).toFixed(4) : 0);
    if (header) header.classList.toggle("is-scrolled", y > 8);
    if (!motionOn()) return;

    tickers.forEach(function (t) {
      var r = t.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      var p = (vh - r.top) / (vh + r.height);
      t.querySelectorAll(".ticker-row").forEach(function (row, i) {
        var dir = i % 2 === 0 ? -1 : 1;
        var span = row.scrollWidth / 2;
        var x = dir === -1 ? -p * span * 0.55 : -span * 0.55 + p * span * 0.55;
        row.style.transform = "translate3d(" + x.toFixed(1) + "px,0,0)";
      });
    });

    parallax.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      var f = parseFloat(el.getAttribute("data-parallax")) || 0.1;
      var off = (r.top + r.height / 2 - vh / 2) * f;
      el.style.transform = "translate3d(0," + (-off).toFixed(1) + "px,0)";
    });

    orbits.forEach(function (el) {
      el.style.transform = "rotate(" + (y * 0.06).toFixed(2) + "deg)";
    });

    statements.forEach(function (st) {
      var r = st.getBoundingClientRect();
      var p = (vh * 0.85 - r.top) / (r.height + vh * 0.35);
      p = Math.max(0, Math.min(1, p));
      var lit = Math.round(p * st._words.length);
      st._words.forEach(function (w, i) {
        w.classList.toggle("on", i < lit);
      });
    });
  }
  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();

  /* Soft spotlight that follows the pointer on navy bands and the home hero */
  document.querySelectorAll(".band, .hero").forEach(function (band) {
    band.addEventListener("pointermove", function (e) {
      if (!motionOn()) return;
      var r = band.getBoundingClientRect();
      band.style.setProperty("--mx", (((e.clientX - r.left) / r.width) * 100).toFixed(1) + "%");
      band.style.setProperty("--my", (((e.clientY - r.top) / r.height) * 100).toFixed(1) + "%");
    });
  });

  /* Footer year */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* Accessible forms: inline errors, error summary, status message */
  var errIcon =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5h.01" stroke-linecap="round"/></svg>';

  function fieldWrap(el) {
    return el.closest(".field");
  }

  function setError(control, message) {
    var wrap = fieldWrap(control);
    var id = (control.id || control.getAttribute("data-name")) + "-error";
    var target = wrap.tagName === "FIELDSET" ? wrap : control;
    var existing = document.getElementById(id);
    if (!message) {
      if (existing) existing.remove();
      target.removeAttribute("aria-invalid");
      var db = (target.getAttribute("aria-describedby") || "").split(" ").filter(function (t) {
        return t && t !== id;
      });
      if (db.length) target.setAttribute("aria-describedby", db.join(" "));
      else target.removeAttribute("aria-describedby");
      return;
    }
    if (!existing) {
      existing = document.createElement("p");
      existing.className = "error";
      existing.id = id;
      var anchor = wrap.querySelector(".hint") || wrap.querySelector("label, legend");
      if (wrap.tagName === "FIELDSET") wrap.querySelector("legend").insertAdjacentElement("afterend", existing);
      else anchor.insertAdjacentElement("afterend", existing);
    }
    existing.innerHTML = errIcon + "<span>" + message + "</span>";
    target.setAttribute("aria-invalid", "true");
    var ids = (target.getAttribute("aria-describedby") || "").split(" ").filter(Boolean);
    if (ids.indexOf(id) === -1) ids.unshift(id);
    target.setAttribute("aria-describedby", ids.join(" "));
  }

  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function digits(v) {
    return (v || "").replace(/\D/g, "");
  }

  function messageFor(form, control) {
    var rule = control.getAttribute("data-validate");
    var label = control.getAttribute("data-label");
    var custom = control.getAttribute("data-error");
    if (rule === "radio") {
      var name = control.getAttribute("data-name");
      return form.querySelector('input[name="' + name + '"]:checked')
        ? ""
        : custom || "Choose an option for " + label.toLowerCase() + ".";
    }
    var v = control.value.trim();
    if (control.hasAttribute("required") && !v) return custom || "Enter your " + label.toLowerCase() + ".";
    if (v && rule === "email" && !emailRe.test(v)) return "Enter an email address in the format name@example.com.";
    if (v && rule === "tel" && digits(v).length < 10) return "Enter a 10 digit phone number with area code.";
    return "";
  }

  function validate(form) {
    var problems = [];
    form.querySelectorAll("[data-validate]").forEach(function (control) {
      var msg = messageFor(form, control);
      setError(control, msg);
      if (msg) problems.push({ control: control, msg: msg });
    });
    return problems;
  }

  document.querySelectorAll("form[data-accessible-form]").forEach(function (form) {
    var summary = form.querySelector(".error-summary");
    var success = document.getElementById(form.getAttribute("data-success"));

    /* After a failed submit, fix messages as people correct each field */
    form.querySelectorAll("[data-validate]").forEach(function (control) {
      if (control.getAttribute("data-validate") === "radio") {
        control.querySelectorAll("input").forEach(function (r) {
          r.addEventListener("change", function () {
            if (control.hasAttribute("aria-invalid")) setError(control, "");
          });
        });
      } else {
        control.addEventListener("blur", function () {
          if (control.hasAttribute("aria-invalid")) setError(control, messageFor(form, control));
        });
      }
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var problems = validate(form);
      if (problems.length) {
        var list = problems
          .map(function (p) {
            var focusId = p.control.tagName === "FIELDSET" ? p.control.querySelector("input").id : p.control.id;
            return '<li><a href="#' + focusId + '">' + p.msg + "</a></li>";
          })
          .join("");
        summary.innerHTML =
          "<h2>There " +
          (problems.length === 1 ? "is 1 problem" : "are " + problems.length + " problems") +
          " with this form</h2><ul>" +
          list +
          "</ul>";
        summary.hidden = false;
        summary.focus();
        summary.querySelectorAll("a").forEach(function (a) {
          a.addEventListener("click", function (ev) {
            ev.preventDefault();
            var t = document.getElementById(a.getAttribute("href").slice(1));
            if (t) {
              t.focus();
              t.scrollIntoView({ block: "center", behavior: motionOn() ? "smooth" : "auto" });
            }
          });
        });
        return;
      }
      summary.hidden = true;
      summary.innerHTML = "";

      /* Connect a form backend here, such as a HIPAA appropriate form service or your own endpoint.
         This preview only confirms on screen and sends nothing. */
      var nameField = form.querySelector("[autocomplete='name']");
      var first = nameField ? nameField.value.trim().split(" ")[0] : "";
      if (success) {
        var nameSlot = success.querySelector("[data-first-name]");
        if (nameSlot) nameSlot.textContent = first ? ", " + first : "";
        form.hidden = true;
        success.hidden = false;
        var heading = success.querySelector("h2");
        heading.setAttribute("tabindex", "-1");
        heading.focus();
      }
    });
  });

  document.querySelectorAll("[data-reset-form]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var form = document.getElementById(btn.getAttribute("data-reset-form"));
      var success = btn.closest(".form-success");
      form.reset();
      success.hidden = true;
      form.hidden = false;
      var firstField = form.querySelector("input, textarea");
      if (firstField) firstField.focus();
    });
  });
})();
