const form = document.querySelector('#upload-form');
if (form) {
  const input = document.querySelector('#image');
  const preview = document.querySelector('#preview');
  const image = document.querySelector('#preview-image');
  const name = document.querySelector('#preview-name');
  const error = document.querySelector('#client-error');
  const button = document.querySelector('#analyze-button');
  let objectUrl;
  function resetButton() { button.disabled = false; button.innerHTML = 'Analyze image <span aria-hidden="true">↗</span>'; }
  input.addEventListener('change', () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    image.removeAttribute('src');
    preview.hidden = true;
    error.hidden = true;
    input.setCustomValidity('');
    resetButton();
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      input.setCustomValidity('Choose an image up to 5 MiB.');
      error.textContent = 'That image is too large. Choose a file up to 5 MiB.';
      error.hidden = false;
      return;
    }
    objectUrl = URL.createObjectURL(file);
    image.src = objectUrl;
    name.textContent = `${file.name} · ${(file.size / 1024).toFixed(0)} KiB`;
    preview.hidden = false;
  });
  image.addEventListener('error', () => {
    preview.hidden = true;
    error.textContent = 'Preview unavailable. The server will validate your image when you submit.';
    error.hidden = false;
  });
  form.addEventListener('submit', () => { button.disabled = true; button.textContent = 'Analyzing image…'; });
  // A browser's back/forward cache can preserve a disabled submit button.
  window.addEventListener('pageshow', resetButton);
}
