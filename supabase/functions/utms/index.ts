const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

// UTM capture script served as JavaScript
// This script captures UTM parameters from the URL and stores them in cookies
// so that sales platforms (Lowify, Hotmart, etc.) can forward them in webhook payloads.
const utmCaptureScript = `
(function() {
  'use strict';

  var COOKIE_EXPIRY_DAYS = 30;
  var UTM_PARAMS = ['utm_source', 'utm_campaign', 'utm_medium', 'utm_content', 'utm_term'];
  var EXTRA_PARAMS = ['fbclid', 'gclid', 'ttclid', 'kwclid'];
  var ALL_PARAMS = UTM_PARAMS.concat(EXTRA_PARAMS);
  var PREFIX = 'groi_';

  // Parse query string
  function getUrlParams() {
    var params = {};
    var search = window.location.search.substring(1);
    if (!search) return params;
    var pairs = search.split('&');
    for (var i = 0; i < pairs.length; i++) {
      var pair = pairs[i].split('=');
      var key = decodeURIComponent(pair[0]).toLowerCase();
      var value = pair.length > 1 ? decodeURIComponent(pair[1]) : '';
      if (value) params[key] = value;
    }
    return params;
  }

  // Cookie helpers
  function setCookie(name, value, days) {
    var expires = '';
    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = '; expires=' + date.toUTCString();
    }
    // Set with SameSite=Lax for cross-navigation persistence
    document.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=/; SameSite=Lax';
  }

  function getCookie(name) {
    var nameEQ = name + '=';
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i].trim();
      if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length));
    }
    return null;
  }

  // Get script element and its data attributes
  var scriptEl = document.currentScript || (function() {
    var scripts = document.getElementsByTagName('script');
    for (var i = scripts.length - 1; i >= 0; i--) {
      if (scripts[i].src && scripts[i].src.indexOf('utms/latest.js') !== -1) return scripts[i];
    }
    return null;
  })();

  var preventXcodSck = scriptEl && scriptEl.hasAttribute('data-gerenciaroi-prevent-xcod-sck');
  var preventSubids = scriptEl && scriptEl.hasAttribute('data-gerenciaroi-prevent-subids');
  var isCartpanda = scriptEl && scriptEl.hasAttribute('data-gerenciaroi-is-cartpanda');
  var isClickBank = scriptEl && scriptEl.hasAttribute('data-gerenciaroi-is-click-bank');
  var ignoreIframe = scriptEl && scriptEl.hasAttribute('data-gerenciaroi-ignore-iframe');
  var plusSignal = scriptEl && scriptEl.hasAttribute('data-gerenciaroi-plus-signal');

  // Skip if inside iframe and ignore-iframe is set
  if (ignoreIframe && window.self !== window.top) return;

  var urlParams = getUrlParams();
  var hasUtms = false;

  // Check if URL has any UTM params
  for (var i = 0; i < ALL_PARAMS.length; i++) {
    if (urlParams[ALL_PARAMS[i]]) {
      hasUtms = true;
      break;
    }
  }

  // If URL has UTMs, store them in cookies (overwrite existing)
  if (hasUtms) {
    for (var j = 0; j < ALL_PARAMS.length; j++) {
      var param = ALL_PARAMS[j];
      var value = urlParams[param];
      if (value) {
        // Store with prefix for our system
        setCookie(PREFIX + param, value, COOKIE_EXPIRY_DAYS);
        // Also store without prefix for platforms that read standard cookie names
        setCookie(param, value, COOKIE_EXPIRY_DAYS);
      }
    }

    // Store all UTMs as a JSON blob for easy retrieval
    var utmData = {};
    for (var k = 0; k < ALL_PARAMS.length; k++) {
      if (urlParams[ALL_PARAMS[k]]) {
        utmData[ALL_PARAMS[k]] = urlParams[ALL_PARAMS[k]];
      }
    }
    setCookie(PREFIX + 'data', JSON.stringify(utmData), COOKIE_EXPIRY_DAYS);

    // Also store in localStorage as backup
    try {
      localStorage.setItem(PREFIX + 'data', JSON.stringify(utmData));
      localStorage.setItem(PREFIX + 'timestamp', new Date().toISOString());
    } catch(e) {}
  }

  // Append UTMs to all links on the page that go to the same domain or checkout pages
  function appendUtmsToLinks() {
    var stored = {};
    for (var i = 0; i < ALL_PARAMS.length; i++) {
      var val = getCookie(PREFIX + ALL_PARAMS[i]) || getCookie(ALL_PARAMS[i]);
      if (val) stored[ALL_PARAMS[i]] = val;
    }
    if (Object.keys(stored).length === 0) return;

    var links = document.querySelectorAll('a[href]');
    for (var j = 0; j < links.length; j++) {
      var link = links[j];
      try {
        var href = link.href;
        if (!href || href.indexOf('javascript:') === 0 || href.indexOf('#') === 0) continue;

        var url = new URL(href);
        var dominated = false;

        // Append to same-domain links and common checkout domains
        if (url.hostname === window.location.hostname) dominated = true;
        if (url.hostname.indexOf('pay.') === 0) dominated = true;
        if (url.hostname.indexOf('checkout.') === 0) dominated = true;
        if (url.hostname.indexOf('go.') === 0) dominated = true;

        if (dominated) {
          var modified = false;
          for (var param in stored) {
            if (!url.searchParams.has(param)) {
              url.searchParams.set(param, stored[param]);
              modified = true;
            }
          }
          if (modified) link.href = url.toString();
        }
      } catch(e) {}
    }
  }

  // Inject UTMs into hidden form fields
  function injectIntoForms() {
    var stored = {};
    for (var i = 0; i < ALL_PARAMS.length; i++) {
      var val = getCookie(PREFIX + ALL_PARAMS[i]) || getCookie(ALL_PARAMS[i]);
      if (val) stored[ALL_PARAMS[i]] = val;
    }
    if (Object.keys(stored).length === 0) return;

    var forms = document.querySelectorAll('form');
    for (var j = 0; j < forms.length; j++) {
      var form = forms[j];
      for (var param in stored) {
        if (!form.querySelector('input[name="' + param + '"]')) {
          var input = document.createElement('input');
          input.type = 'hidden';
          input.name = param;
          input.value = stored[param];
          form.appendChild(input);
        }
      }
    }
  }

  // ---- Checkout Tracking Beacon ----
  // When installed on checkout pages, monitor email fields and send UTMs to our backend
  var webhookToken = scriptEl && scriptEl.getAttribute('data-gerenciaroi-token');
  var trackingEndpoint = scriptEl && scriptEl.getAttribute('data-gerenciaroi-endpoint');
  var beaconSent = false;

  function getStoredUtms() {
    var stored = {};
    for (var i = 0; i < ALL_PARAMS.length; i++) {
      var val = getCookie(PREFIX + ALL_PARAMS[i]) || getCookie(ALL_PARAMS[i]) || urlParams[ALL_PARAMS[i]];
      if (val) stored[ALL_PARAMS[i]] = val;
    }
    return stored;
  }

  function sendCheckoutBeacon(email) {
    if (beaconSent || !webhookToken || !trackingEndpoint || !email) return;
    var utms = getStoredUtms();
    if (Object.keys(utms).length === 0) return;

    beaconSent = true;
    var payload = JSON.stringify({
      token: webhookToken,
      email: email,
      utm_data: utms,
      page_url: window.location.href
    });

    // Use sendBeacon for reliability, fallback to fetch
    if (navigator.sendBeacon) {
      var blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon(trackingEndpoint, blob);
    } else {
      try {
        fetch(trackingEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true
        });
      } catch(e) {}
    }
  }

  function monitorEmailFields() {
    if (!webhookToken || !trackingEndpoint) return;

    // Watch all email-type inputs and common email field names
    function attachListeners() {
      var inputs = document.querySelectorAll('input[type="email"], input[name*="email"], input[name*="Email"], input[id*="email"], input[id*="Email"], input[placeholder*="email"], input[placeholder*="Email"], input[placeholder*="e-mail"]');
      for (var i = 0; i < inputs.length; i++) {
        if (inputs[i]._groiTracked) continue;
        inputs[i]._groiTracked = true;
        inputs[i].addEventListener('blur', function() {
          var val = this.value.trim();
          if (val && val.indexOf('@') > 0) {
            sendCheckoutBeacon(val);
          }
        });
        inputs[i].addEventListener('change', function() {
          var val = this.value.trim();
          if (val && val.indexOf('@') > 0) {
            sendCheckoutBeacon(val);
          }
        });
      }
    }

    attachListeners();

    // Re-attach on DOM changes (SPAs, dynamic forms)
    if (typeof MutationObserver !== 'undefined') {
      var emailObserver = new MutationObserver(function() {
        attachListeners();
      });
      emailObserver.observe(document.body, { childList: true, subtree: true });
    }
  }

  // Run on DOM ready
  function onReady() {
    appendUtmsToLinks();
    injectIntoForms();
    monitorEmailFields();

    // Watch for dynamically added links/forms
    if (typeof MutationObserver !== 'undefined') {
      var debounceTimer = null;
      var observer = new MutationObserver(function() {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function() {
          appendUtmsToLinks();
          injectIntoForms();
        }, 500);
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
})();
`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const path = url.pathname

  // Serve the script at /utms/latest.js or just /utms
  if (req.method === 'GET') {
    return new Response(utmCaptureScript, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  }

  return new Response('Method not allowed', { status: 405, headers: corsHeaders })
})
