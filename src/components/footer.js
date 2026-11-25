import { getState, navigate } from '../state/store.js';

export function renderFooter() {
  const container = document.getElementById('site-footer');
  if (!container) return;

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
