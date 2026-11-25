import { parseLookId, renderGarmentTile } from '../components/cards.js';
import { ITEMS } from '../data/catalog.js';
import { LOOKS, OCCASION_TYPES, ROLE_META } from '../data/looks.js';
import {
  getGarmentThumbnailUri,
  renderDressFormSVG,
  renderEditorialLookUri,
} from '../engine/garmentEngine.js';
import {
  addToCart,
  getAllLooks,
  getState,
  navigate,
  openExploreForOccasion,
  openLookModal,
  toggleWishlistItem,
  tryItemInStudio,
} from '../state/store.js';
import { escapeHtml, formatRupiah } from '../utils/format.js';

const HERO_FRAMES = [
  { lookIdx: 1, style: '--l:8.5%;--t:9%;--w:12.5%;--a:3/4', cls: 'hero-frame--oval hero-frame--f1' },
  { lookIdx: 4, style: '--l:23.5%;--t:6%;--w:15%;--a:1.25', cls: 'is-secondary' },
  { lookIdx: 0, style: '--l:33%;--t:33%;--w:35%;--a:1.4', cls: 'hero-frame--f3' },
  { lookIdx: 5, style: '--l:16%;--t:46%;--w:14%;--a:.8', cls: 'is-secondary' },
  { lookIdx: 8, style: '--l:70%;--t:10%;--w:12.5%;--a:3/4', cls: 'hero-frame--oval hero-frame--f5' },
  { lookIdx: 6, style: '--l:85%;--t:7%;--w:7.5%;--a:.8', cls: 'is-secondary' },
  { lookIdx: 10, style: '--l:71.5%;--t:53%;--w:11%;--a:1', cls: 'is-secondary' },
];

