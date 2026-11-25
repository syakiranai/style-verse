import { getCartTotalCount, getState, navigate } from '../state/store.js';

function renderMobileBottomNav() {
  const nav = document.getElementById('mobile-bottom-nav');
  if (!nav) return;

  const { view, favs, wish, role, currentUser } = getState();
  const savedCount = favs.length + wish.length;
  const bagCount = getCartTotalCount();
  const accountView = !currentUser
    ? 'login'
    : role === 'admin'
    ? 'admin'
    : role === 'operator'
    ? 'operator'
    : 'login';
  const accountLabel = !currentUser
    ? 'Login'
    : role === 'admin'
    ? 'Admin'
    : role === 'operator'
    ? 'Operator'
    : 'User';
  const isAccountActive =
    view === 'login' ||
    view.startsWith('login-') ||
    view === 'operator' ||
    view === 'admin';

  const tabs = [
    { id: 'home', label: 'Home', icon: '⌂', active: view === 'home' },
    { id: 'explore', label: 'Explore', icon: '✦', active: view === 'explore' || view === 'guide' },
    { id: 'studio', label: 'Studio', icon: '✿', active: view === 'studio' },
    {
      id: 'favorites',
      label: savedCount > 0 ? `Saved (${savedCount})` : 'Saved',
      icon: '♡',
      active: view === 'favorites',
    },
    {
      id: accountView,
      label: bagCount > 0 && accountView === 'login' ? `User` : accountLabel,
      icon: currentUser ? '☺' : '→',
      active: isAccountActive,
    },
  ];

  // Keep Bag directly accessible alongside Studio & Saved on mobile thumb bar
  const mobileTabs = [
    tabs[0],
    tabs[1],
    tabs[2],
    tabs[3],
    {
      id: 'cart',
      label: bagCount > 0 ? `Bag (${bagCount})` : 'Bag',
      icon: '🛍',
      active: view === 'cart',
    },
  ];

  nav.innerHTML = mobileTabs
    .map(
      (tab) => `
      <button
        type="button"
        class="mobile-tab-btn ${tab.active ? 'is-active' : ''}"
        data-mobile-nav="${tab.id}"
        aria-current="${tab.active ? 'page' : 'false'}"
      >
        <span class="mobile-tab-icon" aria-hidden="true">${tab.icon}</span>
        <span class="mobile-tab-label">${tab.label}</span>
      </button>
    `
    )
    .join('');

  nav.querySelectorAll('[data-mobile-nav]').forEach((btn) => {
    btn.addEventListener('click', () => navigate(btn.dataset.mobileNav));
  });
}

export function renderFooter() {
  const container = document.getElementById('site-footer');
  if (container) {
    const { role, currentUser } = getState();

    container.innerHTML = `
      <div class="footer-links">
        <button type="button" class="footer-link" data-nav="home">Home</button>
        <button type="button" class="footer-link" data-nav="explore">Explore</button>
        <button type="button" class="footer-link" data-nav="guide">Style Guide</button>
        <button type="button" class="footer-link" data-nav="studio">Studio</button>
        <button type="button" class="footer-link" data-nav="cart">Bag &amp; Orders</button>
        ${
          currentUser
            ? role === 'admin'
              ? '<button type="button" class="footer-link" data-nav="admin">Admin</button>'
              : role === 'operator'
              ? '<button type="button" class="footer-link" data-nav="operator">Operator</button>'
              : '<button type="button" class="footer-link" data-nav="login">User</button>'
            : `<button type="button" class="footer-link" data-nav="login-user">Login User</button>
               <button type="button" class="footer-link" data-nav="login-operator">Login Operator</button>
               <button type="button" class="footer-link" data-nav="login-admin">Login Admin</button>`
        }
      </div>
      <div>
        <span>© 2026 Styleverse</span>
        <span> · </span>
        <button type="button" class="footer-link" id="back-to-top">▲ Page top</button>
      </div>
    `;

    container.querySelectorAll('[data-nav]').forEach((btn) => {
      btn.addEventListener('click', () => navigate(btn.dataset.nav));
    });

    const topBtn = document.getElementById('back-to-top');
    if (topBtn) {
      topBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }
  }

  renderMobileBottomNav();
}
