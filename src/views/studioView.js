import {
  ITEMS,
  STUDIO_SLOTS,
  WARDROBE_CATEGORIES,
  getItemPalette,
} from '../data/catalog.js';
import {
  exportOutfitPng,
  getGarmentThumbnailUri,
  renderMannequinOutfitSVG,
} from '../engine/garmentEngine.js';
import { BODY_TYPES } from '../engine/styleChecker.js';
import {
  addToCart,
  addWornOutfitToCart,
  areWornItemsFavorited,
  clearSlot,
  deleteCustomOutfit,
  favoriteWornOutfit,
  getCurrentWornMap,
  getState,
  getStudioSide,
  getWardrobeItemSide,
  loadCustomOutfit,
  resetStudio,
  runStyleCheck,
  saveCustomOutfit,
  setBodyType,
  setItemColor,
  setStudioAngle,
  setWardrobeFilter,
  shuffleStudio,
  toggleStudioFrontBack,
  toggleWardrobeItemFlip,
  toggleWardrobeViewAll,
  toggleWishlistItem,
  wearItem,
} from '../state/store.js';
import { escapeHtml, formatRupiah, showToast, svgToDataUri } from '../utils/format.js';

let studioInitialized = false;
let lastRenderedBurstId = 0;
let lastRenderedStageSignature = '';
let spinAnimRaf = null;

export function renderStudioView(mode = 'all') {
  const container = document.getElementById('view-studio');
  if (!container) return;

  const { wardrobe } = getState();

  if (!studioInitialized) {
    container.innerHTML = `
      <div class="wrap">
        <div class="page-head">
          <h1>Your style, your canvas</h1>
          <p>Ketuk atau seret pakaian ke mannequin, putar tampak depan &amp; belakang, lalu cek kecocokan warna &amp; bentuk tubuhmu.</p>
        </div>

        <div class="studio-layout">
          <div class="panel">
            <div class="studio-stage" id="studio-stage">
              <span class="stage-caption" id="studio-view-label">Tampak Depan · 0°</span>
              <button
                type="button"
                class="stage-flip-btn"
                id="studio-stage-flip-btn"
                aria-label="Putar mannequin ke tampak belakang atau depan"
              >↻ Lihat Belakang</button>
              <div id="studio-mannequin" class="mannequin-turntable"></div>
              <span class="stage-drag-hint">Geser kiri/kanan untuk memutar 360°</span>
              <div id="studio-confetti-layer" class="confetti-layer" aria-hidden="true"></div>
            </div>

            <div class="turntable-bar">
              <div class="turntable-presets" role="group" aria-label="Sudut pandang mannequin">
                <button type="button" class="filter-tab" data-angle-preset="0">Depan</button>
                <button type="button" class="filter-tab" data-angle-preset="45">Serong</button>
                <button type="button" class="filter-tab" data-angle-preset="180">Belakang</button>
                <button type="button" class="filter-tab" id="studio-spin-btn">↻ Putar 360°</button>
              </div>
              <label class="turntable-slider-wrap" for="studio-angle-slider">
                <span>Sudut</span>
                <input
                  id="studio-angle-slider"
                  class="angle-slider"
                  type="range"
                  min="0"
                  max="360"
                  step="1"
                  value="0"
                  aria-label="Putar sudut mannequin 0 sampai 360 derajat"
                />
              </label>
            </div>

            <div class="slots-grid" id="studio-slots"></div>

            <div class="body-type-box" id="studio-body-type"></div>

            <div class="studio-summary" id="studio-total"></div>
            <div class="actions-row">
              <button type="button" class="btn-primary" id="studio-check-btn">Check Style ✿</button>
              <button type="button" class="btn-secondary" id="studio-buy-btn">Masukkan Semua ke Bag</button>
              <button type="button" class="btn-secondary" id="studio-fav-btn">♡ Favoritkan Semua</button>
              <button type="button" class="btn-secondary" id="studio-save-btn">Simpan My Outfits</button>
              <button type="button" class="btn-secondary" id="studio-shuffle-btn">Shuffle</button>
              <button type="button" class="btn-secondary" id="studio-download-btn">Download PNG</button>
              <button type="button" class="btn-secondary" id="studio-reset-btn">Reset</button>
            </div>
            <div id="studio-check-result" aria-live="polite"></div>
          </div>

          <div class="panel">
            <div class="wardrobe-head-row">
              <h3>The wardrobe</h3>
              <button
                type="button"
                class="btn-secondary wardrobe-flip-all-btn"
                id="wardrobe-flip-all-btn"
              >↻ Lihat Belakang Semua</button>
            </div>
            <div class="wardrobe-tools">
              <label class="sr-only" for="wardrobe-search">Cari item pakaian</label>
              <input
                id="wardrobe-search"
                type="search"
                placeholder="Cari item..."
                value="${escapeHtml(wardrobe.query)}"
              />
              <label class="sr-only" for="wardrobe-sort">Urutkan item</label>
              <select id="wardrobe-sort">
                <option value="default" ${wardrobe.sort === 'default' ? 'selected' : ''}>Urutan awal</option>
                <option value="lo" ${wardrobe.sort === 'lo' ? 'selected' : ''}>Harga terendah</option>
                <option value="hi" ${wardrobe.sort === 'hi' ? 'selected' : ''}>Harga tertinggi</option>
              </select>
            </div>
            <div class="filter-tabs" id="wardrobe-chips" role="group" aria-label="Kategori pakaian"></div>
            <div class="wardrobe-grid" id="wardrobe-grid"></div>
          </div>
        </div>

        <div class="section-head">
          <h2>My Outfits</h2>
        </div>
        <div class="grid-looks" id="studio-outfits"></div>
      </div>
    `;

    bindStudioStaticEvents();
    studioInitialized = true;
  }

  if (mode === 'studio-rotate') {
    renderMannequinRotationState();
    return;
  }

  if (mode === 'wardrobe-grid') {
    renderWardrobeFlipAllButton();
    renderWardrobeChips();
    renderWardrobeGrid();
    return;
  }

  if (mode === 'studio-outfits') {
    renderSavedOutfits();
    return;
  }

  renderMannequinAndSlots();
  renderBodyTypeSelector();
  renderWardrobeFlipAllButton();
  renderWardrobeChips();
  renderWardrobeGrid();
  renderSavedOutfits();
}

