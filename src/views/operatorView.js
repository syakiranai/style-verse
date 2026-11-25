import { OCCASION_TYPES, ORDER_STATUS_META, PAYMENT_METHODS, SCENE_OPTIONS } from '../data/looks.js';
import {
  deleteOperatorLook,
  getState,
  navigate,
  refreshOperatorLooks,
  refreshWorkspaceOrders,
  saveOperatorLook,
  setOperatorEditingId,
  updateWorkspaceOrderStatus,
} from '../state/store.js';
import { escapeHtml, formatRupiah, showToast } from '../utils/format.js';

export function renderOperatorView() {
  const container = document.getElementById('view-operator');
  if (!container) return;

  const { role, operatorLooks, operatorOrders, operatorLoading, operatorEditingId } = getState();
  if (role !== 'operator' && role !== 'admin') {
    container.innerHTML = '';
    return;
  }

  const editingLook = operatorLooks.find((l) => l.id === operatorEditingId) || null;
  const publishedCount = operatorLooks.filter((l) => l.status === 'published').length;
  const draftCount = operatorLooks.filter((l) => l.status === 'draft').length;

  container.innerHTML = `
    <div class="wrap">
      <div class="page-head page-head--row">
        <div>
          <h1>Operator Lookbook Studio</h1>
          <p>Kurasi Look Book dan pantau status pesanan pelanggan Styleverse.</p>
        </div>
        <div class="actions-row">
          <button type="button" class="btn-secondary" id="op-refresh-btn">Muat ulang</button>
          <button type="button" class="btn-secondary" data-go="explore">Lihat Explore</button>
        </div>
      </div>

      <div class="stats-strip">
        <div class="stat-cell">
          <span>Total Curated Looks</span>
          <strong class="tabular-nums">${operatorLooks.length}</strong>
        </div>
        <div class="stat-cell">
          <span>Published</span>
          <strong class="tabular-nums">${publishedCount}</strong>
        </div>
        <div class="stat-cell">
          <span>Draft</span>
          <strong class="tabular-nums">${draftCount}</strong>
        </div>
        <div class="stat-cell">
          <span>Transaksi Terpantau</span>
          <strong class="tabular-nums">${operatorOrders.length}</strong>
        </div>
      </div>

      <div class="studio-layout" style="margin-top: 24px;">
        <form class="panel" id="operator-look-form">
          <h3>${editingLook ? 'Edit Curated Look' : 'Tambah Curated Look'}</h3>

          <div class="form-field">
            <label for="op-name">Nama Look</label>
            <input
              id="op-name"
              name="name"
              type="text"
              required
              minlength="2"
              maxlength="80"
              placeholder="Contoh: Linen Morning Walk"
              value="${escapeHtml(editingLook?.name || '')}"
            />
          </div>

          <div class="form-row-2">
            <div class="form-field">
              <label for="op-type">Occasion</label>
              <select id="op-type" name="type">
                ${OCCASION_TYPES.map(
                  (t) =>
                    `<option value="${escapeHtml(t)}" ${
                      editingLook?.type === t ? 'selected' : ''
                    }>${escapeHtml(t)}</option>`
                ).join('')}
              </select>
            </div>

            <div class="form-field">
              <label for="op-budget">Estimasi Budget (IDR)</label>
              <input
                id="op-budget"
                name="budget"
                type="number"
                required
                min="0"
                max="50000000"
                step="5000"
                value="${editingLook ? Number(editingLook.budget) : 350000}"
              />
            </div>
          </div>

          <div class="form-row-2">
            <div class="form-field">
              <label for="op-scene">Latar Ilustrasi</label>
              <select id="op-scene" name="scene">
                ${SCENE_OPTIONS.map(
                  (sc) =>
                    `<option value="${sc.value}" ${
                      editingLook?.scene === sc.value ? 'selected' : ''
                    }>${escapeHtml(sc.label)}</option>`
                ).join('')}
              </select>
            </div>

            <div class="form-field">
              <label for="op-status">Status Publikasi</label>
              <select id="op-status" name="status">
                <option value="published" ${
                  editingLook?.status !== 'draft' ? 'selected' : ''
                }>Published (Tampil di Explore)</option>
                <option value="draft" ${
                  editingLook?.status === 'draft' ? 'selected' : ''
                }>Draft (Privat Operator)</option>
              </select>
            </div>
          </div>

          <div class="form-field">
            <label for="op-desc">Deskripsi Editorial</label>
            <textarea
              id="op-desc"
              name="desc"
              rows="3"
              required
              minlength="4"
              maxlength="240"
              placeholder="Deskripsi singkat gaya, bahan, dan suasana outfit..."
            >${escapeHtml(editingLook?.desc || '')}</textarea>
          </div>

          <div class="form-field">
            <label for="op-pieces">Outfit Checklist (pisahkan dengan koma)</label>
            <input
              id="op-pieces"
              name="pieces"
              type="text"
              required
              placeholder="Linen shirt, Pleated skirt, Mary Jane flats"
              value="${escapeHtml((editingLook?.pieces || []).join(', '))}"
            />
          </div>

          <div class="actions-row" style="margin-top: 14px;">
            <button type="submit" class="btn-primary">
              ${editingLook ? 'Simpan Perubahan' : 'Terbitkan Look'}
            </button>
            ${
              editingLook
                ? '<button type="button" class="btn-secondary" id="op-cancel-edit">Batal Edit</button>'
                : ''
            }
          </div>
        </form>

        <section class="panel">
          <h3>Daftar Curated Look</h3>
          ${
            operatorLoading
              ? '<p style="color: var(--color-ink-muted);">Memuat data look...</p>'
              : operatorLooks.length
              ? `<div class="admin-list">
                  ${operatorLooks
                    .map(
                      (look) => `
                    <article class="admin-row">
                      <div>
                        <div class="look-kicker">
                          ${escapeHtml(look.type)} · ${
                        look.status === 'published' ? 'Published' : 'Draft'
                      }
                        </div>
                        <strong>${escapeHtml(look.name)}</strong>
                        <p class="admin-row-sub tabular-nums">${formatRupiah(look.budget)} · ${escapeHtml(
                        (look.pieces || []).join(', ')
                      )}</p>
                      </div>
                      <div class="actions-row">
                        <button type="button" class="btn-secondary" data-op-edit="${escapeHtml(
                          look.id
                        )}">Edit</button>
                        <button type="button" class="btn-secondary" data-op-del="${escapeHtml(
                          look.id
                        )}">Hapus</button>
                      </div>
                    </article>
                  `
                    )
                    .join('')}
                </div>`
              : '<div class="empty-state"><p>Belum ada curated look di cloud. Tambahkan look pertama lewat formulir di samping.</p></div>'
          }
        </section>
      </div>

      <section class="panel" style="margin-top: 24px;">
        <h3>Pesanan &amp; Pengiriman Pelanggan</h3>
        <p style="margin-bottom: 14px; color: var(--color-ink-muted);">
          Kelola pembaruan status transaksi yang masuk dari pembeli.
        </p>
        ${
          operatorOrders.length
            ? `<div class="admin-list">
                ${operatorOrders
                  .map((ord) => {
                    const statusLabel = ORDER_STATUS_META[ord.status]?.label || ord.status;
                    const pm = PAYMENT_METHODS.find((m) => m.id === ord.paymentMethod);
                    const isTerminal = ord.status === 'completed' || ord.status === 'cancelled';
                    return `
                      <article class="admin-row">
                        <div>
                          <div class="look-kicker">
                            ${escapeHtml(ord.orderNumber)} · ${escapeHtml(statusLabel)} · ${escapeHtml(
                      pm?.name || ord.paymentMethod
                    )}
                          </div>
                          <strong>${escapeHtml(ord.buyerName)} — ${formatRupiah(ord.totalAmount)}</strong>
                          <p class="admin-row-sub">
                            ${(ord.items || []).map((i) => `${escapeHtml(i.name)} ×${i.qty}`).join(', ')} · ${escapeHtml(
                      ord.shippingCity
                    )}
                          </p>
                        </div>
                        <div class="actions-row">
                          <label class="sr-only" for="ord-status-${escapeHtml(ord.id)}">Status pesanan</label>
                          <select
                            id="ord-status-${escapeHtml(ord.id)}"
                            class="role-select"
                            data-ord-select="${escapeHtml(ord.id)}"
                            ${isTerminal && role !== 'admin' ? 'disabled' : ''}
                          >
                            ${Object.entries(ORDER_STATUS_META)
                              .map(
                                ([key, meta]) =>
                                  `<option value="${key}" ${
                                    ord.status === key ? 'selected' : ''
                                  }>${escapeHtml(meta.label)}</option>`
                              )
                              .join('')}
                          </select>
                          <button
                            type="button"
                            class="btn-secondary"
                            data-ord-save="${escapeHtml(ord.id)}"
                            ${isTerminal && role !== 'admin' ? 'disabled' : ''}
                          >Simpan Status</button>
                        </div>
                      </article>
                    `;
                  })
                  .join('')}
              </div>`
            : '<div class="empty-state"><p>Belum ada pesanan tercatat.</p></div>'
        }
      </section>
    </div>
  `;

  container.querySelectorAll('[data-go]').forEach((btn) => {
    btn.addEventListener('click', () => navigate(btn.dataset.go));
  });

  document.getElementById('op-refresh-btn')?.addEventListener('click', () => {
    refreshOperatorLooks();
    refreshWorkspaceOrders();
  });

  document.getElementById('op-cancel-edit')?.addEventListener('click', () => {
    setOperatorEditingId(null);
  });

  document.getElementById('operator-look-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    const name = String(formData.get('name') || '').trim();
    const desc = String(formData.get('desc') || '').trim();
    const pieces = String(formData.get('pieces') || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (name.length < 2 || desc.length < 4 || !pieces.length) {
      showToast('Lengkapi nama, deskripsi, dan checklist look');
      return;
    }

    const payload = {
      name,
      type: String(formData.get('type') || OCCASION_TYPES[0]),
      budget: Number(formData.get('budget') || 0),
      scene: String(formData.get('scene') || 'terrace'),
      status: String(formData.get('status') || 'published'),
      desc,
      pieces,
      outfitSpec: editingLook?.outfitSpec || { top: [6, 0], bottom: [25, 0], shoes: [64, 0] },
    };

    const ok = await saveOperatorLook(payload, editingLook?.id || null);
    if (ok && !editingLook) {
      form.reset();
    }
  });

  container.querySelectorAll('[data-op-edit]').forEach((btn) => {
    btn.addEventListener('click', () => setOperatorEditingId(btn.dataset.opEdit));
  });

  container.querySelectorAll('[data-op-del]').forEach((btn) => {
    btn.addEventListener('click', () => deleteOperatorLook(btn.dataset.opDel));
  });

  container.querySelectorAll('[data-ord-save]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const orderId = btn.dataset.ordSave;
      const select = container.querySelector(`[data-ord-select="${orderId}"]`);
      if (select) {
        updateWorkspaceOrderStatus(orderId, select.value);
      }
    });
  });
}
