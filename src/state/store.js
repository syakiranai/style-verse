import { ITEMS } from '../data/catalog.js';
import {
  ALL_VIEW_IDS,
  COURIER_OPTIONS,
  LOOKS,
  PAYMENT_METHODS,
  ROLE_META,
} from '../data/looks.js';
import { evaluateMannequinStyle } from '../engine/styleChecker.js';
import {
  BOOTSTRAP_ADMIN_EMAIL,
  createOrderInCloud,
  deleteCuratedLookFromCloud,
  deleteUserOutfitFromCloud,
  ensureUserProfile,
  fetchAllUsersForAdmin,
  fetchOperatorLooks,
  fetchWorkspaceOrders,
  loginWithEmailPassword,
  registerWithEmailPassword,
  resendVerificationEmail,
  saveCuratedLookToCloud,
  saveUserOutfitToCloud,
  signInWithGoogle,
  signOutUser,
  subscribeAuthState,
  subscribePublishedLooks,
  subscribeUserOrders,
  subscribeUserOutfits,
  subscribeUserProfile,
  updateOrderStatusInCloud,
  updateUserPreferences,
  updateUserRoleByAdmin,
} from '../services/firebase.js';
import { showToast } from '../utils/format.js';

const STORAGE_KEYS = {
  favs: 'sv2-favs',
  wish: 'sv2-wish',
  worn: 'sv2-worn',
  colors: 'sv2-ci',
  outfits: 'sv2-outs',
  wearCount: 'sv2-wear',
  cart: 'sv2-cart',
  bodyType: 'sv2-body',
};

const VALID_VIEWS = new Set(ALL_VIEW_IDS);
const VALID_BODY_TYPES = new Set(['hourglass', 'pear', 'apple', 'rectangle', 'inverted', 'petite']);

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    const parsed = JSON.parse(raw);
    return parsed == null ? fallback : parsed;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage errors gracefully
  }
}

function getInitialViewFromHash() {
  const hash = window.location.hash.replace('#', '').trim();
  return VALID_VIEWS.has(hash) ? hash : 'home';
}

const savedFavs = readStorage(STORAGE_KEYS.favs, []);
const savedWish = readStorage(STORAGE_KEYS.wish, []);
const savedWorn = readStorage(STORAGE_KEYS.worn, {});
const savedColors = readStorage(STORAGE_KEYS.colors, {});
const savedOutfits = readStorage(STORAGE_KEYS.outfits, []);
const savedWearCount = readStorage(STORAGE_KEYS.wearCount, {});
const savedCart = readStorage(STORAGE_KEYS.cart, []);
const savedBodyType = readStorage(STORAGE_KEYS.bodyType, 'hourglass');

const state = {
  view: getInitialViewFromHash(),
  mobileMenuOpen: false,
  authReady: false,
  authBusy: false,
  authError: '',
  roleMismatchNotice: '',
  loginPortalTarget: null,
  userLoginMode: 'login', // 'login' | 'register'
  currentUser: null,
  userProfile: null,
  role: 'guest', // 'guest' | 'user' | 'operator' | 'admin'
  favs: Array.isArray(savedFavs) ? savedFavs : [],
  wish: Array.isArray(savedWish) ? savedWish : [],
  worn: savedWorn && typeof savedWorn === 'object' ? savedWorn : {},
  colorIndexByItem: savedColors && typeof savedColors === 'object' ? savedColors : {},
  outfits: Array.isArray(savedOutfits) ? savedOutfits : [],
  wearCount: savedWearCount && typeof savedWearCount === 'object' ? savedWearCount : {},
  cart: Array.isArray(savedCart) ? savedCart.filter((c) => ITEMS[c?.itemId]) : [],
  orders: [],
  activeReceiptOrderId: null,
  checkoutBusy: false,
  checkoutSelectedPayment: 'qris',
  checkoutSelectedCourier: 'reguler',
  cloudPublishedLooks: [],
  operatorLooks: [],
  operatorOrders: [],
  operatorLoading: false,
  operatorEditingId: null,
  adminUsers: [],
  adminLoading: false,
  lastAnimatedSlot: '',
  bodyType: VALID_BODY_TYPES.has(savedBodyType) ? savedBodyType : 'hourglass',
  studioAngle: 0,
  wardrobeBackAll: false,
  flippedWardrobeIds: {},
  styleCheckResult: null,
  confettiBurstId: 0,
  modalLookId: null,
  explore: {
    query: '',
    maxBudget: 0,
    sort: 'featured',
    occasion: 'All',
  },
  wardrobe: {
    query: '',
    sort: 'default',
    category: 'all',
  },
};

const listeners = new Set();
let unsubProfile = null;
let unsubOutfits = null;
let unsubOrders = null;
let unsubPublishedLooks = null;