function stopSpinAnimation() {
  if (spinAnimRaf != null) {
    cancelAnimationFrame(spinAnimRaf);
    spinAnimRaf = null;
  }
}

function start360Spin() {
  if (spinAnimRaf != null) {
    stopSpinAnimation();
    return;
  }

  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    toggleStudioFrontBack();
    return;
  }

  const startAngle = getState().studioAngle;
  const startTime = performance.now();
  const duration = 1250;

  const tick = (now) => {
    const t = Math.min(1, (now - startTime) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    setStudioAngle(startAngle + eased * 360);
    if (t < 1) {
      spinAnimRaf = requestAnimationFrame(tick);
    } else {
      spinAnimRaf = null;
    }
  };

  spinAnimRaf = requestAnimationFrame(tick);
}

function bindStudioStaticEvents() {
  const stage = document.getElementById('studio-stage');
  if (stage) {
    stage.addEventListener('dragover', (event) => {
      event.preventDefault();
      stage.classList.add('is-dragover');
    });
    stage.addEventListener('dragleave', () => {
      stage.classList.remove('is-dragover');
    });
    stage.addEventListener('drop', (event) => {
      event.preventDefault();
      stage.classList.remove('is-dragover');
      const id = Number(event.dataTransfer?.getData('text/plain'));
      if (ITEMS[id]) {
        wearItem(id, true);
      }
    });

    // Drag horizontally inside stage to rotate mannequin 360°
    let dragging = false;
    let dragStartX = 0;
    let dragStartAngle = 0;

    stage.addEventListener('pointerdown', (event) => {
      if (event.target.closest('button')) return;
      stopSpinAnimation();
      dragging = true;
      dragStartX = event.clientX;
      dragStartAngle = getState().studioAngle;
      stage.classList.add('is-rotating');
      try {
        stage.setPointerCapture(event.pointerId);
      } catch {
        // Ignore if capture unsupported
      }
    });

    stage.addEventListener('pointermove', (event) => {
      if (!dragging) return;
      const deltaX = event.clientX - dragStartX;
      setStudioAngle(dragStartAngle + deltaX * 0.95);
    });

    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      stage.classList.remove('is-rotating');
    };

    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);
  }

  document.getElementById('studio-stage-flip-btn')?.addEventListener('click', () => {
    stopSpinAnimation();
    toggleStudioFrontBack();
  });

  document.querySelectorAll('[data-angle-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      stopSpinAnimation();
      setStudioAngle(Number(btn.dataset.anglePreset));
    });
  });

  document.getElementById('studio-spin-btn')?.addEventListener('click', start360Spin);

  document.getElementById('studio-angle-slider')?.addEventListener('input', (event) => {
    stopSpinAnimation();
    setStudioAngle(Number(event.target.value));
  });

  document.getElementById('studio-check-btn')?.addEventListener('click', runStyleCheck);
  document.getElementById('studio-buy-btn')?.addEventListener('click', addWornOutfitToCart);
  document.getElementById('studio-fav-btn')?.addEventListener('click', favoriteWornOutfit);
  document.getElementById('studio-save-btn')?.addEventListener('click', saveCustomOutfit);
  document.getElementById('studio-shuffle-btn')?.addEventListener('click', shuffleStudio);
  document.getElementById('studio-reset-btn')?.addEventListener('click', resetStudio);

  document.getElementById('studio-download-btn')?.addEventListener('click', async () => {
    const wornMap = getCurrentWornMap();
    if (!Object.keys(wornMap).length) {
      showToast('Pakai item dulu sebelum mengunduh');
      return;
    }
    try {
      await exportOutfitPng(wornMap, getStudioSide());
      showToast('Gambar outfit berhasil diunduh');
    } catch {
      showToast('Gagal mengekspor gambar PNG');
    }
  });

  document.getElementById('wardrobe-flip-all-btn')?.addEventListener('click', toggleWardrobeViewAll);

  document.getElementById('wardrobe-search')?.addEventListener('input', (e) => {
    setWardrobeFilter({ query: e.target.value });
  });

  document.getElementById('wardrobe-sort')?.addEventListener('change', (e) => {
    setWardrobeFilter({ sort: e.target.value });
  });
}

