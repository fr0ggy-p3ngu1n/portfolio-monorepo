// Click a colour swatch to copy its hex value. Lives in its own file because
// the site's CSP doesn't allow inline scripts.
const status = document.getElementById('copy-status');
document.querySelectorAll('.swatch').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const hex = btn.dataset.copy || '';
    const label = btn.querySelector('.hex');
    try {
      await navigator.clipboard.writeText(hex);
      if (label) label.textContent = 'Copied';
      if (status) status.textContent = `${hex} copied`;
      setTimeout(() => { if (label) label.textContent = hex; }, 1200);
    } catch {
      if (status) status.textContent = `Couldn't copy. The value is ${hex}`;
    }
  });
});
