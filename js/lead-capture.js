/**
 * Lead Capture System — coimbraservicos.pt
 *
 * Captures form submissions + WhatsApp/phone clicks, fires GA4 events,
 * and POSTs to the Google Apps Script endpoint. The Apps Script (server-side)
 * forwards to Google Sheets AND Telegram, keeping the bot token off the client.
 */

(function () {
  'use strict';

  // The Apps Script endpoint is intentionally public — it only accepts POST
  // with lead data and never returns secrets. The Telegram bot token lives
  // in Script Properties (server-side only), never in this file.
  const ENDPOINT = 'https://script.google.com/macros/s/AKfycbxBdGyG8IYSNKt_tHWk9ld3XKJkiOJu15tDvH4S7kugg5kYBWS72_HNx9csb5eRUso_/exec';

  /**
   * Main form handler
   */
  window.captureLead = function (event) {
    event.preventDefault();

    const form = event.target;
    const data = {
      id: 'lead-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Date.now().toString(36),
      timestamp: new Date().toISOString(),
      name: form.querySelector('[name="name"]').value.trim(),
      phone: form.querySelector('[name="phone"]').value.trim(),
      email: (form.querySelector('[name="email"]') || {}).value || '',
      niche: (form.querySelector('[name="niche"]') || {}).value || '',
      source_page: window.location.pathname,
      source_type: 'form',
      utm_source: getParam('utm_source') || 'direct',
      utm_medium: getParam('utm_medium') || 'none',
      status: 'new',
      icon: '🔔'
    };

    if (!data.name || !data.phone) {
      showMessage(form, 'Por favor preencha o nome e telemóvel.', 'error');
      return false;
    }

    if (!isValidPTPhone(data.phone)) {
      showMessage(form, 'Por favor insira um número de telemóvel válido.', 'error');
      return false;
    }

    if (typeof gtag === 'function') {
      gtag('event', 'generate_lead', {
        event_category: 'lead_capture',
        event_label: data.niche,
        source_page: data.source_page,
        lead_id: data.id
      });
    }

    sendToEndpoint(data);

    showMessage(form, 'Obrigado! Vamos contactá-lo em breve.', 'success');
    form.reset();

    var waLink = document.querySelector('.cta-whatsapp');
    if (waLink) {
      setTimeout(function () {
        window.open(waLink.href, '_blank');
      }, 2000);
    }

    return false;
  };

  function isValidPTPhone(phone) {
    var cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
    return /^(\+351)?9\d{8}$/.test(cleaned);
  }

  function getParam(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  function showMessage(form, text, type) {
    var existing = form.parentNode.querySelector('.form-message');
    if (existing) existing.remove();

    var msg = document.createElement('p');
    msg.className = 'form-message form-message-' + type;
    msg.textContent = text;
    msg.style.cssText = type === 'error'
      ? 'color:#dc2626;font-weight:600;margin-top:0.5rem;'
      : 'color:#16a34a;font-weight:600;margin-top:0.5rem;';
    form.parentNode.insertBefore(msg, form.nextSibling);

    if (type === 'success') {
      setTimeout(function () { msg.remove(); }, 5000);
    }
  }

  /**
   * Single backend call — Apps Script handles Sheets + Telegram fan-out.
   * `mode: no-cors` because Apps Script returns text/html and we don't
   * need to read the response.
   */
  function sendToEndpoint(data) {
    if (!ENDPOINT) return;
    fetch(ENDPOINT, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).catch(function () { /* silent fail */ });
  }

  function getNiche() {
    var parts = window.location.pathname.replace(/^\/|\/$/g, '').split('/');
    return parts[0] || 'homepage';
  }

  function buildClickLead(type, icon) {
    return {
      timestamp: new Date().toISOString(),
      name: '',
      phone: '',
      email: '',
      service: getNiche(),
      niche: getNiche(),
      page: window.location.pathname,
      source_page: window.location.pathname,
      utm_source: getParam('utm_source') || 'direct',
      utm_medium: getParam('utm_medium') || 'none',
      utm_campaign: getParam('utm_campaign') || '',
      utm_keyword: getParam('utm_keyword') || '',
      source_type: type,
      status: 'Clique ' + (type === 'tel' ? 'Tel' : 'WA'),
      icon: icon
    };
  }

  // Track phone clicks → endpoint (which forwards to Sheets + Telegram)
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href^="tel:"]');
    if (!link) return;

    var data = buildClickLead('tel', '📞');

    if (typeof gtag === 'function') {
      gtag('event', 'click_phone', { event_category: 'lead_capture', niche: data.service });
    }
    sendToEndpoint(data);
  });

  // Track WhatsApp clicks → endpoint
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href*="wa.me"]');
    if (!link) return;

    var data = buildClickLead('whatsapp', '💬');

    if (typeof gtag === 'function') {
      gtag('event', 'click_whatsapp', { event_category: 'lead_capture', niche: data.service });
    }
    sendToEndpoint(data);
  });

})();