function renderMannequinRotationState() {
  const mq = document.getElementById('studio-mannequin');
  const labelEl = document.getElementById('studio-view-label');
  const flipBtn = document.getElementById('studio-stage-flip-btn');
  const sliderEl = document.getElementById('studio-angle-slider');
  if (!mq) return;

  const state = getState();
  const angle = ((Number(state.studioAngle) || 0) % 360 + 360) % 360;
  const side = getStudioSide(angle);
  const wornMap = getCurrentWornMap();

  const signature = `${JSON.stringify(wornMap)}|${side}|${state.lastAnimatedSlot}`;
  if (signature !== lastRenderedStageSignature) {
    mq.innerHTML = renderMannequinOutfitSVG(wornMap, {
      animatedSlot: state.lastAnimatedSlot,
      side,
    });
    lastRenderedStageSignature = signature;
  }
  state.lastAnimatedSlot = '';

  let relativeTilt = side === 'back' ? angle - 180 : angle >= 270 ? angle - 360 : angle;
  const clampedTilt = Math.max(-68, Math.min(68, relativeTilt * 0.78));
  const foreshorten = 1 - Math.abs(clampedTilt) / 480;
  mq.style.transform = `perspective(960px) rotateY(${clampedTilt.toFixed(1)}deg) scaleX(${foreshorten.toFixed(
    3
  )})`;

  if (labelEl) {
    const sideTitle = side === 'back' ? 'Tampak Belakang' : 'Tampak Depan';
    labelEl.textContent = `${sideTitle} · ${angle}°`;
  }

  if (flipBtn) {
    flipBtn.textContent = side === 'back' ? '↻ Lihat Depan' : '↻ Lihat Belakang';
  }

  if (sliderEl && Number(sliderEl.value) !== angle) {
    sliderEl.value = String(angle);
  }

  document.querySelectorAll('[data-angle-preset]').forEach((btn) => {
    const targetAngle = Number(btn.dataset.anglePreset);
    const isNear =
      Math.min(Math.abs(angle - targetAngle), 360 - Math.abs(angle - targetAngle)) <= 22;
    btn.classList.toggle('is-active', isNear);
  });
}

