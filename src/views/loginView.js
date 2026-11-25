import { ROLE_META, ROLE_PORTALS } from '../data/looks.js';
import {
  getState,
  loginWithCredentials,
  loginWithGoogle,
  logout,
  navigate,
  registerUserAccount,
  requestEmailVerification,
  setUserLoginMode,
} from '../state/store.js';
import { escapeHtml, showToast } from '../utils/format.js';

function getRoleIllustrationSVG(role) {
  if (role === 'operator') {
    return `<svg viewBox="0 0 120 120" aria-hidden="true">
      <circle cx="60" cy="60" r="52" fill="#f7ecff" stroke="#d98ca9" stroke-width="2" stroke-dasharray="4 3"/>
      <rect x="35" y="28" width="50" height="64" rx="10" fill="#ffffff" stroke="#c94b78" stroke-width="2"/>
      <path d="M46 46 H74 M46 58 H70 M46 70 H64" stroke="#e58eb0" stroke-width="3" stroke-linecap="round"/>
      <path d="M74 74 C78 68 87 68 88 76 C89 83 78 90 74 93 C70 90 59 83 60 76 C61 68 70 68 74 74Z" fill="#ff9ebe" stroke="#c94b78" stroke-width="1.8"/>
    </svg>`;
  }

  if (role === 'admin') {
    return `<svg viewBox="0 0 120 120" aria-hidden="true">
      <circle cx="60" cy="60" r="52" fill="#ffe2ee" stroke="#c94b78" stroke-width="2" stroke-dasharray="4 3"/>
      <path d="M28 74 L35 42 L51 56 L60 34 L69 56 L85 42 L92 74 Z" fill="#ffd1e2" stroke="#6b2d47" stroke-width="2.2" stroke-linejoin="round"/>
      <rect x="28" y="76" width="64" height="10" rx="5" fill="#c94b78"/>
      <circle cx="35" cy="40" r="4" fill="#fff"/>
      <circle cx="60" cy="32" r="4.5" fill="#fff"/>
      <circle cx="85" cy="40" r="4" fill="#fff"/>
    </svg>`;
  }

  return `<svg viewBox="0 0 120 120" aria-hidden="true">
    <circle cx="60" cy="60" r="52" fill="#ffeaf2" stroke="#e58eb0" stroke-width="2" stroke-dasharray="4 3"/>
    <path d="M60 54 C42 36 24 44 28 62 C32 76 48 70 60 58 C72 70 88 76 92 62 C96 44 78 36 60 54Z" fill="#ffb8d0" stroke="#6b2d47" stroke-width="2"/>
    <path d="M56 62 L46 88 M64 62 L74 88" stroke="#c94b78" stroke-width="3" stroke-linecap="round"/>
    <circle cx="60" cy="56" r="7" fill="#fff5f8" stroke="#6b2d47" stroke-width="2"/>
  </svg>`;
}

/**
 * Render the Login Portal Hub (when signed out) or Active Account Summary (when signed in).
 */
