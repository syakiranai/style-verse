import { ITEMS, getItemPalette } from '../data/catalog.js';
import {
  COURIER_OPTIONS,
  ORDER_STATUS_META,
  PAYMENT_METHODS,
} from '../data/looks.js';
import { getGarmentThumbnailUri } from '../engine/garmentEngine.js';
import {
  cancelUnpaidOrder,
  confirmOrderPayment,
  getState,
  navigate,
  removeCartItem,
  setActiveReceiptOrder,
  setCheckoutCourier,
  setCheckoutPayment,
  submitCheckoutOrder,
  updateCartItemQty,
} from '../state/store.js';
import { escapeHtml, formatRupiah, showToast } from '../utils/format.js';

function renderQrisGraphicSVG(orderNumber) {
  return `
    <svg viewBox="0 0 140 140" class="qris-svg" aria-label="Kode QRIS ${escapeHtml(orderNumber)}">
      <rect width="140" height="140" rx="12" fill="#ffffff" stroke="#d98ca9" stroke-width="2"/>
      <rect x="14" y="14" width="32" height="32" rx="4" fill="none" stroke="#6b2d47" stroke-width="4"/>
      <rect x="22" y="22" width="16" height="16" rx="2" fill="#c94b78"/>
      <rect x="94" y="14" width="32" height="32" rx="4" fill="none" stroke="#6b2d47" stroke-width="4"/>
      <rect x="102" y="22" width="16" height="16" rx="2" fill="#c94b78"/>
      <rect x="14" y="94" width="32" height="32" rx="4" fill="none" stroke="#6b2d47" stroke-width="4"/>
      <rect x="22" y="102" width="16" height="16" rx="2" fill="#c94b78"/>
      <path d="M56 18h8v8h-8zM72 18h10v8H72zM56 34h12v8H56zM76 34h8v12h-8zM18 58h12v8H18zM38 58h14v8H38zM60 56h20v20H60zM88 58h14v10H88zM110 58h14v14h-14zM22 74h10v10H22zM40 74h12v12H40zM88 76h18v8H88zM56 88h14v10H56zM78 90h10v14H78zM98 94h24v8H98zM56 108h16v14H56zM82 112h14v10H82zM104 110h18v12h-18z" fill="#6b2d47"/>
      <circle cx="70" cy="66" r="5" fill="#ff9ebe"/>
    </svg>
  `;
}

