import { getGarmentThumbnailUri, renderEditorialLookUri } from '../engine/garmentEngine.js';
import { getState } from '../state/store.js';
import { escapeHtml, formatRupiah } from '../utils/format.js';

export function parseLookId(raw) {
  return /^\d+$/.test(String(raw)) ? Number(raw) : String(raw);
}

/**
 * Render a reusable Lookbook card with clean unboxed metadata.
 * @param {any} look
 * @returns {string}
 */
export function renderLookCard(look) {
  const { favs } = getState();
  const isSaved = favs.includes(look.id);
  const src = renderEditorialLookUri(look);

  return `
    <article class="look-card" data-look-id="${escapeHtml(String(look.id))}">
      <div class="ornate-frame">
        <div class="look-media">
          <img loading="lazy" src="${src}" alt="${escapeHtml(look.name)}" />
          <button
            type="button"
            class="heart-btn ${isSaved ? 'is-saved' : ''}"
            data-toggle-fav="${escapeHtml(String(look.id))}"
            aria-label="${isSaved ? 'Hapus dari favorites' : 'Simpan look ke favorites'}"
            aria-pressed="${isSaved ? 'true' : 'false'}"
          >${isSaved ? '♥' : '♡'}</button>
        </div>
      </div>
      <div class="look-kicker">${escapeHtml(look.type)}${look.isCloud ? ' · Curated' : ''}</div>
      <h3>${escapeHtml(look.name)}</h3>
      <p class="look-desc">${escapeHtml(look.desc)}</p>
      <div class="look-footer">
        <strong class="tabular-nums">${formatRupiah(look.budget)}</strong>
        <span>View look</span>
      </div>
    </article>
  `;
}

/**
 * Render a compact Garment Item card used in New Arrivals and Wishlist.
 * @param {import('../data/catalog.js').ITEMS[number]} item
 * @returns {string}
 */
export function renderGarmentTile(item) {
  const { wish, colorIndexByItem } = getState();
  const isWished = wish.includes(item.id);
  const src = getGarmentThumbnailUri(item.id, colorIndexByItem[item.id] || 0);

  return `
    <article class="item-card" data-try-item="${item.id}">
      <div class="ornate-frame">
        <img src="${src}" alt="${escapeHtml(item.name)}" />
      </div>
      <button
        type="button"
        class="wish-btn ${isWished ? 'is-saved' : ''}"
        data-toggle-wish="${item.id}"
        aria-label="${isWished ? 'Hapus dari wishlist' : 'Simpan ke wishlist'}"
        aria-pressed="${isWished ? 'true' : 'false'}"
      >${isWished ? '♥' : '♡'}</button>
      <div class="item-card-meta">
        <strong>${escapeHtml(item.name)}</strong>
        <div class="item-card-price-row">
          <span class="tabular-nums">${formatRupiah(item.price)}</span>
          <button
            type="button"
            class="mini-bag-btn"
            data-add-cart="${item.id}"
            aria-label="Tambah ${escapeHtml(item.name)} ke tas belanja"
          >+ Tas</button>
        </div>
      </div>
    </article>
  `;
}
