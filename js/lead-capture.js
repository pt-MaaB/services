/**
 * Lead Capture System — coimbraservicos.pt
 * Captures form submissions, fires GA4 events, sends to Google Sheets + Telegram
 */

(function () {
  'use strict';

  // Config
  const TELEGRAM_BOT_TOKEN = '8540837308:AAHaP8eFN68V9KjLlaouiE0xOZbmVUPKSpY';
  const TELEGRAM_CHAT_ID = '1047779502';
  const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbxBdGyG8IYSNKt_tHWk9ld3XKJkiOJu15tDvH4S7kugg5kYBWS72_HNx9csb5eRUso_/exec';

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
      status: 'new'
    };

    // Validate
    if (!data.name || !data.phone) {
      showMessage(form, 'Por favor preencha o nome e telemóvel.', 'error');
      return false;
    }

    if (!isValidPTPhone(data.phone)) {
      showMessage(form, 'Por favor insira um número de telemóvel válido.', 'error');
      return false;
    }

    // Fire GA4 event
    if (typeof gtag === 'function') {
      gtag('event', 'generate_lead', {
        event_category: 'lead_capture',
        event_label: data.niche,
        source_page: data.source_page,
        lead_id: data.id
      });
    }

    // Send to all backends
    sendToGoogleSheets(data);
    sendToTelegram(data);

    // Show success
    showMessage(form, 'Obrigado! Vamos contactá-lo em breve.', 'success');
    form.reset();

    // Redirect to WhatsApp after 2 seconds
    var waLink = document.querySelector('.cta-whatsapp');
    if (waLink) {
      setTimeout(function () {
        window.open(waLink.href, '_blank');
      }, 2000);
    }

    return false;
  };

  /**
   * Validate PT phone number (9xx xxx xxx or +351 9xx xxx xxx)
   */
  function isValidPTPhone(phone) {
    var cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
    return /^(\+351)?9\d{8}$/.test(cleaned);
  }

  /**
   * Get URL parameter
   */
  function getParam(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  /**
   * Show form feedback message
   */
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
   * Send lead to Google Sheets (via Apps Script web app)
   */
  function sendToGoogleSheets(data) {
    if (!GOOGLE_SHEETS_URL) return;
    fetch(GOOGLE_SHEETS_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).catch(function () { /* silent fail */ });
  }

  /**
   * Send lead notification to Telegram
   */
  function sendToTelegram(data) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
    var text = '🔔 *Novo Lead — coimbraservicos.pt*\n\n'
      + '👤 ' + data.name + '\n'
      + '📱 ' + data.phone + '\n'
      + (data.email ? '📧 ' + data.email + '\n' : '')
      + '🔧 ' + data.niche + '\n'
      + '📄 ' + data.source_page + '\n'
      + '🕐 ' + new Date().toLocaleString('pt-PT');

    fetch('https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: text,
        parse_mode: 'Markdown'
      })
    }).catch(function () { /* silent fail */ });
  }

  /**
   * Track WhatsApp clicks as leads
   */
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href*="wa.me"]');
    if (!link) return;

    var niche = document.querySelector('[name="niche"]');
    if (typeof gtag === 'function') {
      gtag('event', 'click_whatsapp', {
        event_category: 'lead_capture',
        event_label: niche ? niche.value : 'unknown',
        source_page: window.location.pathname
      });
    }
  });

  /**
   * Track phone clicks as leads
   */
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href^="tel:"]');
    if (!link) return;

    if (typeof gtag === 'function') {
      gtag('event', 'click_phone', {
        event_category: 'lead_capture',
        source_page: window.location.pathname
      });
    }
  });

})();