function renderReceiptBanner(order) {
  if (!order) return '';
  const statusInfo = ORDER_STATUS_META[order.status] || { label: order.status, tone: 'ok' };
  const payMethod = PAYMENT_METHODS.find((m) => m.id === order.paymentMethod);
  const isPending = order.status === 'pending_payment';

  return `
    <section class="panel receipt-panel" aria-live="polite">
      <div class="receipt-head">
        <div>
          <div class="look-kicker">Transaksi · ${escapeHtml(order.orderNumber)}</div>
          <h2>${
            isPending
              ? 'Selesaikan Pembayaran Kamu ♡'
              : `Pesanan ${escapeHtml(statusInfo.label)} ♡`
          }</h2>
          <p style="color: var(--color-ink-muted); font-size: 13px;">
            Metode: ${escapeHtml(payMethod?.name || order.paymentMethod)} · Status: <strong>${escapeHtml(
    statusInfo.label
  )}</strong>
          </p>
        </div>
        <button type="button" class="btn-secondary" id="close-receipt-btn">Tutup Ringkasan</button>
      </div>

      <div class="receipt-grid">
        <div class="receipt-payment-box">
          ${
            order.paymentMethod === 'qris'
              ? `${renderQrisGraphicSVG(order.orderNumber)}
                 <p class="receipt-code-caption">Scan QRIS Styleverse Boutique</p>`
              : `<div class="receipt-code-label">Kode / Referensi Pembayaran</div>`
          }
          <strong class="receipt-code tabular-nums">${escapeHtml(order.paymentCode)}</strong>
          <div class="receipt-total-tag tabular-nums">Total: ${formatRupiah(order.totalAmount)}</div>
          ${
            isPending
              ? `<div class="actions-row" style="justify-content: center; margin-top: 12px;">
                  <button type="button" class="btn-primary" data-confirm-pay="${escapeHtml(
                    order.id
                  )}">Saya Sudah Bayar</button>
                  <button type="button" class="btn-secondary" data-cancel-order="${escapeHtml(
                    order.id
                  )}">Batalkan</button>
                </div>`
              : `<p class="receipt-paid-note">Pembayaran terverifikasi. Paket akan dikirim ke ${escapeHtml(
                  order.shippingCity
                )}.</p>`
          }
        </div>

        <div>
          <h3>Detail Item (${order.items?.length || 0})</h3>
          <ul class="receipt-items">
            ${(order.items || [])
              .map(
                (it) => `
              <li>
                <span>${escapeHtml(it.name)} × ${Number(it.qty) || 1}</span>
                <strong class="tabular-nums">${formatRupiah(
                  (Number(it.unitPrice) || 0) * (Number(it.qty) || 1)
                )}</strong>
              </li>
            `
              )
              .join('')}
          </ul>
          <div class="receipt-summary-lines">
            <div><span>Subtotal</span><span class="tabular-nums">${formatRupiah(
              order.subtotal
            )}</span></div>
            <div><span>Ongkos Kirim</span><span class="tabular-nums">${
              order.shippingFee === 0 ? 'Gratis' : formatRupiah(order.shippingFee)
            }</span></div>
            <div><span>Biaya Layanan</span><span class="tabular-nums">${formatRupiah(
              order.serviceFee
            )}</span></div>
            <div class="is-total"><strong>Total Pembayaran</strong><strong class="tabular-nums">${formatRupiah(
              order.totalAmount
            )}</strong></div>
          </div>
        </div>
      </div>
    </section>
  `;
}