function notify(reason = 'all') {
  listeners.forEach((fn) => fn(state, reason));
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getState() {
  return state;
}

export function getAllLooks() {
  return [...state.cloudPublishedLooks, ...LOOKS];
}

export function getCartTotalCount() {
  return state.cart.reduce((sum, entry) => sum + (Number(entry.qty) || 1), 0);
}

export function getCurrentWornMap() {
  const result = {};
  for (const [slot, itemId] of Object.entries(state.worn)) {
    if (itemId != null && ITEMS[itemId]) {
      result[slot] = [itemId, state.colorIndexByItem[itemId] || 0];
    }
  }
  return result;
}

function canAccessView(viewId, role) {
  if (viewId === 'operator') return role === 'operator' || role === 'admin';
  if (viewId === 'admin') return role === 'admin';
  return true;
}

export function navigate(viewId, { pushHash = true } = {}) {
  let target = VALID_VIEWS.has(viewId) ? viewId : 'home';

  if (state.authReady && !canAccessView(target, state.role)) {
    if (!state.currentUser) {
      showToast('Silakan login terlebih dahulu');
      target = viewId === 'admin' ? 'login-admin' : viewId === 'operator' ? 'login-operator' : 'login';
    } else {
      showToast('Akses terbatas untuk role tersebut');
      target = 'home';
    }
  }

  state.view = target;
  state.mobileMenuOpen = false;
  state.authError = '';
  state.roleMismatchNotice = '';

  if (pushHash && window.location.hash !== `#${target}`) {
    window.location.hash = target;
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (target === 'operator' && (state.role === 'operator' || state.role === 'admin')) {
    refreshOperatorLooks();
    refreshWorkspaceOrders();
  }
  if (target === 'admin' && state.role === 'admin') {
    refreshAdminUsers();
    refreshOperatorLooks();
    refreshWorkspaceOrders();
  }

  notify('view');
}

export function toggleMobileMenu() {
  state.mobileMenuOpen = !state.mobileMenuOpen;
  notify('header');
}

export function setUserLoginMode(mode) {
  state.userLoginMode = mode === 'register' ? 'register' : 'login';
  state.authError = '';
  notify('auth');
}

function mapAuthErrorMessage(error) {
  const code = error?.code || '';
  const msg = error instanceof Error ? error.message : String(error || '');
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return 'Email atau kata sandi salah. Periksa kembali lalu coba lagi.';
  }
  if (code === 'auth/email-already-in-use') {
    return 'Email ini sudah terdaftar. Silakan masuk melalui tab Masuk.';
  }
  if (code === 'auth/weak-password') {
    return 'Kata sandi terlalu lemah. Gunakan minimal 6 karakter.';
  }
  if (code === 'auth/invalid-email') {
    return 'Format alamat email tidak valid.';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Login Email & Password belum diaktifkan di Firebase Console > Authentication > Sign-in method.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Terlalu banyak percobaan login. Tunggu sebentar lalu coba lagi.';
  }
  if (msg.includes('popup-closed-by-user')) {
    return '';
  }
  return 'Gagal masuk ke akun. Periksa koneksi atau konfigurasi otentikasi.';
}

async function handlePostAuthSuccess(user, portalRole) {
  const profile = await ensureUserProfile(user, {
    favs: state.favs,
    wish: state.wish,
  });
  const actualRole = profile?.role || 'user';
  const roleLabel = ROLE_META[actualRole]?.label || 'User Biasa';

  if (portalRole === 'admin') {
    if (actualRole === 'admin') {
      showToast('Selamat datang kembali, Admin');
      navigate('admin');
    } else {
      state.roleMismatchNotice = `Akun ini terdaftar sebagai ${roleLabel}, belum memiliki otorisasi Admin. Hubungi Admin utama untuk penugasan role.`;
      showToast(`Login berhasil sebagai ${roleLabel}`);
    }
  } else if (portalRole === 'operator') {
    if (actualRole === 'operator' || actualRole === 'admin') {
      showToast('Selamat datang di Workspace Operator');
      navigate('operator');
    } else {
      state.roleMismatchNotice = `Akun ini terdaftar sebagai ${roleLabel}, belum memiliki otorisasi Operator. Hubungi Admin untuk penugasan role Operator.`;
      showToast(`Login berhasil sebagai ${roleLabel}`);
    }
  } else if (portalRole === 'user') {
    showToast(`Selamat datang, ${roleLabel} ♡`);
    navigate(state.cart.length ? 'cart' : 'home');
  } else {
    showToast(`Berhasil masuk sebagai ${roleLabel}`);
    if (actualRole === 'admin') navigate('admin');
    else if (actualRole === 'operator') navigate('operator');
    else navigate('home');
  }
}

export async function loginWithGoogle(portalRole = null) {
  if (state.authBusy) return;
  state.authBusy = true;
  state.authError = '';
  state.roleMismatchNotice = '';
  state.loginPortalTarget = portalRole;
  notify('auth');

  try {
    const user = await signInWithGoogle();
    await handlePostAuthSuccess(user, portalRole);
  } catch (error) {
    state.authError = mapAuthErrorMessage(error);
  } finally {
    state.authBusy = false;
    notify('auth');
  }
}

export async function loginWithCredentials(email, password, portalRole = 'user') {
  if (state.authBusy) return;
  state.authBusy = true;
  state.authError = '';
  state.roleMismatchNotice = '';
  state.loginPortalTarget = portalRole;
  notify('auth');

  try {
    const user = await loginWithEmailPassword(email.trim(), password);
    await handlePostAuthSuccess(user, portalRole);
  } catch (error) {
    state.authError = mapAuthErrorMessage(error);
  } finally {
    state.authBusy = false;
    notify('auth');
  }
}

export async function registerUserAccount({ name, email, password }) {
  if (state.authBusy) return;
  state.authBusy = true;
  state.authError = '';
  state.roleMismatchNotice = '';
  notify('auth');

  try {
    const user = await registerWithEmailPassword(name.trim(), email.trim(), password);
    showToast('Akun Styleverse berhasil dibuat ♡');
    await handlePostAuthSuccess(user, 'user');
  } catch (error) {
    state.authError = mapAuthErrorMessage(error);
  } finally {
    state.authBusy = false;
    notify('auth');
  }
}

export async function requestEmailVerification() {
  try {
    await resendVerificationEmail();
    showToast('Email verifikasi telah dikirim ke inbox kamu');
  } catch {
    showToast('Gagal mengirim ulang email verifikasi. Coba sebentar lagi.');
  }
}

export async function logout() {
  try {
    await signOutUser();
    state.roleMismatchNotice = '';
    state.authError = '';
    state.activeReceiptOrderId = null;
    showToast('Berhasil keluar dari akun');
    if (state.view === 'operator' || state.view === 'admin') {
      navigate('login');
    } else {
      notify('auth');
    }
  } catch {
    showToast('Gagal keluar dari akun');
  }
}

/* ===== E-Commerce Cart & Checkout ===== */
export function addToCart(itemId, colorIdx = null, qty = 1) {
  const item = ITEMS[itemId];
  if (!item) return;

  const resolvedColor = colorIdx != null ? colorIdx : state.colorIndexByItem[itemId] || 0;
  const existing = state.cart.find(
    (entry) => entry.itemId === itemId && entry.colorIdx === resolvedColor
  );

  if (existing) {
    existing.qty = Math.min(20, (Number(existing.qty) || 1) + qty);
  } else {
    state.cart.push({ itemId, colorIdx: resolvedColor, qty });
  }

  writeStorage(STORAGE_KEYS.cart, state.cart);
  showToast(`${item.name} masuk tas belanja ♡`);
  notify('cart');
}

export function addLookToCart(lookId) {
  const look = getAllLooks().find((l) => l.id === lookId);
  if (!look || !look.outfitSpec) return;

  let added = 0;
  for (const entry of Object.values(look.outfitSpec)) {
    if (!Array.isArray(entry)) continue;
    const [itemId, colorIdx] = entry;
    if (!ITEMS[itemId]) continue;
    const existing = state.cart.find(
      (c) => c.itemId === itemId && c.colorIdx === (colorIdx || 0)
    );
    if (existing) {
      existing.qty = Math.min(20, existing.qty + 1);
    } else {
      state.cart.push({ itemId, colorIdx: colorIdx || 0, qty: 1 });
    }
    added += 1;
  }

  if (added > 0) {
    writeStorage(STORAGE_KEYS.cart, state.cart);
    closeLookModal();
    showToast(`${added} item dari "${look.name}" masuk tas belanja ♡`);
    navigate('cart');
  }
}

export function addWornOutfitToCart() {
  const wornMap = getCurrentWornMap();
  const entries = Object.values(wornMap);
  if (!entries.length) {
    showToast('Pilih setidaknya satu item di mannequin dulu ya ♡');
    return;
  }

  for (const [itemId, colorIdx] of entries) {
    const existing = state.cart.find(
      (c) => c.itemId === itemId && c.colorIdx === (colorIdx || 0)
    );
    if (existing) {
      existing.qty = Math.min(20, existing.qty + 1);
    } else {
      state.cart.push({ itemId, colorIdx: colorIdx || 0, qty: 1 });
    }
  }

  writeStorage(STORAGE_KEYS.cart, state.cart);
  showToast(`${entries.length} item outfit masuk tas belanja ♡`);
  navigate('cart');
}

export function updateCartItemQty(itemId, colorIdx, delta) {
  const idx = state.cart.findIndex(
    (entry) => entry.itemId === itemId && entry.colorIdx === colorIdx
  );
  if (idx === -1) return;

  const nextQty = (Number(state.cart[idx].qty) || 1) + delta;
  if (nextQty <= 0) {
    state.cart.splice(idx, 1);
  } else {
    state.cart[idx].qty = Math.min(20, nextQty);
  }

  writeStorage(STORAGE_KEYS.cart, state.cart);
  notify('cart');
}

export function removeCartItem(itemId, colorIdx) {
  state.cart = state.cart.filter(
    (entry) => !(entry.itemId === itemId && entry.colorIdx === colorIdx)
  );
  writeStorage(STORAGE_KEYS.cart, state.cart);
  showToast('Item dihapus dari tas belanja');
  notify('cart');
}

export function setCheckoutPayment(paymentId) {
  state.checkoutSelectedPayment = paymentId;
  notify('cart');
}

export function setCheckoutCourier(courierId) {
  state.checkoutSelectedCourier = courierId;
  notify('cart');
}

export function setActiveReceiptOrder(orderId) {
  state.activeReceiptOrderId = orderId;
  notify('cart');
}

function generatePaymentCode(methodId, orderNum, cardLast4) {
  const suffix = String(Math.floor(100000 + Math.random() * 900000));
  if (methodId === 'va_bca') return `39010${suffix}`;
  if (methodId === 'va_mandiri') return `88608${suffix}`;
  if (methodId === 'qris') return `QRIS-${orderNum}`;
  if (methodId === 'ewallet') return `EWL-${orderNum}`;
  if (methodId === 'card') {
    const cleanLast4 = String(cardLast4 || '4242').replace(/\D/g, '').slice(-4) || '4242';
    return `CARD •••• ${cleanLast4}`;
  }
  return 'COD-TUNAI';
}

export async function submitCheckoutOrder({
  buyerName,
  phone,
  shippingAddress,
  shippingCity,
  notes,
  cardLast4,
}) {
  if (!state.currentUser) {
    showToast('Silakan masuk akun dulu untuk melanjutkan transaksi ♡');
    navigate('login-user');
    return false;
  }
  if (!state.cart.length || state.checkoutBusy) {
    return false;
  }

  const subtotal = state.cart.reduce(
    (sum, entry) => sum + (ITEMS[entry.itemId]?.price || 0) * (Number(entry.qty) || 1),
    0
  );
  const courierCfg =
    COURIER_OPTIONS.find((c) => c.id === state.checkoutSelectedCourier) || COURIER_OPTIONS[0];
  const isFreeShipping = courierCfg.freeThreshold > 0 && subtotal >= courierCfg.freeThreshold;
  const shippingFee = isFreeShipping ? 0 : courierCfg.fee;
  const serviceFee = 2000;

  const paymentCfg =
    PAYMENT_METHODS.find((m) => m.id === state.checkoutSelectedPayment) || PAYMENT_METHODS[0];
  const orderNumber = `SV-${Date.now().toString().slice(-6)}`;
  const paymentCode = generatePaymentCode(paymentCfg.id, orderNumber, cardLast4);

  state.checkoutBusy = true;
  notify('cart');

  try {
    const created = await createOrderInCloud(state.currentUser.uid, state.currentUser.email, {
      orderNumber,
      buyerName,
      phone,
      shippingAddress,
      shippingCity,
      courier: courierCfg.id,
      paymentMethod: paymentCfg.id,
      paymentCode,
      items: state.cart,
      shippingFee,
      serviceFee,
      notes,
      status: paymentCfg.initialStatus,
    });

    state.cart = [];
    writeStorage(STORAGE_KEYS.cart, state.cart);
    state.activeReceiptOrderId = created.id;
    showToast(`Pesanan ${orderNumber} berhasil dibuat ♡`);
    return true;
  } catch {
    showToast('Gagal memproses pesanan. Pastikan data sudah lengkap.');
    return false;
  } finally {
    state.checkoutBusy = false;
    notify('cart');
  }
}

export async function confirmOrderPayment(orderId) {
  if (!state.currentUser) return;
  try {
    await updateOrderStatusInCloud(orderId, 'paid');
    showToast('Pembayaran dikonfirmasi! Pesanan segera dikemas ♡');
    notify('cart');
  } catch {
    showToast('Gagal mengonfirmasi pembayaran');
  }
}

export async function cancelUnpaidOrder(orderId) {
  if (!state.currentUser) return;
  try {
    await updateOrderStatusInCloud(orderId, 'cancelled');
    showToast('Pesanan dibatalkan');
    notify('cart');
  } catch {
    showToast('Gagal membatalkan pesanan');
  }
}

export async function refreshWorkspaceOrders() {
  if (!state.currentUser || (state.role !== 'operator' && state.role !== 'admin')) return;
  try {
    const isBootstrap =
      state.currentUser.emailVerified && state.currentUser.email === BOOTSTRAP_ADMIN_EMAIL;
    state.operatorOrders = await fetchWorkspaceOrders(state.currentUser.uid, isBootstrap);
    notify('operator');
  } catch {
    state.operatorOrders = [];
  }
}

export async function updateWorkspaceOrderStatus(orderId, nextStatus) {
  if (!state.currentUser || (state.role !== 'operator' && state.role !== 'admin')) return;
  try {
    await updateOrderStatusInCloud(orderId, nextStatus);
    showToast('Status pesanan diperbarui');
    await refreshWorkspaceOrders();
  } catch {
    showToast('Gagal memperbarui status pesanan');
  }
}

export async function refreshOperatorLooks() {
  if (!state.currentUser || (state.role !== 'operator' && state.role !== 'admin')) return;
  state.operatorLoading = true;
  notify('operator');
  try {
    const isBootstrap =
      state.currentUser.emailVerified && state.currentUser.email === BOOTSTRAP_ADMIN_EMAIL;
    state.operatorLooks = await fetchOperatorLooks(state.currentUser.uid, isBootstrap);
  } catch {
    showToast('Gagal memuat daftar look dari cloud');
  } finally {
    state.operatorLoading = false;
    notify('operator');
  }
}

export function setOperatorEditingId(lookId) {
  state.operatorEditingId = lookId;
  notify('operator');
}

export async function saveOperatorLook(input, editId = null) {
  if (!state.currentUser || (state.role !== 'operator' && state.role !== 'admin')) {
    showToast('Hanya Operator atau Admin yang dapat menyimpan look');
    return false;
  }
  try {
    await saveCuratedLookToCloud(state.currentUser.uid, input, editId);
    state.operatorEditingId = null;
    showToast(editId ? 'Curated look diperbarui' : 'Curated look berhasil ditambahkan');
    await refreshOperatorLooks();
    return true;
  } catch {
    showToast('Gagal menyimpan look ke database');
    return false;
  }
}

export async function deleteOperatorLook(lookId) {
  if (!state.currentUser || (state.role !== 'operator' && state.role !== 'admin')) return;
  try {
    await deleteCuratedLookFromCloud(lookId);
    if (state.operatorEditingId === lookId) {
      state.operatorEditingId = null;
    }
    showToast('Curated look dihapus');
    await refreshOperatorLooks();
  } catch {
    showToast('Gagal menghapus look');
  }
}

export async function refreshAdminUsers() {
  if (!state.currentUser || state.role !== 'admin') return;
  state.adminLoading = true;
  notify('admin');
  try {
    const list = await fetchAllUsersForAdmin();
    state.adminUsers = list.sort((a, b) => (a.email || '').localeCompare(b.email || ''));
  } catch {
    showToast('Daftar seluruh user hanya dapat dimuat oleh Admin utama');
    state.adminUsers = state.userProfile ? [state.userProfile] : [];
  } finally {
    state.adminLoading = false;
    notify('admin');
  }
}

export async function changeUserRole(targetUid, newRole) {
  if (!state.currentUser || state.role !== 'admin') return;
  if (targetUid === state.currentUser.uid && newRole !== 'admin') {
    showToast('Admin aktif tidak dapat menurunkan rolenya sendiri');
    return;
  }
  try {
    await updateUserRoleByAdmin(targetUid, newRole);
    showToast(`Role diperbarui menjadi ${ROLE_META[newRole]?.label || newRole}`);
    await refreshAdminUsers();
  } catch {
    showToast('Gagal memperbarui role user');
  }
}

export function toggleFavoriteLook(lookId) {
  const exists = state.favs.includes(lookId);
  state.favs = exists ? state.favs.filter((id) => id !== lookId) : [...state.favs, lookId];
  writeStorage(STORAGE_KEYS.favs, state.favs);
  if (state.currentUser) {
    updateUserPreferences(state.currentUser.uid, { favLookIds: state.favs }).catch(() => {});
  }
  showToast(exists ? 'Look dihapus dari Favorites' : 'Look tersimpan ♡');
  notify('favorites');
}

export function toggleWishlistItem(itemId) {
  const item = ITEMS[itemId];
  if (!item) return;
  const exists = state.wish.includes(itemId);
  state.wish = exists ? state.wish.filter((id) => id !== itemId) : [...state.wish, itemId];
  writeStorage(STORAGE_KEYS.wish, state.wish);
  if (state.currentUser) {
    updateUserPreferences(state.currentUser.uid, { wishItemIds: state.wish }).catch(() => {});
  }
  showToast(exists ? 'Dihapus dari wishlist' : `${item.name} masuk wishlist ♡`);
  notify('favorites');
}

export function getStudioSide(angle = state.studioAngle) {
  const norm = ((Number(angle) || 0) % 360 + 360) % 360;
  return norm >= 90 && norm < 270 ? 'back' : 'front';
}

export function setStudioAngle(angle) {
  const norm = ((Number(angle) || 0) % 360 + 360) % 360;
  state.studioAngle = Math.round(norm);
  notify('studio-rotate');
}

export function toggleStudioFrontBack() {
  const side = getStudioSide();
  state.studioAngle = side === 'front' ? 180 : 0;
  notify('studio-rotate');
}

export function getWardrobeItemSide(itemId) {
  const flipped = Boolean(state.flippedWardrobeIds[itemId]);
  const isBack = state.wardrobeBackAll ? !flipped : flipped;
  return isBack ? 'back' : 'front';
}

export function toggleWardrobeViewAll() {
  state.wardrobeBackAll = !state.wardrobeBackAll;
  state.flippedWardrobeIds = {};
  notify('wardrobe-grid');
}

export function toggleWardrobeItemFlip(itemId) {
  state.flippedWardrobeIds = {
    ...state.flippedWardrobeIds,
    [itemId]: !state.flippedWardrobeIds[itemId],
  };
  notify('wardrobe-grid');
}

export function setBodyType(bodyType) {
  if (!VALID_BODY_TYPES.has(bodyType)) return;
  state.bodyType = bodyType;
  writeStorage(STORAGE_KEYS.bodyType, bodyType);
  if (state.styleCheckResult) {
    const wornMap = getCurrentWornMap();
    state.styleCheckResult = evaluateMannequinStyle(wornMap, state.bodyType);
    if (state.styleCheckResult.tier === 'perfect') {
      state.confettiBurstId += 1;
    }
  }
  notify('studio');
}

export function runStyleCheck() {
  const wornMap = getCurrentWornMap();
  const result = evaluateMannequinStyle(wornMap, state.bodyType);
  state.styleCheckResult = result;
  if (result.tier === 'perfect') {
    state.confettiBurstId += 1;
    showToast('Sempurna! Outfit sangat cocok untuk postur & palet warnamu ✿');
  } else if (result.tier === 'decent') {
    showToast('Lumayan manis! Cek saran stylist untuk penyempurnaan');
  } else {
    showToast('Cek saran stylist untuk warna & bentuk tubuhmu');
  }
  notify('studio');
  return result;
}

export function areWornItemsFavorited() {
  const wornIds = Object.values(getCurrentWornMap()).map(([itemId]) => itemId);
  return wornIds.length > 0 && wornIds.every((id) => state.wish.includes(id));
}

export function favoriteWornOutfit() {
  const wornEntries = Object.values(getCurrentWornMap());
  if (!wornEntries.length) {
    showToast('Pilih setidaknya satu item di mannequin dulu ya ♡');
    return;
  }

  const uniqueIds = [...new Set(wornEntries.map(([itemId]) => itemId))];
  const nextWish = [...state.wish];
  let addedCount = 0;

  for (const id of uniqueIds) {
    if (!nextWish.includes(id)) {
      nextWish.push(id);
      addedCount += 1;
    }
  }

  if (addedCount === 0) {
    showToast('Semua item outfit ini sudah ada di Favorites ♥');
    return;
  }

  state.wish = nextWish.slice(-100);
  writeStorage(STORAGE_KEYS.wish, state.wish);
  if (state.currentUser) {
    updateUserPreferences(state.currentUser.uid, { wishItemIds: state.wish }).catch(() => {});
  }
  showToast(`${addedCount} item outfit disimpan ke Favorites ♡`);
  notify('favorites');
}

export function wearItem(itemId, force = false) {
  const item = ITEMS[itemId];
  if (!item) return;
  const slot = item.cat;
  state.lastAnimatedSlot = slot;
  state.styleCheckResult = null;

  if (state.worn[slot] === itemId && !force) {
    state.worn[slot] = null;
  } else {
    state.worn[slot] = itemId;
    state.wearCount[itemId] = (state.wearCount[itemId] || 0) + 1;
    writeStorage(STORAGE_KEYS.wearCount, state.wearCount);

    if (slot === 'dress') {
      state.worn.top = null;
      state.worn.bottom = null;
    } else if (slot === 'top' || slot === 'bottom') {
      state.worn.dress = null;
    }
    showToast(`${item.name} dipakai`);
  }

  writeStorage(STORAGE_KEYS.worn, state.worn);
  notify('studio');
}

export function clearSlot(slot) {
  if (state.worn[slot] == null) return;
  state.worn[slot] = null;
  state.lastAnimatedSlot = '';
  state.styleCheckResult = null;
  writeStorage(STORAGE_KEYS.worn, state.worn);
  notify('studio');
}

export function tryItemInStudio(itemId) {
  wearItem(itemId, true);
  navigate('studio');
}

export function tryLookInStudio(lookId) {
  const look = getAllLooks().find((l) => l.id === lookId);
  if (!look) return;
  state.worn = {};
  for (const [slot, entry] of Object.entries(look.outfitSpec || {})) {
    const [itemId, colorIdx] = entry;
    if (ITEMS[itemId]) {
      state.worn[slot] = itemId;
      state.colorIndexByItem[itemId] = colorIdx || 0;
      state.wearCount[itemId] = (state.wearCount[itemId] || 0) + 1;
    }
  }
  state.lastAnimatedSlot = '';
  state.styleCheckResult = null;
  writeStorage(STORAGE_KEYS.worn, state.worn);
  writeStorage(STORAGE_KEYS.colors, state.colorIndexByItem);
  writeStorage(STORAGE_KEYS.wearCount, state.wearCount);
  closeLookModal();
  navigate('studio');
  showToast(`Look "${look.name}" siap dicoba di studio`);
}

export function setItemColor(itemId, colorIndex) {
  const item = ITEMS[itemId];
  if (!item) return;
  state.colorIndexByItem[itemId] = colorIndex;
  state.lastAnimatedSlot = item.cat;
  state.styleCheckResult = null;
  writeStorage(STORAGE_KEYS.colors, state.colorIndexByItem);
  notify('studio');
}

export function resetStudio() {
  state.worn = {};
  state.lastAnimatedSlot = '';
  state.styleCheckResult = null;
  writeStorage(STORAGE_KEYS.worn, state.worn);
  showToast('Mannequin siap untuk look baru');
  notify('studio');
}

export function shuffleStudio() {
  const pickRandomId = (cat) => {
    const list = ITEMS.filter((item) => item.cat === cat);
    return list[Math.floor(Math.random() * list.length)].id;
  };

  state.worn =
    Math.random() < 0.35
      ? { dress: pickRandomId('dress'), shoes: pickRandomId('shoes') }
      : { top: pickRandomId('top'), bottom: pickRandomId('bottom'), shoes: pickRandomId('shoes') };

  if (Math.random() < 0.4) {
    state.worn.outer = pickRandomId('outer');
  }

  Object.values(state.worn).forEach((id) => {
    if (id != null) {
      state.colorIndexByItem[id] = Math.floor(Math.random() * 5);
    }
  });

  state.lastAnimatedSlot = '';
  state.styleCheckResult = null;
  writeStorage(STORAGE_KEYS.colors, state.colorIndexByItem);
  writeStorage(STORAGE_KEYS.worn, state.worn);
  showToast('Kombinasi acak siap dicoba');
  notify('studio');
}

export async function saveCustomOutfit() {
  const wornMap = getCurrentWornMap();
  if (!Object.keys(wornMap).length) {
    showToast('Pilih setidaknya satu item dulu ya ♡');
    return;
  }

  const totalPrice = Object.values(wornMap).reduce(
    (sum, entry) => sum + (ITEMS[entry[0]]?.price || 0),
    0
  );

  const outfitPayload = {
    n: `Outfit #${state.outfits.length + 1}`,
    d: new Date().toLocaleDateString('id-ID'),
    w: wornMap,
    totalPrice,
  };

  if (state.currentUser) {
    try {
      await saveUserOutfitToCloud(state.currentUser.uid, outfitPayload);
      showToast('Outfit tersimpan di akun cloud kamu ♡');
    } catch {
      showToast('Gagal menyimpan ke cloud, disimpan lokal');
      state.outfits.unshift(outfitPayload);
      state.outfits = state.outfits.slice(0, 12);
      writeStorage(STORAGE_KEYS.outfits, state.outfits);
      notify('studio-outfits');
    }
    return;
  }

  state.outfits.unshift(outfitPayload);
  state.outfits = state.outfits.slice(0, 12);
  writeStorage(STORAGE_KEYS.outfits, state.outfits);
  showToast('Outfit tersimpan di bagian My Outfits ♡');
  notify('studio-outfits');
}

export function loadCustomOutfit(index) {
  const outfit = state.outfits[index];
  const wornSource = outfit?.w || outfit?.worn;
  if (!outfit || !wornSource) return;

  state.worn = {};
  for (const [slot, entry] of Object.entries(wornSource)) {
    state.worn[slot] = entry[0];
    state.colorIndexByItem[entry[0]] = entry[1] || 0;
  }
  state.lastAnimatedSlot = '';
  state.styleCheckResult = null;
  writeStorage(STORAGE_KEYS.worn, state.worn);
  writeStorage(STORAGE_KEYS.colors, state.colorIndexByItem);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  showToast(`${outfit.n || outfit.name} dipakai`);
  notify('studio');
}

export async function deleteCustomOutfit(index) {
  const outfit = state.outfits[index];
  if (!outfit) return;

  if (state.currentUser && outfit.id) {
    try {
      await deleteUserOutfitFromCloud(state.currentUser.uid, outfit.id);
      showToast('Outfit dihapus dari cloud');
    } catch {
      showToast('Gagal menghapus outfit');
    }
    return;
  }

  state.outfits.splice(index, 1);
  writeStorage(STORAGE_KEYS.outfits, state.outfits);
  showToast('Outfit dihapus');
  notify('studio-outfits');
}

export function setExploreFilter(patch) {
  state.explore = { ...state.explore, ...patch };
  notify('explore-grid');
}

export function resetExploreFilters() {
  state.explore = {
    query: '',
    maxBudget: 0,
    sort: 'featured',
    occasion: 'All',
  };
  notify('explore');
}

export function openExploreForOccasion(occasion) {
  state.explore.occasion = occasion || 'All';
  navigate('explore');
}

export function setWardrobeFilter(patch) {
  state.wardrobe = { ...state.wardrobe, ...patch };
  notify('wardrobe-grid');
}

export function openLookModal(lookId) {
  state.modalLookId = lookId;
  notify('modal');
}

export function closeLookModal() {
  if (state.modalLookId == null) return;
  state.modalLookId = null;
  notify('modal');
}

export function initFirebaseListeners() {
  if (!unsubPublishedLooks) {
    unsubPublishedLooks = subscribePublishedLooks(
      (looks) => {
        state.cloudPublishedLooks = looks;
        notify('looks');
      },
      () => {
        state.cloudPublishedLooks = [];
      }
    );
  }

  subscribeAuthState(async (firebaseUser) => {
    if (unsubProfile) {
      unsubProfile();
      unsubProfile = null;
    }
    if (unsubOutfits) {
      unsubOutfits();
      unsubOutfits = null;
    }
    if (unsubOrders) {
      unsubOrders();
      unsubOrders = null;
    }

    state.authReady = true;

    if (!firebaseUser) {
      state.currentUser = null;
      state.userProfile = null;
      state.role = 'guest';
      state.operatorLooks = [];
      state.operatorOrders = [];
      state.orders = [];
      state.adminUsers = [];
      state.outfits = readStorage(STORAGE_KEYS.outfits, []);
      if (state.view === 'operator' || state.view === 'admin') {
        state.view = state.view === 'admin' ? 'login-admin' : 'login-operator';
      }
      notify('auth');
      return;
    }

    state.currentUser = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      emailVerified: firebaseUser.emailVerified,
      providerIds: (firebaseUser.providerData || []).map((p) => p.providerId),
    };

    try {
      await ensureUserProfile(firebaseUser, {
        favs: state.favs,
        wish: state.wish,
      });
    } catch {
      // Handled by structured logger
    }

    unsubProfile = subscribeUserProfile(firebaseUser.uid, (profile) => {
      if (!profile) return;
      state.userProfile = profile;
      state.role = profile.role || 'user';
      if (Array.isArray(profile.favLookIds)) {
        state.favs = profile.favLookIds;
        writeStorage(STORAGE_KEYS.favs, state.favs);
      }
      if (Array.isArray(profile.wishItemIds)) {
        state.wish = profile.wishItemIds;
        writeStorage(STORAGE_KEYS.wish, state.wish);
      }

      if (!canAccessView(state.view, state.role)) {
        state.view = 'home';
      }
      if (state.view === 'operator' && (state.role === 'operator' || state.role === 'admin')) {
        refreshOperatorLooks();
        refreshWorkspaceOrders();
      }
      if (state.view === 'admin' && state.role === 'admin') {
        refreshAdminUsers();
        refreshOperatorLooks();
        refreshWorkspaceOrders();
      }

      notify('auth');
    });

    unsubOutfits = subscribeUserOutfits(firebaseUser.uid, (cloudOutfits) => {
      state.outfits = cloudOutfits.map((docItem) => ({
        id: docItem.id,
        n: docItem.name,
        d: docItem.dateLabel,
        w: docItem.worn,
        totalPrice: docItem.totalPrice,
      }));
      notify('studio-outfits');
    });

    unsubOrders = subscribeUserOrders(
      firebaseUser.uid,
      (cloudOrders) => {
        state.orders = cloudOrders;
        notify('cart');
      },
      () => {
        state.orders = [];
      }
    );
  });
}

window.addEventListener('hashchange', () => {
  const nextView = getInitialViewFromHash();
  if (nextView !== state.view) {
    navigate(nextView, { pushHash: false });
  }
});