export function renderLoginView() {
  const container = document.getElementById('view-login');
  if (!container) return;

  const { authReady, currentUser, userProfile, role, favs, wish, outfits, orders } = getState();

  if (!authReady) {
    container.innerHTML = `
      <div class="wrap">
        <div class="page-head">
          <h1>Memeriksa sesi akun...</h1>
          <p>Menghubungkan ke layanan otentikasi Styleverse.</p>
        </div>
      </div>
    `;
    return;
  }

  if (currentUser) {
    const roleInfo = ROLE_META[role] || ROLE_META.user;
    const displayName = userProfile?.displayName || currentUser.displayName || 'Styleverse Member';
    const email = userProfile?.email || currentUser.email || '';
    const needsEmailVerification =
      currentUser.emailVerified === false &&
      currentUser.providerIds?.includes('password');

    container.innerHTML = `
      <div class="wrap">
        <div class="page-head">
          <h1>Akun &amp; Akses Role</h1>
          <p>Sesi aktif terhubung dan disinkronkan secara aman dengan akun kamu.</p>
        </div>

        <div class="auth-grid">
          <section class="panel">
            <div class="account-header">
              <div class="account-avatar" aria-hidden="true">${escapeHtml(
                displayName.charAt(0).toUpperCase()
              )}</div>
              <div>
                <div class="look-kicker">Role aktif · ${escapeHtml(roleInfo.label)}</div>
                <h2>${escapeHtml(displayName)}</h2>
                <p class="account-email">${escapeHtml(email)}</p>
              </div>
            </div>

            ${
              needsEmailVerification
                ? `<div class="form-error" style="margin-top: 14px;">
                    Email kamu belum terverifikasi. Cek inbox atau kirim ulang tautan verifikasi untuk keamanan ekstra.
                    <div style="margin-top: 8px;">
                      <button type="button" class="btn-secondary" id="resend-verif-btn">Kirim Ulang Email Verifikasi</button>
                    </div>
                  </div>`
                : ''
            }

            <p style="margin: 16px 0; color: var(--color-ink-muted);">${escapeHtml(roleInfo.summary)}</p>

            <div class="account-stats account-stats--4">
              <div>
                <span class="account-stat-label">Looks</span>
                <strong class="tabular-nums">${favs.length}</strong>
              </div>
              <div>
                <span class="account-stat-label">Wishlist</span>
                <strong class="tabular-nums">${wish.length}</strong>
              </div>
              <div>
                <span class="account-stat-label">Outfits</span>
                <strong class="tabular-nums">${outfits.length}</strong>
              </div>
              <div>
                <span class="account-stat-label">Transaksi</span>
                <strong class="tabular-nums">${orders.length}</strong>
              </div>
            </div>

            <div class="actions-row" style="margin-top: 20px;">
              <button type="button" class="btn-primary" data-go="cart">Bag &amp; Pesanan</button>
              <button type="button" class="btn-secondary" data-go="studio">Buka Studio</button>
              ${
                role === 'operator'
                  ? '<button type="button" class="btn-secondary" data-go="operator">Workspace Operator</button>'
                  : ''
              }
              ${
                role === 'admin'
                  ? '<button type="button" class="btn-secondary" data-go="admin">Admin Console</button>'
                  : ''
              }
              <button type="button" class="btn-secondary" id="logout-btn">Keluar</button>
            </div>
          </section>

          <aside class="panel">
            <h3>Role Akses Aktif</h3>
            <ul class="role-matrix">
              ${ROLE_PORTALS.filter((p) => p.role === role)
                .map(
                  (p) => `
                <li class="is-current">
                  <strong>${escapeHtml(p.shortTitle)} · Aktif</strong>
                  <p>${escapeHtml(p.subtitle)}</p>
                  <div style="margin-top: 8px;">
                    <button type="button" class="text-action" data-go="${p.viewId}">Halaman ${escapeHtml(p.shortTitle)} ›</button>
                  </div>
                </li>
              `
                )
                .join('')}
            </ul>
          </aside>
        </div>
      </div>
    `;

    container.querySelectorAll('[data-go]').forEach((btn) => {
      btn.addEventListener('click', () => navigate(btn.dataset.go));
    });

    document.getElementById('logout-btn')?.addEventListener('click', logout);
    document.getElementById('resend-verif-btn')?.addEventListener('click', requestEmailVerification);
    return;
  }

  container.innerHTML = `
    <div class="wrap">
      <div class="page-head">
        <h1>Pilih Portal Login Styleverse ♡</h1>
        <p>Setiap role memiliki halaman login dan pengalaman tampilan tersendiri. Pilih portal sesuai peranmu.</p>
      </div>

      <div class="portal-grid">
        ${ROLE_PORTALS.map(
          (portal) => `
          <article class="portal-card portal-card--${portal.role}">
            <div>
              <div class="portal-crest">${getRoleIllustrationSVG(portal.role)}</div>
              <div class="look-kicker">${escapeHtml(portal.kicker)}</div>
              <h2>${escapeHtml(portal.title)}</h2>
              <p>${escapeHtml(portal.subtitle)}</p>
              <ul class="portal-list">
                ${portal.perks.map((perk) => `<li>${escapeHtml(perk)}</li>`).join('')}
              </ul>
            </div>
            <button type="button" class="btn-primary" data-go="${portal.viewId}">
              ${escapeHtml(portal.cta)}
            </button>
          </article>
        `
        ).join('')}
      </div>
    </div>
  `;

  container.querySelectorAll('[data-go]').forEach((btn) => {
    btn.addEventListener('click', () => navigate(btn.dataset.go));
  });
}

