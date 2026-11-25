import { ROLE_META, getVisibleNavItems } from '../data/looks.js';
import { getCartTotalCount, getState, navigate, toggleMobileMenu } from '../state/store.js';

function renderNavButton(item, activeView, favTotal, cartCount, className) {
  const isLoginRoute = activeView === 'login' || activeView.startsWith('login-');
  const isActive = item.id === 'login' ? isLoginRoute : activeView === item.id;

  let countHtml = '';
  if (item.id === 'favorites') {
    countHtml = `<span class="fav-count">(${favTotal})</span>`;
  } else if (item.id === 'cart' && cartCount > 0) {
    countHtml = `<span class="fav-count">(${cartCount})</span>`;
  }

  return `<button
    type="button"
    class="${className} ${isActive ? 'is-active' : ''}"
    data-nav="${item.id}"
    aria-current="${isActive ? 'page' : 'false'}"
  >${item.label}${countHtml}</button>`;
}

export function renderHeader() {
  const container = document.getElementById('site-header');
  if (!container) return;

  const state = getState();
  const isAuth = Boolean(state.currentUser);
  const visibleItems = getVisibleNavItems(state.role, isAuth);
  const favTotal = state.favs.length + state.wish.length;
  const cartCount = getCartTotalCount();

  const splitIndex = 4;
  const leftItems = visibleItems.slice(0, splitIndex);
  const rightItems = visibleItems.slice(splitIndex);

  const leftNav = leftItems
    .map((item) => renderNavButton(item, state.view, favTotal, cartCount, 'nav-link'))
    .join('');
  const rightNav = rightItems
    .map((item) => renderNavButton(item, state.view, favTotal, cartCount, 'nav-link'))
    .join('');
  const mobileNav = visibleItems
    .map((item) => renderNavButton(item, state.view, favTotal, cartCount, 'mobile-nav-link'))
    .join('');

  const roleSummary = ROLE_META[state.role]?.label || '';

  container.innerHTML = `
    <nav class="nav-bar" aria-label="Primary navigation">
      <div class="nav-group">${leftNav}</div>
      <button
        type="button"
        class="nav-toggle"
        id="mobile-menu-toggle"
        aria-label="Toggle navigation menu"
        aria-expanded="${state.mobileMenuOpen ? 'true' : 'false'}"
        aria-controls="mobile-drawer"
      >☰</button>
      <button type="button" class="brand-logo" data-nav="home" aria-label="Styleverse Home">
        <svg viewBox="0 0 220 56" aria-hidden="true">
          <ellipse cx="110" cy="28" rx="106" ry="25" fill="#fffafd" stroke="#c94b78" stroke-width="1.8" />
          <ellipse cx="110" cy="28" rx="99" ry="21" fill="none" stroke="#e58eb0" stroke-dasharray="2 4" stroke-linecap="round" stroke-width="1.8" />
          <path d="M105 5c2-4 5-4 5 0c0-4 3-4 5 0c0 4-5 7-5 7s-5-3-5-7z" fill="#c94b78" />
        </svg>
        <span>Styleverse</span>
      </button>
      <div class="nav-group nav-group--right">${rightNav}</div>
      <button
        type="button"
        class="mobile-fav-btn"
        data-nav="cart"
        aria-label="${isAuth ? `Bag & Akun (${roleSummary})` : 'Bag belanja'}"
      >Bag (${cartCount})</button>
    </nav>
    <div class="mobile-drawer ${state.mobileMenuOpen ? 'is-open' : ''}" id="mobile-drawer">
      ${mobileNav}
    </div>
  `;

  container.querySelectorAll('[data-nav]').forEach((btn) => {
    btn.addEventListener('click', () => navigate(btn.dataset.nav));
  });

  const toggleBtn = document.getElementById('mobile-menu-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleMobileMenu);
  }
}