export function renderHomeView() {
  const container = document.getElementById('view-home');
  if (!container) return;

  const { wearCount, colorIndexByItem, currentUser, userProfile, role } = getState();
  const allLooks = getAllLooks();
  const newArrivals = ITEMS.filter((_, idx) => idx % 5 === 1);
  const topRanked = [...ITEMS]
    .sort((a, b) => b.seed + (wearCount[b.id] || 0) - a.seed - (wearCount[a.id] || 0))
    .slice(0, 3);
  const dailyPick = allLooks[Math.floor(Date.now() / 864e5) % allLooks.length] || LOOKS[0];

  const heroHtml = HERO_FRAMES.map((frame) => {
    const look = LOOKS[frame.lookIdx];
    const src = renderEditorialLookUri(look);
    return `
      <button
        type="button"
        class="hero-frame ${frame.cls}"
        style="${frame.style}"
        data-open-look="${look.id}"
        aria-label="Lihat look ${escapeHtml(look.name)}"
      >
        <img src="${src}" alt="${escapeHtml(look.name)}" />
      </button>
    `;
  }).join('');

  const roleWelcomeStrip = currentUser
    ? `<div class="role-welcome-strip">
        <div>
          <strong>${escapeHtml(userProfile?.displayName || currentUser.displayName || 'Member')}</strong>
          <span> · Role: ${escapeHtml(ROLE_META[role]?.label || 'User Biasa')}</span>
        </div>
        <div class="actions-row">
          ${
            role === 'operator' || role === 'admin'
              ? '<button type="button" class="text-action" data-go="operator">Workspace Operator ›</button>'
              : ''
          }
          ${
            role === 'admin'
              ? '<button type="button" class="text-action" data-go="admin">Admin Console ›</button>'
              : ''
          }
          <button type="button" class="text-action" data-go="login">Profil akun ›</button>
        </div>
      </div>`
    : `<div class="role-welcome-strip">
        <div>
          <span>Masuk untuk menyinkronkan favorit, wishlist, dan transaksi belanja sesuai role kamu.</span>
        </div>
        <div class="actions-row">
          <button type="button" class="text-action" data-go="login-user">Login / Daftar User ›</button>
          <button type="button" class="text-action" data-go="login">Semua Portal Role ›</button>
        </div>
      </div>`;

  container.innerHTML = `
    <div class="hero-backdrop">
      <div class="hero-stage">
        ${heroHtml}
        ${renderDressFormSVG('hero-dressform')}
        <button type="button" class="hero-cta" data-go="studio">Try the dressing room</button>
      </div>
    </div>

    <div class="wrap">
      ${roleWelcomeStrip}

      <div class="split-home">
        <div>
          <div class="section-head">
            <h2>New Arrivals</h2>
            <button type="button" class="text-action" data-go="studio">Open studio ›</button>
          </div>
          <div class="carousel-wrap">
            <button type="button" class="carousel-arrow carousel-arrow--prev" data-car="na" data-dir="-1" aria-label="Scroll previous">‹</button>
            <div class="carousel" id="car-na">
              ${newArrivals.map((item) => renderGarmentTile(item)).join('')}
            </div>
            <button type="button" class="carousel-arrow carousel-arrow--next" data-car="na" data-dir="1" aria-label="Scroll next">›</button>
          </div>
        </div>

        <div>
          <div class="section-head">
            <h2>Today's Pick</h2>
          </div>
          <article class="pick-card" data-open-look="${escapeHtml(String(dailyPick.id))}">
            <div class="ornate-frame">
              <img src="${renderEditorialLookUri(dailyPick)}" alt="${escapeHtml(dailyPick.name)}" />
            </div>
            <h3>${escapeHtml(dailyPick.name)}</h3>
            <p class="pick-meta tabular-nums">${escapeHtml(dailyPick.type)} · ${formatRupiah(dailyPick.budget)}</p>
          </article>
        </div>
      </div>

      <div class="split-home">
        <div>
          <div class="section-head">
            <h2>Ranking</h2>
            <span class="section-subtitle">Paling sering dipakai di studio</span>
          </div>
          <div class="ranking-grid">
            ${topRanked
              .map(
                (item, idx) => `
              <article class="ranking-card" data-try-item="${item.id}">
                <div class="ranking-label">RANKING<strong class="tabular-nums">0${idx + 1}</strong></div>
                <div class="mirror-frame">
                  <div class="mirror-frame-inner">
                    <img src="${getGarmentThumbnailUri(item.id, colorIndexByItem[item.id] || 0)}" alt="${escapeHtml(item.name)}" />
                  </div>
                </div>
                <p class="ranking-caption">
                  <strong>${escapeHtml(item.name)}</strong><br />
                  <span class="tabular-nums">${formatRupiah(item.price)}</span>
                </p>
              </article>
            `
              )
              .join('')}
          </div>
        </div>

        <div>
          <div class="section-head">
            <h2>Mood</h2>
          </div>
          <div class="mood-list">
            ${OCCASION_TYPES.map(
              (type) => `<button type="button" class="mood-btn" data-mood="${escapeHtml(type)}">${escapeHtml(type)}</button>`
            ).join('')}
          </div>
        </div>
      </div>

      <div class="section-head">
        <h2>Look Book</h2>
        <button type="button" class="text-action" data-go="explore">More ›</button>
      </div>
      <div class="carousel-wrap">
        <button type="button" class="carousel-arrow carousel-arrow--prev" data-car="lb" data-dir="-1" aria-label="Scroll previous">‹</button>
        <div class="carousel lookbook-strip" id="car-lb">
          ${allLooks
            .map(
              (look) => `
            <article class="item-card" data-open-look="${escapeHtml(String(look.id))}">
              <img loading="lazy" src="${renderEditorialLookUri(look)}" alt="${escapeHtml(look.name)}" />
              <div class="item-card-meta">
                <strong>${escapeHtml(look.name)}</strong>
                <span>${escapeHtml(look.type)}</span>
              </div>
            </article>
          `
            )
            .join('')}
        </div>
        <button type="button" class="carousel-arrow carousel-arrow--next" data-car="lb" data-dir="1" aria-label="Scroll next">›</button>
      </div>

      <div class="studio-band">
        <div>
          <h2>Mix it. Match it. Make it yours.</h2>
          <p>Coba atasan, bawahan, outer, dan sepatu pada mannequin. Ganti warna, simpan outfit, lalu unduh sebagai gambar.</p>
          <button type="button" class="btn-primary" data-go="studio">Enter the studio</button>
        </div>
        ${renderDressFormSVG()}
      </div>
    </div>
  `;

  container.querySelectorAll('[data-go]').forEach((el) => {
    el.addEventListener('click', () => navigate(el.dataset.go));
  });

  container.querySelectorAll('[data-open-look]').forEach((el) => {
    el.addEventListener('click', () => openLookModal(parseLookId(el.dataset.openLook)));
  });

  container.querySelectorAll('[data-mood]').forEach((el) => {
    el.addEventListener('click', () => openExploreForOccasion(el.dataset.mood));
  });

  container.querySelectorAll('[data-car]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(`car-${btn.dataset.car}`);
      if (!target) return;
      const dir = Number(btn.dataset.dir);
      target.scrollBy({ left: dir * target.clientWidth * 0.8, behavior: 'smooth' });
    });
  });

  container.querySelectorAll('[data-toggle-wish]').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleWishlistItem(Number(btn.dataset.toggleWish));
    });
  });

  container.querySelectorAll('[data-add-cart]').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      addToCart(Number(btn.dataset.addCart));
    });
  });

  container.querySelectorAll('[data-try-item]').forEach((el) => {
    el.addEventListener('click', () => tryItemInStudio(Number(el.dataset.tryItem)));
  });
}
