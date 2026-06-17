// ── Delete Series Menu ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  var toggle = document.getElementById('delete-series-toggle');
  var menu = document.getElementById('delete-series-menu');
  if (toggle && menu) {
    toggle.addEventListener('click', function(e) {
      e.stopPropagation();
      menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    });
    document.addEventListener('click', function(e) {
      if (!menu.contains(e.target) && e.target !== toggle) {
        menu.style.display = 'none';
      }
    });
  }
});

// ── Participant Assignment Dropdown ────────────────────────────
function openAssignDropdown() {
  document.getElementById('assign-dropdown').classList.add('open');
}

function filterAssignDropdown(q) {
  q = q.toLowerCase();
  var dd = document.getElementById('assign-dropdown');
  dd.classList.add('open');
  dd.querySelectorAll('.custom-select-option').forEach(function(el) {
    var name = (el.getAttribute('data-name') || '').toLowerCase();
    el.style.display = name.indexOf(q) >= 0 ? '' : 'none';
  });
}

function selectAssignUser(el) {
  document.getElementById('assign-user-id').value = el.getAttribute('data-value');
  document.getElementById('assign-search').value = el.getAttribute('data-name');
  document.getElementById('assign-dropdown').classList.remove('open');
}

document.addEventListener('click', function(e) {
  var wrap = document.querySelector('.custom-select-wrap');
  if (wrap && !wrap.contains(e.target)) {
    var dd = document.getElementById('assign-dropdown');
    if (dd) dd.classList.remove('open');
  }
});