function renderMannequinAndSlots() {
  const slotsEl = document.getElementById('studio-slots');
  const totalEl = document.getElementById('studio-total');
  if (!slotsEl || !totalEl) return;

  renderMannequinRotationState();

  const state = getState();
  let totalPrice = 0;
  let itemCount = 0;

  slotsEl.innerHTML = STUDIO_SLOTS.map(({ key, label }) => {
    const id = state.worn[key];
    const item = id != null ? ITEMS[id] : null;
    if (item) {
      totalPrice += item.price;
      itemCount += 1;
    }
    return `
      <button
        type="button"
        class="slot-btn ${item ? 'is-filled' : ''}"
        data-slot-key="${key}"
        data-slot-item="${item ? item.id : ''}"
        aria-label="${item ? `Lepas ${item.name} dari slot ${label}` : `Pilih kategori ${label}`}"
      >
        <small>${label}</small>
        <strong>${item ? escapeHtml(item.name) : '—'}</strong>
        ${item ? '<i class="slot-clear" aria-hidden="true">✕</i>' : ''}
      </button>
    `;
  }).join('');

  slotsEl.querySelectorAll('.slot-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const itemId = btn.dataset.slotItem;
      if (itemId !== '') {
        clearSlot(btn.dataset.slotKey);
      } else {
        setWardrobeFilter({ category: btn.dataset.slotKey });
      }
    });
  });

  totalEl.innerHTML = `
    <span class="tabular-nums">${itemCount} item dipakai</span>
    <strong class="tabular-nums">${formatRupiah(totalPrice)}</strong>
  `;

  const favBtn = document.getElementById('studio-fav-btn');
  if (favBtn) {
    const allFav = areWornItemsFavorited();
    favBtn.textContent = allFav ? '♥ Sudah di Favorites' : '♡ Favoritkan Semua';
    favBtn.classList.toggle('is-saved-action', allFav);
  }

  renderStyleCheckResult();
}

function renderBodyTypeSelector() {
  const container = document.getElementById('studio-body-type');
  if (!container) return;

  const { bodyType } = getState();
  const activeBody = BODY_TYPES.find((b) => b.id === bodyType) || BODY_TYPES[0];

  container.innerHTML = `
    <div class="body-type-head">
      <strong>Bentuk Tubuh Pemakai</strong>
      <span>${escapeHtml(activeBody.shortDesc)}</span>
    </div>
    <div class="filter-tabs" role="radiogroup" aria-label="Pilih bentuk tubuh untuk penilaian gaya">
      ${BODY_TYPES.map((bt) => {
        const active = bt.id === bodyType;
        return `<button
          type="button"
          role="radio"
          aria-checked="${active ? 'true' : 'false'}"
          class="filter-tab ${active ? 'is-active' : ''}"
          data-body-type="${bt.id}"
        >${escapeHtml(bt.label)}</button>`;
      }).join('')}
    </div>
  `;

  container.querySelectorAll('[data-body-type]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setBodyType(btn.dataset.bodyType);
    });
  });
}

