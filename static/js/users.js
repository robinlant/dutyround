function filterUsers(q) {
  q = q.toLowerCase();
  document.querySelectorAll('.user-list-item').forEach(function(el) {
    var name = (el.getAttribute('data-name') || '').toLowerCase();
    var email = (el.getAttribute('data-email') || '').toLowerCase();
    el.style.display = (name.indexOf(q) >= 0 || email.indexOf(q) >= 0) ? '' : 'none';
  });
}
function selectRole(el) {
  document.getElementById('role-input').value = el.getAttribute('data-value');
  document.getElementById('role-search').value = el.getAttribute('data-name');
  document.getElementById('role-dropdown').classList.remove('open');
}
document.addEventListener('click', function(e) {
  var dd = document.getElementById('role-dropdown');
  var wrap = dd ? dd.closest('.custom-select-wrap') : null;
  if (wrap && !wrap.contains(e.target)) {
    dd.classList.remove('open');
  }
});
