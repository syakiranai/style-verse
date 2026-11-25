import { ITEMS } from '../data/catalog.js';
import { ROLE_META } from '../data/looks.js';
import {
  changeUserRole,
  getAllLooks,
  getState,
  navigate,
  refreshAdminUsers,
} from '../state/store.js';
import { escapeHtml } from '../utils/format.js';

export function renderAdminView() {
  const container = document.getElementById('view-admin');
  if (!container) return;

  const { role, currentUser, adminUsers, adminLoading, operatorOrders } = getState();
  if (role !== 'admin') {
    container.innerHTML = '';
    return;
  }

  const totalAdmin = adminUsers.filter((u) => u.role === 'admin').length;
  const totalOp = adminUsers.filter((u) => u.role === 'operator').length;
  const totalUser = adminUsers.filter((u) => u.role === 'user').length;

  container.innerHTML = `
    <div class="wrap">
      <div class="page-head page-head--row">
        <div>
          <h1>Admin Console</h1>
          <p>Kelola otorisasi role akun (User Biasa, Operator, Admin) dan awasi katalog Styleverse.</p>
        </div>
        <div class="actions-row">
          <button type="button" class="btn-secondary" id="admin-refresh-btn">Muat ulang</button>
          <button type="button" class="btn-secondary" data-go="operator">Workspace Operator</button>
        </div>
      </div>

      <div class="stats-strip">
        <div class="stat-cell">
          <span>Total Akun</span>
          <strong class="tabular-nums">${adminUsers.length}</strong>
        </div>
        <div class="stat-cell">
          <span>Admin</span>
          <strong class="tabular-nums">${totalAdmin}</strong>
        </div>
        <div class="stat-cell">
          <span>Operator</span>
          <strong class="tabular-nums">${totalOp}</strong>
        </div>
        <div class="stat-cell">
          <span>User Biasa</span>
          <strong class="tabular-nums">${totalUser}</strong>
        </div>
        <div class="stat-cell">
          <span>Look Book / Item</span>
          <strong class="tabular-nums">${getAllLooks().length} / ${ITEMS.length}</strong>
        </div>
        <div class="stat-cell">
          <span>Transaksi</span>
          <strong class="tabular-nums">${operatorOrders.length}</strong>
        </div>
      </div>

      <section class="panel" style="margin-top: 24px;">
        <h3>Manajemen User &amp; Role</h3>
        <p style="margin-bottom: 16px; color: var(--color-ink-muted);">
          Tetapkan role pengguna secara langsung. Perubahan role segera berlaku pada sesi pengguna tersebut.
        </p>

        ${
          adminLoading
            ? '<p style="color: var(--color-ink-muted);">Memuat daftar akun...</p>'
            : adminUsers.length
            ? `<div class="admin-list">
                ${adminUsers
                  .map((userDoc) => {
                    const isSelf = userDoc.uid === currentUser?.uid;
                    const currentRoleLabel = ROLE_META[userDoc.role]?.label || userDoc.role;
                    return `
                      <article class="admin-row">
                        <div>
                          <div class="look-kicker">${escapeHtml(currentRoleLabel)}${
                      isSelf ? ' · Akun Anda' : ''
                    }</div>
                          <strong>${escapeHtml(userDoc.displayName || 'Tanpa Nama')}</strong>
                          <p class="admin-row-sub">${escapeHtml(userDoc.email || '')}</p>
                        </div>
                        <div class="actions-row">
                          <label class="sr-only" for="role-select-${escapeHtml(userDoc.uid)}">
                            Pilih role untuk ${escapeHtml(userDoc.displayName || userDoc.email)}
                          </label>
                          <select
                            id="role-select-${escapeHtml(userDoc.uid)}"
                            class="role-select"
                            data-role-select="${escapeHtml(userDoc.uid)}"
                            ${isSelf ? 'disabled' : ''}
                          >
                            <option value="user" ${
                              userDoc.role === 'user' ? 'selected' : ''
                            }>User Biasa</option>
                            <option value="operator" ${
                              userDoc.role === 'operator' ? 'selected' : ''
                            }>Operator</option>
                            <option value="admin" ${
                              userDoc.role === 'admin' ? 'selected' : ''
                            }>Admin</option>
                          </select>
                          <button
                            type="button"
                            class="btn-secondary"
                            data-save-role="${escapeHtml(userDoc.uid)}"
                            ${isSelf ? 'disabled' : ''}
                          >Simpan Role</button>
                        </div>
                      </article>
                    `;
                  })
                  .join('')}
              </div>`
            : '<div class="empty-state"><p>Belum ada pengguna terdaftar.</p></div>'
        }
      </section>
    </div>
  `;

  container.querySelectorAll('[data-go]').forEach((btn) => {
    btn.addEventListener('click', () => navigate(btn.dataset.go));
  });

  document.getElementById('admin-refresh-btn')?.addEventListener('click', refreshAdminUsers);

  container.querySelectorAll('[data-save-role]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const uid = btn.dataset.saveRole;
      const select = container.querySelector(`[data-role-select="${uid}"]`);
      if (select) {
        changeUserRole(uid, select.value);
      }
    });
  });
}