function triggerCuteConfetti() {
  const layer = document.getElementById('studio-confetti-layer');
  if (!layer) return;

  layer.innerHTML = '';
  const symbols = ['♡', '✿', '✦', '❀', '★', '♥'];
  const colors = ['#e86896', '#f4a3c2', '#c89ef2', '#ffd166', '#ff8fb8', '#a3d8f4'];
  const count = 34;

  for (let i = 0; i < count; i += 1) {
    const piece = document.createElement('span');
    piece.className = i % 3 === 0 ? 'confetti-piece confetti-piece--ribbon' : 'confetti-piece';
    if (i % 3 !== 0) {
      piece.textContent = symbols[i % symbols.length];
    }
    const left = Math.round(4 + Math.random() * 92);
    const delay = (Math.random() * 0.45).toFixed(2);
    const duration = (1.65 + Math.random() * 1.1).toFixed(2);
    const drift = Math.round(-46 + Math.random() * 92);
    const rot = Math.round(-180 + Math.random() * 360);
    const color = colors[i % colors.length];

    piece.style.left = `${left}%`;
    piece.style.color = color;
    if (i % 3 === 0) {
      piece.style.backgroundColor = color;
    }
    piece.style.animationDelay = `${delay}s`;
    piece.style.animationDuration = `${duration}s`;
    piece.style.setProperty('--drift', `${drift}px`);
    piece.style.setProperty('--rot', `${rot}deg`);
    layer.appendChild(piece);
  }

  window.setTimeout(() => {
    if (layer) {
      layer.innerHTML = '';
    }
  }, 3200);
}

function renderStyleCheckResult() {
  const box = document.getElementById('studio-check-result');
  if (!box) return;

  const { styleCheckResult, confettiBurstId } = getState();

  if (confettiBurstId !== lastRenderedBurstId) {
    lastRenderedBurstId = confettiBurstId;
    if (styleCheckResult?.tier === 'perfect') {
      triggerCuteConfetti();
    }
  }

  if (!styleCheckResult) {
    box.innerHTML = '';
    return;
  }

  const tierLabel =
    styleCheckResult.tier === 'perfect'
      ? 'Sempurna'
      : styleCheckResult.tier === 'decent'
      ? 'Lumayan'
      : 'Kurang Cocok';

  const colorInfo = styleCheckResult.colorAnalysis;
  const propInfo = styleCheckResult.proportionAnalysis;

  box.innerHTML = `
    <div class="style-check-card style-check-card--${escapeHtml(styleCheckResult.tier)}">
      <div class="style-check-head">
        <div>
          <div class="look-kicker">Evaluasi Stylist · ${escapeHtml(tierLabel)} · ${escapeHtml(
    styleCheckResult.bodyTypeLabel || 'Hourglass'
  )}</div>
          <h4>${escapeHtml(styleCheckResult.title)}</h4>
        </div>
        <span class="style-check-score tabular-nums">${styleCheckResult.score}/100</span>
      </div>

      <p class="style-check-summary">${escapeHtml(styleCheckResult.summary)}</p>

      ${
        colorInfo || propInfo
          ? `<div class="style-check-pillars">
              ${
                colorInfo
                  ? `<div class="style-pillar">
                      <strong>Perpaduan Warna · ${escapeHtml(colorInfo.schemeLabel)}</strong>
                      <p>${escapeHtml(colorInfo.toneSummary)}</p>
                    </div>`
                  : ''
              }
              ${
                propInfo
                  ? `<div class="style-pillar">
                      <strong>Siluet &amp; Bentuk Tubuh</strong>
                      <p>${escapeHtml(propInfo.silhouetteSummary)}</p>
                    </div>`
                  : ''
              }
            </div>`
          : ''
      }

      ${
        styleCheckResult.strengths?.length
          ? `<div class="style-check-section">
              <div class="style-check-subhead">Kelebihan Paduan</div>
              <ul class="style-check-strengths">
                ${styleCheckResult.strengths
                  .map((item) => `<li>${escapeHtml(item)}</li>`)
                  .join('')}
              </ul>
            </div>`
          : ''
      }

      ${
        styleCheckResult.suggestions?.length
          ? `<div class="style-check-section">
              <div class="style-check-subhead">Saran Stylist Profesional</div>
              <ul class="style-check-tips">
                ${styleCheckResult.suggestions
                  .map((tip) =>
                    typeof tip === 'string'
                      ? `<li>${escapeHtml(tip)}</li>`
                      : `<li><strong>${escapeHtml(tip.aspect)}:</strong> ${escapeHtml(tip.text)}</li>`
                  )
                  .join('')}
              </ul>
            </div>`
          : ''
      }
    </div>
  `;
}

