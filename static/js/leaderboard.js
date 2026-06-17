function validateDateRange() {
  var f = document.getElementById('lb-from'), t = document.getElementById('lb-to');
  var warn = document.getElementById('lb-date-warning');
  var exportBtn = document.getElementById('lb-export');
  var bad = f.value && t.value && f.value > t.value;
  var border = bad ? 'var(--danger)' : 'var(--border)';
  var base = 'padding:4px 10px;border-radius:20px;border:1px solid '+border+';background:var(--bg);color:var(--text);font-size:12px;font-family:inherit;outline:none';
  f.setAttribute('style', base);
  t.setAttribute('style', base);
  warn.style.display = bad ? 'inline' : 'none';
  exportBtn.style.opacity = bad ? '0.4' : '1';
  exportBtn.style.pointerEvents = bad ? 'none' : 'auto';
  if (!bad) document.getElementById('lb-form').submit();
}
