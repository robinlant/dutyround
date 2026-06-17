// ── Theme Management ──────────────────────────────────────────
function toggleTheme() {
  var cur = document.documentElement.getAttribute('data-theme') || 'dark';
  var next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('dr-theme', next);
  updateThemeBtn();
}

function updateThemeBtn() {
  var btn = document.getElementById('theme-btn');
  if(!btn) return;
  var t = document.documentElement.getAttribute('data-theme') || 'dark';
  var src = document.getElementById(t === 'dark' ? 'icon-sun-src' : 'icon-moon-src');
  var nextLabel = btn.getAttribute(t === 'dark' ? 'data-light-label' : 'data-dark-label') || btn.getAttribute('aria-label') || '';
  if(src) btn.innerHTML = src.innerHTML;
  btn.title = nextLabel;
  btn.setAttribute('aria-label', nextLabel);
}

document.addEventListener('DOMContentLoaded', updateThemeBtn);

// ── Search Dropdown ─────────────────────────────────────────
document.addEventListener('click', function(e) {
  var wrap = document.querySelector('.search-wrap');
  if(wrap && !wrap.contains(e.target)) {
    var dd = document.getElementById('search-results');
    if(dd) dd.innerHTML = '';
  }
});

// ── Password Visibility Toggle ───────────────────────────────
document.addEventListener('pointerdown', function(e) {
  var btn = e.target.closest('[data-password-toggle]');
  if(!btn) return;
  e.preventDefault();
});

document.addEventListener('click', function(e) {
  var btn = e.target.closest('[data-password-toggle]');
  if(!btn) return;
  var wrap = btn.closest('.password-field');
  if(!wrap) return;
  var input = wrap.querySelector('input');
  if(!input) return;
  
  var nextVisible = input.type === 'password';
  var toggleText = btn.querySelector('[data-password-toggle-text]');
  var showLabel = btn.getAttribute('data-show-label') || 'Show password';
  var hideLabel = btn.getAttribute('data-hide-label') || 'Hide password';
  var showText = btn.getAttribute('data-show-text') || 'Show';
  var hideText = btn.getAttribute('data-hide-text') || 'Hide';
  
  input.type = nextVisible ? 'text' : 'password';
  wrap.classList.toggle('is-visible', nextVisible);
  btn.setAttribute('aria-pressed', nextVisible ? 'true' : 'false');
  btn.setAttribute('aria-label', nextVisible ? hideLabel : showLabel);
  btn.setAttribute('title', nextVisible ? hideLabel : showLabel);
  if(toggleText) toggleText.textContent = nextVisible ? hideText : showText;
});

// ── HTMX Error Handling ─────────────────────────────────────
document.body.addEventListener('htmx:sendError', function() {
  alert((window.DR_I18N && window.DR_I18N.networkError) || 'Network error.');
});

document.body.addEventListener('htmx:responseError', function(evt) {
  var msg = evt.detail.xhr.responseText;
  if (!msg) return;
  var area = document.getElementById('htmx-flash-area');
  if (!area) return;
  var div = document.createElement('div');
  div.className = 'flash flash-error';
  div.setAttribute('role', 'alert');
  div.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg> ' + msg + '<button class="flash-dismiss" onclick="this.parentElement.remove()" aria-label="Dismiss"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>';
  area.innerHTML = '';
  area.appendChild(div);
  setTimeout(function() { if (div.parentNode) div.remove(); }, 5000);
});
