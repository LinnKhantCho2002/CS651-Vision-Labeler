export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

const demoNotice = '<aside class="demo-notice" role="note"><strong>Offline demo.</strong> Labels are simulated fixtures. No image is sent to Google.</aside>';

function layout(title, content, { demo = false } = {}) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} · Vision Labeler</title><link rel="stylesheet" href="/styles.css"><script src="/app.js" defer></script></head>
<body><div class="shell"><header class="site-header"><a class="brand" href="/" aria-label="Vision Labeler home"><span class="brand-icon" aria-hidden="true">◈</span> Vision Labeler</a><span class="course-tag">CS651 · CLOUD COMPUTING</span></header>
<main id="main">${demo ? demoNotice : ''}${content}</main>
<footer><span>Node.js + Express + Google Cloud Vision</span><span>Classroom project · ${demo ? 'Local demo' : 'Label detection'}</span></footer></div></body></html>`;
}

export function homePage({ demo = false } = {}) {
  return layout('Upload an image', `
<section class="intro"><p class="eyebrow">FROM PIXELS TO POSSIBILITIES</p><h1>Discover what's<br>in your image.</h1><p class="lead">Upload a photo and explore the objects, scenes, and ideas that Google Cloud Vision detects.</p></section>
<section class="workspace" aria-label="Image upload">
<div class="upload-card"><div class="card-heading"><span class="step">01</span><div><h2>Choose your image</h2><p>JPEG, PNG, or WebP · up to 5 MiB · 25 megapixels</p></div></div>
<form action="/analyze" method="post" enctype="multipart/form-data" id="upload-form">
<div class="file-zone"><span class="upload-icon" aria-hidden="true">↑</span><label for="image">Select an image from your device</label><p>Choose a clear photo with a few recognizable subjects.</p><input id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp" required aria-describedby="file-help"><p id="file-help" class="hint">Your image is processed in memory, not saved by this app.</p></div>
<div id="preview" class="preview" hidden><img id="preview-image" alt="Preview of selected image"><p id="preview-name"></p></div>
<label class="consent"><input name="consent" type="checkbox" value="yes" required><span>${demo ? 'I understand this demo returns sample labels and does not call Google.' : 'I agree to send this image to Google Cloud Vision for label detection. I have permission to use this image.'}</span></label>
<p class="privacy">Use non-sensitive images. Avoid IDs, medical images, or private photos. ${demo ? 'Demo results are not evidence of a live Cloud Vision integration.' : 'Google processes the image under its service terms and privacy policies.'}</p>
<p id="client-error" class="client-error" role="alert" hidden></p><button type="submit" class="button" id="analyze-button">Analyze image <span aria-hidden="true">↗</span></button>
</form></div>
<aside class="guide"><div class="guide-top"><span class="small-label">HOW IT WORKS</span><h2>A small upload.<br>A new perspective.</h2></div><ol><li><span>01</span><div><strong>Upload</strong><p>Your browser sends the image to our Express server.</p></div></li><li><span>02</span><div><strong>Analyze</strong><p>The server validates it, then requests labels from Google Cloud Vision.</p></div></li><li><span>03</span><div><strong>Explore</strong><p>See detected labels and model confidence, returned as HTML.</p></div></li></ol><p class="guide-note">Labels are predictions, not verified facts. Confidence does not guarantee accuracy.</p></aside>
</section>`, { demo });
}

export function resultPage({ labels, filename, demo = false }) {
  const rows = labels.map((label, index) => {
    const percentage = (label.score * 100).toFixed(1);
    return `<tr><td class="rank">${String(index + 1).padStart(2, '0')}</td><th scope="row">${escapeHtml(label.description)}</th><td><div class="confidence"><meter min="0" max="1" value="${label.score}" aria-label="${escapeHtml(label.description)} confidence">${percentage}%</meter><span>${percentage}%</span></div></td></tr>`;
  }).join('');
  return layout('Image results', `<section class="result-intro"><a class="back-link" href="/">← Upload another image</a><p class="eyebrow">${demo ? 'SIMULATED RESULTS' : 'ANALYSIS COMPLETE'}</p><h1>A closer look.</h1><p class="lead">${demo ? 'Sample labels for the offline interface demonstration.' : 'Here is what Google Cloud Vision detected in your image.'}</p></section>
<section class="results-card"><div class="results-heading"><div><span class="small-label">${demo ? 'DEMO INPUT' : 'YOUR IMAGE'}</span><h2 class="filename">${escapeHtml(filename)}</h2></div><span class="count-badge">${labels.length} ${labels.length === 1 ? 'label' : 'labels'}</span></div>
${labels.length ? `<div class="table-scroll"><table><caption class="sr-only">Detected labels sorted by model confidence</caption><thead><tr><th scope="col">#</th><th scope="col">Detected label</th><th scope="col">Confidence</th></tr></thead><tbody>${rows}</tbody></table></div>` : '<div class="empty-state"><h3>No labels detected</h3><p>Try a clearer photo with a visible subject.</p></div>'}
<p class="result-note">Confidence is a model score, not a guarantee. This app does not keep your uploaded image.</p></section>`, { demo });
}

export function errorPage(message, { demo = false } = {}) {
  return layout('Unable to analyze', `<section class="error-card"><p class="eyebrow">LET'S TRY THAT AGAIN</p><h1>We couldn't analyze<br>that image.</h1><p class="lead" role="alert">${escapeHtml(message)}</p><a href="/" class="button">Choose another image <span aria-hidden="true">↗</span></a></section>`, { demo });
}
