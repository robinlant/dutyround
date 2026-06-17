function toggleColorPicker(btn) {
  var dd = btn.nextElementSibling;
  var wasOpen = dd.classList.contains('open');
  // Close all open pickers first
  document.querySelectorAll('.color-pick-dropdown.open').forEach(function(d) {
    d.classList.remove('open');
  });
  if (!wasOpen) dd.classList.add('open');
}

function pickCreateColor(swatch, color) {
  var wrap = swatch.closest('.color-pick-wrap');
  var preview = wrap.querySelector('.color-pick-preview');
  preview.style.background = 'var(--group-' + color + ')';
  preview.setAttribute('data-color', color);
  wrap.querySelector('.color-pick-dropdown').classList.remove('open');
}

// Close picker on outside click
document.addEventListener('click', function(e) {
  if (!e.target.closest('.color-pick-wrap')) {
    document.querySelectorAll('.color-pick-dropdown.open').forEach(function(d) {
      d.classList.remove('open');
    });
  }
});