function renderUserCredentialsBlock(authBusy, userLoginMode) {
  const isRegister = userLoginMode === 'register';

  return `
    <div class="auth-mode-tabs" role="tablist" aria-label="Pilih mode masuk user">
      <button
        type="button"
        role="tab"
        aria-selected="${!isRegister ? 'true' : 'false'}"
        class="filter-tab ${!isRegister ? 'is-active' : ''}"
        data-auth-mode="login"
      >Masuk Akun</button>
      <button
        type="button"
        role="tab"
        aria-selected="${isRegister ? 'true' : 'false'}"
        class="filter-tab ${isRegister ? 'is-active' : ''}"
        data-auth-mode="register"
      >Daftar Baru</button>
    </div>

    ${
      isRegister
        ? `<form id="user-register-form" class="auth-form">
            <div class="form-field">
              <label for="reg-name">Nama Lengkap</label>
              <input id="reg-name" name="name" type="text" required minlength="2" maxlength="80" placeholder="Contoh: Naila Putri" autocomplete="name" />
            </div>
            <div class="form-field">
              <label for="reg-email">Email</label>
              <input id="reg-email" name="email" type="email" required maxlength="160" placeholder="nama@email.com" autocomplete="email" />
            </div>
            <div class="form-row-2">
              <div class="form-field">
                <label for="reg-password">Password</label>
                <div class="password-input-wrap">
                  <input id="reg-password" name="password" type="password" required minlength="6" maxlength="100" placeholder="Minimal 6 karakter" autocomplete="new-password" />
                  <button type="button" class="password-toggle-btn" data-toggle-pw="reg-password">Lihat</button>
                </div>
              </div>
              <div class="form-field">
                <label for="reg-confirm">Konfirmasi Password</label>
                <div class="password-input-wrap">
                  <input id="reg-confirm" name="confirmPassword" type="password" required minlength="6" maxlength="100" placeholder="Ulangi password" autocomplete="new-password" />
                  <button type="button" class="password-toggle-btn" data-toggle-pw="reg-confirm">Lihat</button>
                </div>
              </div>
            </div>
            <button type="submit" class="btn-primary auth-submit-btn" ${authBusy ? 'disabled' : ''}>
              ${authBusy ? 'Membuat akun...' : 'Daftar & Masuk ♡'}
            </button>
          </form>`
        : `<form id="user-login-form" class="auth-form">
            <div class="form-field">
              <label for="login-email">Email</label>
              <input id="login-email" name="email" type="email" required maxlength="160" placeholder="nama@email.com" autocomplete="email" />
            </div>
            <div class="form-field">
              <label for="login-password">Password</label>
              <div class="password-input-wrap">
                <input id="login-password" name="password" type="password" required minlength="6" maxlength="100" placeholder="Masukkan password" autocomplete="current-password" />
                <button type="button" class="password-toggle-btn" data-toggle-pw="login-password">Lihat</button>
              </div>
            </div>
            <button type="submit" class="btn-primary auth-submit-btn" ${authBusy ? 'disabled' : ''}>
              ${authBusy ? 'Memeriksa akun...' : 'Masuk dengan Email & Password'}
            </button>
          </form>`
    }

    <div class="auth-divider"><span>atau masuk cepat dengan</span></div>
  `;
}

/**
 * Render a dedicated standalone Login page for a specific role ('user' | 'operator' | 'admin').
 * @param {'user' | 'operator' | 'admin'} targetRole
 */
