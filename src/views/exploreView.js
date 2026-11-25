import { parseLookId, renderLookCard } from '../components/cards.js';
import { OCCASION_TYPES } from '../data/looks.js';
import {
  getAllLooks,
  getState,
  navigate,
  openLookModal,
  resetExploreFilters,
  setExploreFilter,
  toggleFavoriteLook,
} from '../state/store.js';
import { escapeHtml } from '../utils/format.js';

let isInitialized = false;

export function renderExploreView(onlyGrid = false) {
  const container = document.getElementById('view-explore');
  if (!container) return;

  const { explore, role } = getState();
  const canCurate = role === 'operator' || role === 'admin';

  if (!isInitialized || !onlyGrid) {
    container.innerHTML = `
      <div class="wrap">
        <div class="page-head page-head--row">
          <div>
            <h1>Explore the looks</h1>
            <p id="explore-count">Scroll, save, and find the outfit that feels like you.</p>
          </div>
          ${
            canCurate
              ? '<button type="button" class="btn-secondary" id="explore-curate-btn">Kelola Look Book</button>'
              : ''
          }
        </div>

        <div class="toolbar">
          <label class="sr-only" for="explore-search">Cari outfit</label>
          <input
            id="explore-search"
            type="search"
            placeholder="Cari outfit, occasion, atau style..."
            value="${escapeHtml(explore.query)}"
          />
          <label class="sr-only" for="explore-budget">Filter budget</label>
          <select id="explore-budget">
            <option value="0" ${explore.maxBudget === 0 ? 'selected' : ''}>Semua budget</option>
            <option value="350000" ${explore.maxBudget === 350000 ? 'selected' : ''}>≤ Rp 350.000</option>
            <option value="450000" ${explore.maxBudget === 450000 ? 'selected' : ''}>≤ Rp 450.000</option>
          </select>
          <label class="sr-only" for="explore-sort">Urutkan</label>
          <select id="explore-sort">
            <option value="featured" ${explore.sort === 'featured' ? 'selected' : ''}>Featured</option>
            <option value="az" ${explore.sort === 'az' ? 'selected' : ''}>Nama A–Z</option>
            <option value="lo" ${explore.sort === 'lo' ? 'selected' : ''}>Budget terendah</option>
          </select>
        </div>

        <div class="filter-tabs" id="explore-chips" role="group" aria-label="Filter occasion"></div>
        <div class="grid-looks" id="explore-grid" style="margin-top: 18px;"></div>
      </div>
    `;

    document.getElementById('explore-curate-btn')?.addEventListener('click', () => {
      navigate('operator');
    });
    document.getElementById('explore-search')?.addEventListener('input', (e) => {
      setExploreFilter({ query: e.target.value });
    });
    document.getElementById('explore-budget')?.addEventListener('change', (e) => {
      setExploreFilter({ maxBudget: Number(e.target.value) });
    });
    document.getElementById('explore-sort')?.addEventListener('change', (e) => {
      setExploreFilter({ sort: e.target.value });
    });

    isInitialized = true;
  }

  renderExploreChips();
  renderExploreGrid();
}

function renderExploreChips() {
  const chipsContainer = document.getElementById('explore-chips');
  if (!chipsContainer) return;

  const { occasion } = getState().explore;
  const options = ['All', ...OCCASION_TYPES];

  chipsContainer.innerHTML = options
    .map((type) => {
      const active = occasion === type;
      return `<button
        type="button"
        class="filter-tab ${active ? 'is-active' : ''}"
        data-occasion="${escapeHtml(type)}"
        aria-pressed="${active ? 'true' : 'false'}"
      >${type === 'All' ? 'All looks' : escapeHtml(type)}</button>`;
    })
    .join('');

  chipsContainer.querySelectorAll('[data-occasion]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setExploreFilter({ occasion: btn.dataset.occasion });
    });
  });
}

function renderExploreGrid() {
  const grid = document.getElementById('explore-grid');
  const countEl = document.getElementById('explore-count');
  if (!grid || !countEl) return;

  const { query, maxBudget, sort, occasion } = getState().explore;
  const q = query.trim().toLowerCase();

  const filtered = getAllLooks().filter((look) => {
    if (occasion !== 'All' && look.type !== occasion) return false;
    if (maxBudget && look.budget > maxBudget) return false;
    if (q) {
      const searchable = `${look.name} ${look.type} ${look.desc} ${(look.pieces || []).join(' ')}`.toLowerCase();
      if (!searchable.includes(q)) return false;
    }
    return true;
  });

  if (sort === 'az') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === 'lo') {
    filtered.sort((a, b) => a.budget - b.budget);
  }

  countEl.textContent = `${filtered.length} look ditemukan`;

  if (!filtered.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <p>Belum ada look yang cocok dengan pencarian atau budget ini.</p>
        <button type="button" class="btn-secondary" id="reset-explore-btn">Reset filter</button>
      </div>
    `;
    document.getElementById('reset-explore-btn')?.addEventListener('click', resetExploreFilters);
    return;
  }

  grid.innerHTML = filtered.map((look) => renderLookCard(look)).join('');

  grid.querySelectorAll('[data-look-id]').forEach((card) => {
    card.addEventListener('click', () => openLookModal(parseLookId(card.dataset.lookId)));
  });

  grid.querySelectorAll('[data-toggle-fav]').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleFavoriteLook(parseLookId(btn.dataset.toggleFav));
    });
  });
}
