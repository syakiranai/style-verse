import { parseLookId, renderGarmentTile, renderLookCard } from '../components/cards.js';
import { ITEMS } from '../data/catalog.js';
import {
  addToCart,
  getAllLooks,
  getState,
  navigate,
  openLookModal,
  toggleFavoriteLook,
  toggleWishlistItem,
  tryItemInStudio,
} from '../state/store.js';

export function renderFavoritesView() {
  const container = document.getElementById('view-favorites');
  if (!container) return;

  const { favs, wish, currentUser } = getState();
  const savedLooks = getAllLooks().filter((look) => favs.includes(look.id));
  const wishlistItems = ITEMS.filter((item) => wish.includes(item.id));

  container.innerHTML = `
    <div class="wrap">
      <div class="page-head page-head--row">
        <div>
          <h1>Saved with love ♡</h1>
          <p>${
            currentUser
              ? 'Tersinkron ke akun Styleverse kamu secara otomatis.'
              : 'Tersimpan secara lokal di browser. Login untuk menyinkronkan antar perangkat.'
          }</p>
        </div>
        ${
          !currentUser
            ? '<button type="button" class="btn-secondary" data-go="login">Login untuk sinkronisasi</button>'
            : ''
        }
      </div>

      <div class="section-head">
        <h2>Looks</h2>
      </div>
      <div class="grid-looks" id="fav-looks-grid">
        ${
          savedLooks.length
            ? savedLooks.map((look) => renderLookCard(look)).join('')
            : `<div class="empty-state">
                <p>Belum ada look tersimpan. Tekan ♡ pada look di Explore.</p>
                <button type="button" class="btn-secondary" data-go="explore">Jelajahi Explore</button>
              </div>`
        }
      </div>

      <div class="section-head">
        <h2>Wishlist items</h2>
      </div>
      <div class="grid-looks" id="fav-items-grid">
        ${
          wishlistItems.length
            ? wishlistItems.map((item) => renderGarmentTile(item)).join('')
            : `<div class="empty-state">
                <p>Belum ada item di wishlist. Tekan ♡ pada item di Studio.</p>
                <button type="button" class="btn-secondary" data-go="studio">Buka Studio</button>
              </div>`
        }
      </div>
    </div>
  `;

  container.querySelectorAll('[data-go]').forEach((btn) => {
    btn.addEventListener('click', () => navigate(btn.dataset.go));
  });

  container.querySelectorAll('[data-look-id]').forEach((card) => {
    card.addEventListener('click', () => openLookModal(parseLookId(card.dataset.lookId)));
  });

  container.querySelectorAll('[data-toggle-fav]').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleFavoriteLook(parseLookId(btn.dataset.toggleFav));
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