export function renderRoleLoginView(targetRole) {
  const container = document.getElementById(`view-login-${targetRole}`);
  if (!container) return;

  const portal = ROLE_PORTALS.find((p) => p.role === targetRole) || ROLE_PORTALS[0];
  const { authBusy, authError, roleMismatchNotice, currentUser, userProfile, role, userLoginMode } =
    getState();
  const hasMatchingRole =
    currentUser &&
    (targetRole === 'user'
      ? role === 'user' || role === 'operator' || role === 'admin'
      : targetRole === 'operator'
      ? role === 'operator' || role === 'admin'
      : role === 'admin');

  const targetWorkspace =
    targetRole === 'admin' ? 'admin' : targetRole === 'operator' ? 'operator' : 'home';

  container.innerHTML = `
    <div class="wrap">
      <div class="page-head">
        <h1>${escapeHtml(portal.title)}</h1>
        <p>${escapeHtml(portal.subtitle)}</p>
      </div>

      <div class="role-login-shell">
        <div class="role-switcher-bar">
          <button type="button" class="btn-secondary" data-go="${currentUser ? 'login' : 'login'}">‹ ${
      currentUser ? 'Ringkasan Akun' : 'Semua Portal'
    }</button>
          <div class="filter-tabs" role="navigation" aria-label="Pilih halaman login role">
            ${(currentUser ? ROLE_PORTALS.filter((p) => p.role === role) : ROLE_PORTALS)
              .map(
                (p) => `
              <button
                type="button"
                class="filter-tab ${p.role === targetRole ? 'is-active' : ''}"
                data-go="${p.viewId}"
                aria-current="${p.role === targetRole ? 'page' : 'false'}"
              >${escapeHtml(p.shortTitle)}</button>
            `
              )
              .join('')}
          </div>
        </div>

        <section class="role-login-card role-login-card--${portal.role}">
          <div class="role-login-art">
            ${getRoleIllustrationSVG(portal.role)}
            <strong>${escapeHtml(portal.shortTitle)}</strong>
            <span>${escapeHtml(portal.kicker)}</span>
            <ul class="portal-list" style="text-align: left; margin-top: 16px;">
              ${portal.perks.map((perk) => `<li>${escapeHtml(perk)}</li>`).join('')}
            </ul>
          </div>

          <div class="role-login-body">
            <div class="look-kicker">Portal Otentikasi · ${escapeHtml(portal.shortTitle)}</div>
            <h2>Selamat Datang, ${escapeHtml(portal.shortTitle)} ♡</h2>

            ${authError ? `<p class="form-error" role="alert">${escapeHtml(authError)}</p>` : ''}
            ${
              roleMismatchNotice
                ? `<p class="form-error" role="alert">${escapeHtml(roleMismatchNotice)}</p>`
                : ''
            }

            ${
              currentUser
                ? `<div class="role-matrix" style="margin-bottom: 16px;">
                    <li class="is-current">
                      <strong>Masuk sebagai ${escapeHtml(
                        userProfile?.displayName || currentUser.displayName || 'Member'
                      )}</strong>
                      <p>${escapeHtml(currentUser.email || '')} · Role akun: ${escapeHtml(
                    ROLE_META[role]?.label || role
                  )}</p>
                    </li>
                  </div>
                  <div class="actions-row">
                    ${
                      hasMatchingRole
                        ? `<button type="button" class="btn-primary" data-go="${targetWorkspace}">Lanjut ke Halaman ${escapeHtml(
                            portal.shortTitle
                          )}</button>`
                        : `<button type="button" class="btn-primary" data-go="home">Buka Beranda User Biasa</button>`
                    }
                    <button type="button" class="btn-secondary" id="role-logout-btn-${targetRole}">Ganti Akun / Keluar</button>
                  </div>`
                : `${
                    targetRole === 'user' ? renderUserCredentialsBlock(authBusy, userLoginMode) : ''
                  }
                  <button
                    type="button"
                    class="${targetRole === 'user' ? 'btn-secondary' : 'btn-primary'} google-signin-btn"
                    id="google-login-btn-${targetRole}"
                    ${authBusy ? 'disabled' : ''}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="currentColor" d="M21.35 11.1h-9.17v2.98h5.27c-.23 1.48-1.71 4.34-5.27 4.34-3.17 0-5.76-2.63-5.76-5.86s2.59-5.86 5.76-5.86c1.81 0 3.02.77 3.71 1.44l2.53-2.44C16.8 4.18 14.7 3.2 12.18 3.2 7.22 3.2 3.2 7.22 3.2 12.18s4.02 8.98 8.98 8.98c5.18 0 8.62-3.64 8.62-8.77 0-.59-.06-1.04-.15-1.29z"/>
                    </svg>
                    <span>${
                      authBusy
                        ? 'Menghubungkan...'
                        : targetRole === 'user'
                        ? 'Masuk dengan Google'
                        : escapeHtml(portal.cta)
                    }</span>
                  </button>
                  <p class="auth-footnote">
                    ${
                      targetRole === 'user'
                        ? 'Kamu bisa login dengan Email & Password atau akun Google.'
                        : 'Otentikasi portal khusus menggunakan akun Google yang terverifikasi.'
                    }
                  </p>`
            }
          </div>
        </section>
      </div>
    </div>
  `;

  container.querySelectorAll('[data-go]').forEach((btn) => {
    btn.addEventListener('click', () => navigate(btn.dataset.go));
  });

  container.querySelectorAll('[data-auth-mode]').forEach((btn) => {
    btn.addEventListener('click', () => setUserLoginMode(btn.dataset.authMode));
  });

  container.querySelectorAll('[data-toggle-pw]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.togglePw);
      if (!target) return;
      const isHidden = target.type === 'password';
      target.type = isHidden ? 'text' : 'password';
      btn.textContent = isHidden ? 'Tutup' : 'Lihat';
    });
  });

  document.getElementById('user-login-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') || '').trim();
    const password = String(formData.get('password') || '');
    if (!email || password.length < 6) {
      showToast('Masukkan email dan password minimal 6 karakter');
      return;
    }
    loginWithCredentials(email, password, 'user');
  });

  document.getElementById('user-register-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get('name') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const password = String(formData.get('password') || '');
    const confirmPassword = String(formData.get('confirmPassword') || '');

    if (name.length < 2) {
      showToast('Nama lengkap minimal 2 karakter');
      return;
    }
    if (password.length < 6) {
      showToast('Password minimal 6 karakter');
      return;
    }
    if (password !== confirmPassword) {
      showToast('Konfirmasi password tidak cocok');
      return;
    }
    registerUserAccount({ name, email, password });
  });

  document
    .getElementById(`google-login-btn-${targetRole}`)
    ?.addEventListener('click', () => loginWithGoogle(targetRole));

  document
    .getElementById(`role-logout-btn-${targetRole}`)
    ?.addEventListener('click', logout);
}
