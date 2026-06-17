// ── Group dropdown ──────────────────────────────────────────
function openGroupDropdown() {
  document.getElementById('group-dropdown').classList.add('open');
}
function filterGroupDropdown(q) {
  q = q.toLowerCase();
  var dd = document.getElementById('group-dropdown');
  dd.classList.add('open');
  dd.querySelectorAll('.custom-select-option').forEach(function(el) {
    var name = (el.getAttribute('data-name') || '').toLowerCase();
    if (!el.getAttribute('data-value')) { el.style.display = ''; return; }
    el.style.display = name.indexOf(q) >= 0 ? '' : 'none';
  });
}
function selectGroup(el) {
  document.getElementById('group-id-input').value = el.getAttribute('data-value');
  document.getElementById('group-search').value = el.getAttribute('data-name');
  document.getElementById('group-dropdown').classList.remove('open');
}

// ── Copy-from dropdown ───────────────────────────────────────
function openCopyDropdown() {
  var dd = document.getElementById('copy-dropdown');
  if (dd) dd.classList.add('open');
}
function filterCopyDropdown(q) {
  q = q.toLowerCase();
  var dd = document.getElementById('copy-dropdown');
  if (!dd) return;
  dd.classList.add('open');
  dd.querySelectorAll('.copy-opt').forEach(function(el) {
    var name = (el.getAttribute('data-name') || '').toLowerCase();
    if (!el.getAttribute('data-name')) { el.style.display = ''; return; }
    el.style.display = name.indexOf(q) >= 0 ? '' : 'none';
  });
}
function selectCopy(el) {
  var title   = el.getAttribute('data-title')    || '';
  var desc    = el.getAttribute('data-desc')     || '';
  var time    = el.getAttribute('data-time')     || '';
  var min     = el.getAttribute('data-min')      || '';
  var max     = el.getAttribute('data-max')      || '';
  var groupId = el.getAttribute('data-group-id') || '';
  var allowOverLimit = el.getAttribute('data-allow-over-limit') || '';

  if (title) document.getElementById('occ-title').value = title;
  if (desc !== null) document.getElementById('occ-desc').value = desc;
  if (min)   document.getElementById('occ-min').value = min;
  if (max)   document.getElementById('occ-max').value = max;
  if (min || max) syncMinMax();

  // Populate group field
  var groupOpt = document.querySelector('#group-dropdown .custom-select-option[data-value="' + groupId + '"]');
  if (groupOpt) {
    selectGroup(groupOpt);
  } else {
    // No matching group (or none) — clear the group selection
    document.getElementById('group-id-input').value = '';
    document.getElementById('group-search').value = '';
  }

  // Replace just the time portion of the current date value
  if (time) {
    var dateEl = document.getElementById('occ-date');
    var current = dateEl.value; // "2006-01-02T15:04"
    var datePart = current ? current.split('T')[0] : '';
    if (datePart) {
      dateEl.value = datePart + 'T' + time;
    }
  }

  var overLimitEl = document.getElementById('occ-over-limit');
  if (overLimitEl) overLimitEl.checked = (allowOverLimit === 'true');

  document.getElementById('copy-search').value = title;
  document.getElementById('copy-dropdown').classList.remove('open');
}

// ── Repeat / Until toggle ────────────────────────────────────
function toggleRepeatUntil() {
  var sel = document.getElementById('occ-repeat');
  var grp = document.getElementById('repeat-until-group');
  if (!sel || !grp) return;
  grp.style.display = sel.value ? '' : 'none';
  if (sel.value) {
    var untilEl = document.getElementById('occ-repeat-until');
    if (untilEl && !untilEl.value) {
      // Default to 3 months from date
      var dateEl = document.getElementById('occ-date');
      if (dateEl && dateEl.value) {
        var d = new Date(dateEl.value);
        d.setMonth(d.getMonth() + 3);
        untilEl.value = d.toISOString().split('T')[0];
      }
    }
  }
}

// ── Min/Max cross-validation ─────────────────────────────────
function syncMinMax() {
  var minEl = document.getElementById('occ-min');
  var maxEl = document.getElementById('occ-max');
  var minVal = parseInt(minEl.value) || 1;
  var maxVal = parseInt(maxEl.value) || 1;
  // Keep max >= min
  maxEl.min = minVal;
  if (maxVal < minVal) { maxEl.value = minVal; }
  // Keep min <= max
  minEl.max = parseInt(maxEl.value) || 1;
}
// Initialise constraints on load
document.addEventListener('DOMContentLoaded', function() {
  syncMinMax();
  // Warn when a past date is selected on create form
  var dateEl = document.getElementById('occ-date');
  if (dateEl && dateEl.dataset.warnPast) {
    var warning = document.getElementById('past-date-warning');
    function checkPastDate() {
      if (!dateEl.value) { warning.style.display = 'none'; return; }
      var selected = new Date(dateEl.value);
      warning.style.display = selected < new Date() ? 'block' : 'none';
    }
    dateEl.addEventListener('change', checkPastDate);
    checkPastDate();
  }
});

// ── Keyboard navigation for dropdowns ────────────────────────
function setupKeyboardNav(inputId, dropdownId, selectFn) {
  var input = document.getElementById(inputId);
  if (!input) return;
  input.addEventListener('keydown', function(e) {
    var dd = document.getElementById(dropdownId);
    if (!dd || !dd.classList.contains('open')) return;
    var items = Array.from(dd.querySelectorAll('.custom-select-option')).filter(function(el) {
      return el.style.display !== 'none';
    });
    if (!items.length) return;
    var active = dd.querySelector('.custom-select-option.kb-active');
    var idx = active ? items.indexOf(active) : -1;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (active) active.classList.remove('kb-active');
      idx = (idx + 1) % items.length;
      items[idx].classList.add('kb-active');
      items[idx].scrollIntoView({block:'nearest'});
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (active) active.classList.remove('kb-active');
      idx = idx <= 0 ? items.length - 1 : idx - 1;
      items[idx].classList.add('kb-active');
      items[idx].scrollIntoView({block:'nearest'});
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (active) { selectFn(active); }
      else if (items.length) { selectFn(items[0]); }
    } else if (e.key === 'Escape') {
      dd.classList.remove('open');
    }
  });
}
document.addEventListener('DOMContentLoaded', function() {
  setupKeyboardNav('copy-search', 'copy-dropdown', selectCopy);
  setupKeyboardNav('group-search', 'group-dropdown', selectGroup);
});

// ── Close dropdowns on outside click ────────────────────────
document.addEventListener('click', function(e) {
  var groupSearch = document.getElementById('group-search');
  var groupDD = document.getElementById('group-dropdown');
  if (groupSearch && groupDD &&
      !groupSearch.contains(e.target) && !groupDD.contains(e.target)) {
    groupDD.classList.remove('open');
  }
  var copySearch = document.getElementById('copy-search');
  var copyDD = document.getElementById('copy-dropdown');
  if (copySearch && copyDD &&
      !copySearch.contains(e.target) && !copyDD.contains(e.target)) {
    copyDD.classList.remove('open');
  }
});
