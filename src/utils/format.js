const HTML_ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

let toastTimer = null;

/**
 * Format numeric price into Indonesian Rupiah currency string.
 * @param {number} amount
 * @returns {string}
 */
export function formatRupiah(amount) {
  return `Rp ${Number(amount || 0).toLocaleString('id-ID')}`;
}

/**
 * Escape untrusted strings before inserting into HTML templates.
 * @param {string} value
 * @returns {string}
 */
export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => HTML_ESCAPE_MAP[ch]);
}

/**
 * Convert raw SVG markup into a UTF-8 data URI.
 * @param {string} svgMarkup
 * @returns {string}
 */
export function svgToDataUri(svgMarkup) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`;
}

/**
 * Display a temporary status notification in the global toast region.
 * @param {string} message
 */
export function showToast(message) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.remove('is-visible');
  }, 2200);
}
