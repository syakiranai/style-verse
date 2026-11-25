import { renderEditorialLookUri } from '../engine/garmentEngine.js';
import {
  addLookToCart,
  closeLookModal,
  getAllLooks,
  getState,
  toggleFavoriteLook,
  tryLookInStudio,
} from '../state/store.js';
import { escapeHtml, formatRupiah } from '../utils/format.js';

export function renderModal() {
  const backdrop = document.getElementById('modal-backdrop');
  const panel = document.getElementById('modal-panel');
  if (!backdrop || !panel) return;

  const { modalLookId, favs } = getState();
  if (modalLookId == null) {
    backdrop.hidden = true;
    panel.innerHTML = '';
    return;
  }

  const look = getAllLooks().find((l) => l.id === modalLookId);
  if (!look) {
    backdrop.hidden = true;
    return;
  }

  const isSaved = favs.includes(look.id);
  const src = renderEditorialLookUri(look);
  const hasShoppableSpec = Boolean(look.outfitSpec && Object.keys(look.outfitSpec).length);

  panel.innerHTML = `
    <button type="button" class="modal-close" id="modal-close-btn" aria-label="Tutup modal">✕</button>
    <div class="modal-content">
      <div class="ornate-frame">
        <img src="${src}" alt="${escapeHtml(look.name)}" />
      </div>
      <div>
        <div class="look-kicker">${escapeHtml(look.type)}</div>
        <h2 id="modal-title">${escapeHtml(look.name)}</h2>
        <p style="margin-bottom: 14px; color: var(--color-ink-muted);">${escapeHtml(look.desc)}</p>
        <strong>Outfit checklist</strong>
        <ul class="modal-pieces">
          ${look.pieces.map((p) => `<li>${escapeHtml(p)}</li>`).join('')}
        </ul>
        <div style="font-size: 12px; color: var(--color-ink-muted);">Estimasi budget</div>
        <div class="modal-budget tabular-nums">${formatRupiah(look.budget)}</div>
        <div class="actions-row">
          <button type="button" class="btn-primary" id="modal-fav-btn">
            ${isSaved ? '♥ Saved' : '♡ Save look'}
          </button>
          <button type="button" class="btn-secondary" id="modal-studio-btn">Coba di studio</button>
          ${
            hasShoppableSpec
              ? '<button type="button" class="btn-secondary" id="modal-buy-btn">Beli Item Look</button>'
              : ''
          }
        </div>
      </div>
    </div>
  `;

  backdrop.hidden = false;

  const closeBtn = document.getElementById('modal-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeLookModal);
    closeBtn.focus();
  }

  document.getElementById('modal-fav-btn')?.addEventListener('click', () => {
    toggleFavoriteLook(look.id);
  });

  document.getElementById('modal-studio-btn')?.addEventListener('click', () => {
    tryLookInStudio(look.id);
  });

  document.getElementById('modal-buy-btn')?.addEventListener('click', () => {
    addLookToCart(look.id);
  });
}

export function initModalEvents() {
  const backdrop = document.getElementById('modal-backdrop');
  if (backdrop) {
    backdrop.addEventListener('click', (event) => {
      if (event.target === backdrop) {
        closeLookModal();
      }
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && getState().modalLookId != null) {
      closeLookModal();
    }
  });
}