function renderWardrobeFlipAllButton() {
  const btn = document.getElementById('wardrobe-flip-all-btn');
  if (!btn) return;
  const { wardrobeBackAll } = getState();
  btn.textContent = wardrobeBackAll ? '↻ Lihat Depan Semua' : '↻ Lihat Belakang Semua';
  btn.classList.toggle('is-saved-action', wardrobeBackAll);
}

function renderWardrobeChips() {
  const chipsEl = document.getElementById('wardrobe-chips');
  if (!chipsEl) return;

  const { category } = getState().wardrobe;

  chipsEl.innerHTML = WARDROBE_CATEGORIES.map(({ key, label }) => {
    const active = category === key;
    const count =
      key === 'all' ? ITEMS.length : ITEMS.filter((item) => item.cat === key).length;
    return `<button
      type="button"
      class="filter-tab ${active ? 'is-active' : ''}"
      data-wcat="${key}"
      aria-pressed="${active ? 'true' : 'false'}"
    >${label} (${count})</button>`;
  }).join('');

  chipsEl.querySelectorAll('[data-wcat]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setWardrobeFilter({ category: btn.dataset.wcat });
    });
  });
}

function renderWardrobeGrid() {
  const grid = document.getElementById('wardrobe-grid');
  if (!grid) return;

  const { wardrobe, worn, wish, colorIndexByItem } = getState();
  const q = wardrobe.query.trim().toLowerCase();

  const filtered = ITEMS.filter((item) => {
    if (wardrobe.category !== 'all' && item.cat !== wardrobe.category) return false;
    if (q && !item.name.toLowerCase().includes(q)) return false;
    return true;
  });

  if (wardrobe.sort === 'lo') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (wardrobe.sort === 'hi') {
    filtered.sort((a, b) => b.price - a.price);
  }

  if (!filtered.length) {
    grid.innerHTML = '<div class="empty-state"><p>Item tidak ditemukan.</p></div>';
    return;
  }

  grid.innerHTML = filtered
    .map((item) => {
      const isWorn = worn[item.cat] === item.id;
      const isWished = wish.includes(item.id);
      const selectedColor = colorIndexByItem[item.id] || 0;
      const itemSide = getWardrobeItemSide(item.id);
      const isBack = itemSide === 'back';
      const palette = getItemPalette(item);
      const thumbSrc = getGarmentThumbnailUri(item.id, selectedColor, itemSide);

      return `
        <article
          class="wardrobe-item ${isWorn ? 'is-worn' : ''} ${isBack ? 'is-back-view' : ''}"
          draggable="true"
          tabindex="0"
          data-wear-item="${item.id}"
          aria-label="${escapeHtml(item.name)}, ${formatRupiah(item.price)}, tampak ${
        isBack ? 'belakang' : 'depan'
      }"
        >
          <button
            type="button"
            class="wardrobe-flip-btn ${isBack ? 'is-flipped' : ''}"
            data-flip-item="${item.id}"
            title="${isBack ? 'Putar ke tampak depan' : 'Putar ke tampak belakang'}"
            aria-label="Putar ${escapeHtml(item.name)} ke tampak ${isBack ? 'depan' : 'belakang'}"
            aria-pressed="${isBack ? 'true' : 'false'}"
          >↻</button>
          <button
            type="button"
            class="wish-btn ${isWished ? 'is-saved' : ''}"
            data-wish-item="${item.id}"
            aria-label="${isWished ? 'Hapus dari wishlist' : 'Simpan ke wishlist'}"
            aria-pressed="${isWished ? 'true' : 'false'}"
          >${isWished ? '♥' : '♡'}</button>
          <img src="${thumbSrc}" alt="${escapeHtml(item.name)} (${
        isBack ? 'tampak belakang' : 'tampak depan'
      })" />
          <div class="wardrobe-item-body">
            <strong>${escapeHtml(item.name)}</strong>
            <div class="item-card-price-row">
              <small class="tabular-nums">${formatRupiah(item.price)}${
        isBack ? ' · Belakang' : ''
      }</small>
              <button
                type="button"
                class="mini-bag-btn"
                data-add-cart="${item.id}"
                aria-label="Tambah ${escapeHtml(item.name)} ke tas"
              >+ Tas</button>
            </div>
            <div class="swatches" role="group" aria-label="Pilih warna ${escapeHtml(item.name)}">
              ${palette
                .map(
                  (hex, idx) => `
                <button
                  type="button"
                  class="swatch-dot ${idx === selectedColor ? 'is-active' : ''}"
                  style="background:${hex}"
                  data-swatch-item="${item.id}"
                  data-swatch-idx="${idx}"
                  aria-label="Warna ${idx + 1}"
                  aria-pressed="${idx === selectedColor ? 'true' : 'false'}"
                ></button>
              `
                )
                .join('')}
            </div>
          </div>
        </article>
      `;
    })
    .join('');

  grid.querySelectorAll('[data-wear-item]').forEach((card) => {
    const itemId = Number(card.dataset.wearItem);
    card.addEventListener('dragstart', (event) => {
      event.dataTransfer?.setData('text/plain', String(itemId));
    });
    card.addEventListener('click', () => wearItem(itemId));
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        wearItem(itemId);
      }
    });
  });

  grid.querySelectorAll('[data-flip-item]').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleWardrobeItemFlip(Number(btn.dataset.flipItem));
    });
  });

  grid.querySelectorAll('[data-wish-item]').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleWishlistItem(Number(btn.dataset.wishItem));
    });
  });

  grid.querySelectorAll('[data-add-cart]').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      addToCart(Number(btn.dataset.addCart));
    });
  });

  grid.querySelectorAll('[data-swatch-item]').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      setItemColor(Number(btn.dataset.swatchItem), Number(btn.dataset.swatchIdx));
    });
  });
}

