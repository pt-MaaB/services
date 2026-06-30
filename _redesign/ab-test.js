/**
 * Lightweight A/B harness — coimbraservicos.pt
 * ------------------------------------------------------------------
 * Zero-dependency, no build tooling, no server. Designed for the
 * static rank-and-rent landers.
 *
 * HOW IT WORKS
 *  1. Loaded SYNCHRONOUSLY in <head>, immediately AFTER the gtag stub
 *     (so it can wrap gtag) and BEFORE <body> paints (so there is no
 *     flash of the wrong variant).
 *  2. For every ACTIVE experiment it assigns the visitor a variant
 *     (uniform random, sticky via localStorage), writes it to
 *     <html data-ab-{exp}="{variant}">, and injects CSS that hides the
 *     non-active variant blocks. Variant content lives in the HTML as
 *     plain elements tagged  data-ab-when="{exp}:{variant}"  — CSS shows
 *     only the active one. No text-swap JS, so no FOUC.
 *  3. It wraps window.gtag so EVERY GA4 event (click_phone,
 *     click_whatsapp, generate_lead, ...) is auto-tagged with the active
 *     variants (ab_{exp}={variant}). You read results in GA4 by adding
 *     those as custom dimensions — no per-button edits needed.
 *  4. Fires one experiment_impression event per experiment per session
 *     (the denominator for conversion-rate per variant).
 *
 * TO ADD A VARIANT TO A PAGE
 *   <span data-ab-when="cta_copy:control">+351 911 937 182</span>
 *   <span data-ab-when="cta_copy:concern">Ligar agora — técnico em 45 min</span>
 *
 * TURNING TESTS ON/OFF
 *   Edit EXPERIMENTS below. Only experiments with active:true are
 *   assigned. On low-traffic pages run ONE at a time (see test plan).
 */
(function () {
  'use strict';

  /* ── Experiment registry ─────────────────────────────────────────
     variants[0] is the control. Keep 2 variants for low traffic. */
  var EXPERIMENTS = {
    cta_copy: { active: true,  variants: ['control', 'concern'] },
    channel:  { active: false, variants: ['phone', 'whatsapp'] },
    hero:     { active: false, variants: ['long', 'short'] }
  };

  var STORE_PREFIX = 'ab.';
  var html = document.documentElement;
  var assigned = {};

  function pick(variants) {
    return variants[Math.floor(Math.random() * variants.length)];
  }

  function variantFor(id, cfg) {
    var key = STORE_PREFIX + id;
    var v;
    try { v = localStorage.getItem(key); } catch (e) { v = null; }
    if (!v || cfg.variants.indexOf(v) === -1) {
      v = pick(cfg.variants);
      try { localStorage.setItem(key, v); } catch (e) {}
    }
    return v;
  }

  /* ── Assign + write html attrs + inject hide-CSS (pre-paint) ─────── */
  var css = '';
  Object.keys(EXPERIMENTS).forEach(function (id) {
    var cfg = EXPERIMENTS[id];
    if (!cfg.active) return;
    var v = variantFor(id, cfg);
    assigned[id] = v;
    html.setAttribute('data-ab-' + id, v);
    cfg.variants.forEach(function (variant) {
      // hide this variant's blocks whenever it is NOT the active one
      css += 'html:not([data-ab-' + id + '="' + variant + '"]) [data-ab-when="' + id + ':' + variant + '"]{display:none !important}';
    });
  });
  if (css) {
    var style = document.createElement('style');
    style.id = 'ab-style';
    style.textContent = css;
    (document.head || html).appendChild(style);
  }

  /* ── Params merged into every GA4 event ─────────────────────────── */
  function abParams() {
    var p = {};
    Object.keys(assigned).forEach(function (id) { p['ab_' + id] = assigned[id]; });
    return p;
  }

  /* ── Wrap gtag so all events carry the active variants ──────────── */
  var _gtag = window.gtag;
  if (typeof _gtag === 'function') {
    window.gtag = function () {
      var args = Array.prototype.slice.call(arguments);
      if (args[0] === 'event') {
        if (typeof args[2] !== 'object' || args[2] === null) args[2] = {};
        var ab = abParams();
        for (var k in ab) if (!(k in args[2])) args[2][k] = ab[k];
      }
      return _gtag.apply(this, args);
    };
  }

  /* ── Public API (lead-capture.js can read this for Sheet attribution) */
  window.AB = {
    variants: function () { return abParams(); },
    get: function (id) { return assigned[id] || null; }
  };

  /* ── One impression per experiment per session ──────────────────── */
  function fireImpressions() {
    Object.keys(assigned).forEach(function (id) {
      var sk = 'ab_imp.' + id + '.' + assigned[id];
      var seen;
      try { seen = sessionStorage.getItem(sk); } catch (e) { seen = '1'; }
      if (seen) return;
      try { sessionStorage.setItem(sk, '1'); } catch (e) {}
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'experiment_impression', { exp_id: id, variant: assigned[id] });
      }
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fireImpressions);
  } else {
    fireImpressions();
  }
})();
