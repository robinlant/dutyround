(function() {
  var STORAGE_KEY = 'dr-occ-view';
  var listView = document.querySelector('.occ-list-view');
  var cardGrid = document.querySelector('.occ-card-grid');
  var buttons  = document.querySelectorAll('.occ-view-btn');

  if (!listView || !cardGrid || !buttons.length) return;

  function setView(mode) {
    if (mode === 'card') {
      listView.style.display = 'none';
      cardGrid.style.display = '';
    } else {
      listView.style.display = '';
      cardGrid.style.display = 'none';
      mode = 'list';
    }
    buttons.forEach(function(btn) {
      var active = btn.getAttribute('data-view') === mode;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    try { localStorage.setItem(STORAGE_KEY, mode); } catch(e) {}
  }

  buttons.forEach(function(btn) {
    btn.addEventListener('click', function() {
      setView(btn.getAttribute('data-view'));
    });
  });

  // Restore saved preference
  var saved = 'list';
  try { saved = localStorage.getItem(STORAGE_KEY) || 'list'; } catch(e) {}
  setView(saved);
})();
