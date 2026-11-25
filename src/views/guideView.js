import { LOOKS, STYLE_GUIDES } from '../data/looks.js';
import { renderEditorialLookUri } from '../engine/garmentEngine.js';
import { openExploreForOccasion, tryLookInStudio } from '../state/store.js';
import { escapeHtml } from '../utils/format.js';

export function renderGuideView() {
  const container = document.getElementById('view-guide');
  if (!container) return;

  container.innerHTML = `
    <div class="wrap">
      <div class="page-head">
        <h1>Find a look for every little moment</h1>
        <p>${STYLE_GUIDES.length} panduan OOTD wanita untuk berbagai kegiatan, destinasi, dan suasana.</p>
      </div>
      <div class="grid-guides" style="margin-top: 20px;">
        ${STYLE_GUIDES.map((guide) => {
          const sampleLook = LOOKS.find((l) => l.id === guide.lookId) || LOOKS[0];
          const src = renderEditorialLookUri(sampleLook);
          return `
            <article class="ornate-frame guide-card" data-guide-occasion="${escapeHtml(guide.occasion)}">
              <img loading="lazy" src="${src}" alt="${escapeHtml(guide.title || guide.occasion)}" />
              <div class="look-kicker">${escapeHtml(guide.occasion)}</div>
              <h3>${escapeHtml(guide.title || guide.occasion)}</h3>
              <p>${escapeHtml(guide.subtitle)}</p>
              ${
                guide.tip
                  ? `<p class="guide-tip">Tips: ${escapeHtml(guide.tip)}</p>`
                  : ''
              }
              <div class="guide-actions">
                <button
                  type="button"
                  class="btn-secondary"
                  data-guide-try="${guide.lookId}"
                >Coba di Studio</button>
                <button
                  type="button"
                  class="text-action"
                  data-guide-explore="${escapeHtml(guide.occasion)}"
                >Lihat Koleksi ›</button>
              </div>
            </article>
          `;
        }).join('')}
      </div>
    </div>
  `;

  container.querySelectorAll('[data-guide-occasion]').forEach((card) => {
    card.addEventListener('click', () => openExploreForOccasion(card.dataset.guideOccasion));
  });

  container.querySelectorAll('[data-guide-try]').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      tryLookInStudio(Number(btn.dataset.guideTry));
    });
  });

  container.querySelectorAll('[data-guide-explore]').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      openExploreForOccasion(btn.dataset.guideExplore);
    });
  });
}