export function renderCartView() {
  const container = document.getElementById('view-cart');
  if (!container) return;

  const {
    cart,
    orders,
    activeReceiptOrderId,
    checkoutBusy,
    checkoutSelectedPayment,
    checkoutSelectedCourier,
    currentUser,
    userProfile,
  } = getState();

  const activeReceiptOrder = orders.find((o) => o.id === activeReceiptOrderId) || null;

  const cartLines = cart
    .map((entry) => {
      const item = ITEMS[entry.itemId];
      if (!item) return null;
      const palette = getItemPalette(item);
      const colorHex = palette[entry.colorIdx] || item.base;
      const qty = Math.max(1, Number(entry.qty) || 1);
      return {
        ...entry,
        item,
        colorHex,
        qty,
        lineTotal: item.price * qty,
      };
    })
    .filter(Boolean);

  const subtotal = cartLines.reduce((sum, l) => sum + l.lineTotal, 0);
  const courierCfg =
    COURIER_OPTIONS.find((c) => c.id === checkoutSelectedCourier) || COURIER_OPTIONS[0];
  const isFreeShipping =
    cartLines.length > 0 && courierCfg.freeThreshold > 0 && subtotal >= courierCfg.freeThreshold;
  const shippingFee = cartLines.length ? (isFreeShipping ? 0 : courierCfg.fee) : 0;
  const serviceFee = cartLines.length ? 2000 : 0;
  const totalAmount = subtotal + shippingFee + serviceFee;

  const defaultName = userProfile?.displayName || currentUser?.displayName || '';

  container.innerHTML = `
    <div class="wrap">
      <div class="page-head page-head--row">
        <div>
          <h1>Tas Belanja &amp; Pembayaran ♡</h1>
          <p>Pilih metode pembayaran favoritmu dan selesaikan transaksi dengan aman.</p>
        </div>
        <button type="button" class="btn-secondary" data-go="studio">+ Tambah dari Studio</button>
      </div>

      ${renderReceiptBanner(activeReceiptOrder)}

      <div class="checkout-layout">
        <div class="checkout-main">
          <section class="panel">
            <h3>1. Item di Tas (${cartLines.reduce((s, l) => s + l.qty, 0)})</h3>
            ${
              cartLines.length
                ? `<div class="cart-list">
                    ${cartLines
                      .map(
                        (line) => `
                      <article class="cart-row">
                        <img
                          class="cart-thumb"
                          src="${getGarmentThumbnailUri(line.item.id, line.colorIdx)}"
                          alt="${escapeHtml(line.item.name)}"
                        />
                        <div class="cart-row-info">
                          <div class="look-kicker">${escapeHtml(line.item.cat)}</div>
                          <strong>${escapeHtml(line.item.name)}</strong>
                          <div class="cart-color-line">
                            <span>Warna pilihan</span>
                            <span class="cart-color-dot" style="background:${line.colorHex}" aria-hidden="true"></span>
                            <span class="tabular-nums">${formatRupiah(line.item.price)}</span>
                          </div>
                        </div>
                        <div class="cart-qty-controls">
                          <button
                            type="button"
                            class="qty-btn"
                            data-qty-dec="${line.item.id}:${line.colorIdx}"
                            aria-label="Kurangi jumlah"
                          >−</button>
                          <span class="tabular-nums">${line.qty}</span>
                          <button
                            type="button"
                            class="qty-btn"
                            data-qty-inc="${line.item.id}:${line.colorIdx}"
                            aria-label="Tambah jumlah"
                          >+</button>
                        </div>
                        <div class="cart-row-total">
                          <strong class="tabular-nums">${formatRupiah(line.lineTotal)}</strong>
                          <button
                            type="button"
                            class="text-action"
                            data-remove-cart="${line.item.id}:${line.colorIdx}"
                          >Hapus</button>
                        </div>
                      </article>
                    `
                      )
                      .join('')}
                  </div>`
                : `<div class="empty-state">
                    <p>Tas belanja kamu masih kosong. Pilih outfit di Studio atau New Arrivals untuk mulai berbelanja.</p>
                    <div class="actions-row" style="justify-content: center;">
                      <button type="button" class="btn-primary" data-go="studio">Buka Dressing Studio</button>
                      <button type="button" class="btn-secondary" data-go="explore">Lihat Look Book</button>
                    </div>
                  </div>`
            }
          </section>

          <form class="panel" id="checkout-form" style="margin-top: 20px;">
            <h3>2. Pengiriman &amp; Metode Pembayaran</h3>

            <div class="form-row-2">
              <div class="form-field">
                <label for="co-name">Nama Penerima</label>
                <input id="co-name" name="buyerName" type="text" required minlength="2" maxlength="80" placeholder="Nama lengkap penerima" value="${escapeHtml(
                  defaultName
                )}" />
              </div>
              <div class="form-field">
                <label for="co-phone">Nomor WhatsApp / HP</label>
                <input id="co-phone" name="phone" type="tel" required minlength="6" maxlength="30" placeholder="0812xxxxxxxx" />
              </div>
            </div>

            <div class="form-row-2">
              <div class="form-field">
                <label for="co-city">Kota / Kecamatan &amp; Kode Pos</label>
                <input id="co-city" name="shippingCity" type="text" required minlength="2" maxlength="80" placeholder="Jakarta Selatan, 12190" />
              </div>
              <div class="form-field">
                <label for="co-courier">Pilih Kurir Pengiriman</label>
                <select id="co-courier" name="courier">
                  ${COURIER_OPTIONS.map((c) => {
                    const freeEligible = c.freeThreshold > 0 && subtotal >= c.freeThreshold;
                    return `<option value="${c.id}" ${
                      checkoutSelectedCourier === c.id ? 'selected' : ''
                    }>${escapeHtml(c.name)} (${escapeHtml(c.eta)}) — ${
                      freeEligible ? 'Gratis' : formatRupiah(c.fee)
                    }</option>`;
                  }).join('')}
                </select>
              </div>
            </div>

            <div class="form-field">
              <label for="co-address">Alamat Pengiriman Lengkap</label>
              <textarea id="co-address" name="shippingAddress" rows="2" required minlength="5" maxlength="300" placeholder="Nama jalan, nomor rumah, RT/RW, patokan..."></textarea>
            </div>

            <div class="form-field">
              <label for="co-notes">Catatan Pembeli (Opsional)</label>
              <input id="co-notes" name="notes" type="text" maxlength="200" placeholder="Contoh: Bungkus kado pita pink" />
            </div>

            <div style="margin-top: 18px;">
              <strong style="display: block; font-size: 13px; color: var(--color-brand); margin-bottom: 10px;">
                Pilih Metode Pembayaran
              </strong>
              <div class="payment-grid" role="radiogroup" aria-label="Metode pembayaran">
                ${PAYMENT_METHODS.map((pm) => {
                  const active = checkoutSelectedPayment === pm.id;
                  return `
                    <label class="payment-option ${active ? 'is-active' : ''}">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="${pm.id}"
                        ${active ? 'checked' : ''}
                        data-select-payment="${pm.id}"
                      />
                      <div>
                        <strong>${escapeHtml(pm.name)}</strong>
                        <span>${escapeHtml(pm.subtitle)}</span>
                      </div>
                      <small>${escapeHtml(pm.badge)}</small>
                    </label>
                  `;
                }).join('')}
              </div>
            </div>

            ${
              checkoutSelectedPayment === 'card'
                ? `<div class="card-fields-box">
                    <div class="form-row-2">
                      <div class="form-field">
                        <label for="co-card-holder">Nama Pemegang Kartu</label>
                        <input id="co-card-holder" name="cardHolder" type="text" required placeholder="Sesuai kartu" />
                      </div>
                      <div class="form-field">
                        <label for="co-card-last4">4 Digit Terakhir Kartu</label>
                        <input id="co-card-last4" name="cardLast4" type="text" required pattern="[0-9]{4}" maxlength="4" placeholder="4242" />
                      </div>
                    </div>
                  </div>`
                : ''
            }
          </form>
        </div>

        <aside class="panel checkout-sidebar">
          <h3>Ringkasan Pesanan</h3>
          <div class="receipt-summary-lines">
            <div>
              <span>Subtotal Produk</span>
              <span class="tabular-nums">${formatRupiah(subtotal)}</span>
            </div>
            <div>
              <span>Ongkos Kirim</span>
              <span class="tabular-nums">${
                !cartLines.length
                  ? formatRupiah(0)
                  : shippingFee === 0
                  ? 'Gratis (Belanja ≥ Rp 500rb)'
                  : formatRupiah(shippingFee)
              }</span>
            </div>
            <div>
              <span>Biaya Layanan</span>
              <span class="tabular-nums">${formatRupiah(serviceFee)}</span>
            </div>
            <div class="is-total">
              <strong>Total Tagihan</strong>
              <strong class="tabular-nums">${formatRupiah(totalAmount)}</strong>
            </div>
          </div>

          <p class="auth-footnote" style="margin: 12px 0 16px;">
            ${
              currentUser
                ? `Transaksi akan dicatat ke akun ${escapeHtml(currentUser.email || '')}.`
                : 'Masuk akun User Biasa terlebih dahulu agar transaksi dan resi tersimpan aman.'
            }
          </p>

          ${
            currentUser
              ? `<button
                  type="submit"
                  form="checkout-form"
                  class="btn-primary"
                  style="width: 100%;"
                  ${!cartLines.length || checkoutBusy ? 'disabled' : ''}
                >${
                  checkoutBusy ? 'Memproses pesanan...' : 'Buat Pesanan & Bayar Sekarang'
                }</button>`
              : `<button type="button" class="btn-primary" style="width: 100%;" data-go="login-user">
                  Login User untuk Checkout
                </button>`
          }
        </aside>
      </div>

      <div class="section-head">
        <h2>Riwayat Transaksi</h2>
        <span class="section-subtitle">${
          currentUser ? `${orders.length} pesanan tersimpan` : 'Login untuk melihat riwayat transaksi'
        }</span>
      </div>

      <div class="admin-list" id="cart-orders">
        ${
          !currentUser
            ? `<div class="empty-state"><p>Masuk ke akun untuk melacak status pembayaran dan pengiriman pesanan kamu.</p></div>`
            : orders.length
            ? orders
                .map((ord) => {
                  const statusMeta = ORDER_STATUS_META[ord.status] || { label: ord.status, tone: 'ok' };
                  const pm = PAYMENT_METHODS.find((m) => m.id === ord.paymentMethod);
                  return `
                    <article class="admin-row">
                      <div>
                        <div class="look-kicker">
                          ${escapeHtml(ord.orderNumber)} · ${escapeHtml(statusMeta.label)} · ${escapeHtml(
                    pm?.name || ord.paymentMethod
                  )}
                        </div>
                        <strong>${(ord.items || [])
                          .map((i) => `${escapeHtml(i.name)} ×${i.qty}`)
                          .join(', ')}</strong>
                        <p class="admin-row-sub tabular-nums">
                          Total ${formatRupiah(ord.totalAmount)} · Kirim ke ${escapeHtml(
                    ord.buyerName
                  )} (${escapeHtml(ord.shippingCity)})
                        </p>
                      </div>
                      <div class="actions-row">
                        ${
                          ord.status === 'pending_payment'
                            ? `<button type="button" class="btn-primary" data-confirm-pay="${escapeHtml(
                                ord.id
                              )}">Bayar Sekarang</button>`
                            : ''
                        }
                        <button type="button" class="btn-secondary" data-view-receipt="${escapeHtml(
                          ord.id
                        )}">Lihat Struk</button>
                      </div>
                    </article>
                  `;
                })
                .join('')
            : `<div class="empty-state"><p>Belum ada transaksi pembelian. Yuk mulai checkout item favoritmu!</p></div>`
        }
      </div>
    </div>
  `;

  container.querySelectorAll('[data-go]').forEach((btn) => {
    btn.addEventListener('click', () => navigate(btn.dataset.go));
  });

  container.querySelectorAll('[data-qty-dec]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const [id, col] = btn.dataset.qtyDec.split(':').map(Number);
      updateCartItemQty(id, col, -1);
    });
  });

  container.querySelectorAll('[data-qty-inc]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const [id, col] = btn.dataset.qtyInc.split(':').map(Number);
      updateCartItemQty(id, col, 1);
    });
  });

  container.querySelectorAll('[data-remove-cart]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const [id, col] = btn.dataset.removeCart.split(':').map(Number);
      removeCartItem(id, col);
    });
  });

  document.getElementById('co-courier')?.addEventListener('change', (event) => {
    setCheckoutCourier(event.target.value);
  });

  container.querySelectorAll('[data-select-payment]').forEach((radio) => {
    radio.addEventListener('change', (event) => {
      setCheckoutPayment(event.target.value);
    });
  });

  document.getElementById('checkout-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const buyerName = String(formData.get('buyerName') || '').trim();
    const phone = String(formData.get('phone') || '').trim();
    const shippingCity = String(formData.get('shippingCity') || '').trim();
    const shippingAddress = String(formData.get('shippingAddress') || '').trim();
    const notes = String(formData.get('notes') || '').trim();
    const cardLast4 = String(formData.get('cardLast4') || '').trim();

    if (buyerName.length < 2 || phone.length < 6 || shippingAddress.length < 5) {
      showToast('Lengkapi nama, nomor HP, dan alamat pengiriman');
      return;
    }

    await submitCheckoutOrder({
      buyerName,
      phone,
      shippingCity,
      shippingAddress,
      notes,
      cardLast4,
    });
  });

  document.getElementById('close-receipt-btn')?.addEventListener('click', () => {
    setActiveReceiptOrder(null);
  });

  container.querySelectorAll('[data-confirm-pay]').forEach((btn) => {
    btn.addEventListener('click', () => confirmOrderPayment(btn.dataset.confirmPay));
  });

  container.querySelectorAll('[data-cancel-order]').forEach((btn) => {
    btn.addEventListener('click', () => cancelUnpaidOrder(btn.dataset.cancelOrder));
  });

  container.querySelectorAll('[data-view-receipt]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setActiveReceiptOrder(btn.dataset.viewReceipt);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}