function renderSavedOutfits() {
  const outfitsEl = document.getElementById('studio-outfits');
  if (!outfitsEl) return;

  const { outfits } = getState();
  if (!outfits.length) {
    outfitsEl.innerHTML =
      '<div class="empty-state"><p>Belum ada outfit tersimpan. Susun look lalu tekan “Simpan My Outfits”.</p></div>';
    return;
  }

  outfitsEl.innerHTML = outfits
    .map((outfit, index) => {
      const entries = Object.values(outfit.w || {});
      const total = entries.reduce((sum, entry) => sum + (ITEMS[entry[0]]?.price || 0), 0);
      const names = entries.map((entry) => ITEMS[entry[0]]?.name).filter(Boolean).join(' · ');
      const previewUri = svgToDataUri(renderMannequinOutfitSVG(outfit.w || {}));

      return `
        <article class="look-card">
          <div class="ornate-frame">
            <div class="outfit-preview">
              <img src="${previewUri}" alt="${escapeHtml(outfit.n)}" />
            </div>
          </div>
          <h3>${escapeHtml(outfit.n)}</h3>
          <p class="look-desc">${escapeHtml(names)}</p>
          <div class="look-footer">
            <strong class="tabular-nums">${formatRupiah(total)}</strong>
            <span class="tabular-nums">${escapeHtml(outfit.d)}</span>
          </div>
          <div class="actions-row" style="margin-top: 10px;">
            <button type="button" class="btn-secondary" data-load-outfit="${index}">Pakai</button>
            <button type="button" class="btn-secondary" data-delete-outfit="${index}">Hapus</button>
          </div>
        </article>
      `;
    })
    .join('');

  outfitsEl.querySelectorAll('[data-load-outfit]').forEach((btn) => {
    btn.addEventListener('click', () => loadCustomOutfit(Number(btn.dataset.loadOutfit)));
  });

  outfitsEl.querySelectorAll('[data-delete-outfit]').forEach((btn) => {
    btn.addEventListener('click', () => deleteCustomOutfit(Number(btn.dataset.deleteOutfit)));
  });
}
