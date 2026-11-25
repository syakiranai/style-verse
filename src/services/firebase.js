import { initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { ITEMS } from '../data/catalog.js';

export const BOOTSTRAP_ADMIN_EMAIL = 'syakiranaila021@gmail.com';

export const OperationType = Object.freeze({
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list',
  GET: 'get',
  WRITE: 'write',
});

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Structured Firestore error handler conforming to FirestoreErrorInfo.
 * @param {unknown} error
 * @param {string} operationType
 * @param {string | null} path
 */
export function handleFirestoreError(error, operationType, path) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid ?? null,
      email: auth.currentUser?.email ?? null,
      emailVerified: auth.currentUser?.emailVerified ?? null,
      isAnonymous: auth.currentUser?.isAnonymous ?? null,
      tenantId: auth.currentUser?.tenantId ?? null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Startup connectivity check against Firestore server.
 */
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

testConnection();

/**
 * Ensure user profile document exists in /users/{uid}.
 * Strictly adheres to UserAccount schema in firebase-blueprint.json.
 * @param {import('firebase/auth').User} user
 * @param {{ favs?: any[], wish?: number[] }} [localSeeds]
 */
export async function ensureUserProfile(user, localSeeds = {}) {
  const userPath = `users/${user.uid}`;
  const userRef = doc(db, 'users', user.uid);

  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data();
    }

    const isBootstrap =
      user.emailVerified && user.email === BOOTSTRAP_ADMIN_EMAIL;
    const cleanName = String(user.displayName || user.email?.split('@')[0] || 'Styleverse Member')
      .trim()
      .slice(0, 80);

    const payload = {
      uid: user.uid,
      email: String(user.email || '').slice(0, 160),
      displayName: cleanName || 'Styleverse Member',
      role: isBootstrap ? 'admin' : 'user',
      favLookIds: Array.isArray(localSeeds.favs) ? localSeeds.favs.slice(0, 50) : [],
      wishItemIds: Array.isArray(localSeeds.wish)
        ? localSeeds.wish.filter((x) => Number.isInteger(x)).slice(0, 100)
        : [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(userRef, payload);
    const createdSnap = await getDoc(userRef);
    return createdSnap.exists() ? createdSnap.data() : payload;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }
}

export async function signInWithGoogle() {
  const credential = await signInWithPopup(auth, googleProvider);
  return credential.user;
}

export async function loginWithEmailPassword(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function registerWithEmailPassword(name, email, password) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const cleanName = String(name || '').trim().slice(0, 80);
  if (cleanName) {
    await updateProfile(credential.user, { displayName: cleanName });
  }
  sendEmailVerification(credential.user).catch(() => {});
  return credential.user;
}

export async function resendVerificationEmail() {
  if (!auth.currentUser) throw new Error('No signed-in user');
  await sendEmailVerification(auth.currentUser);
}

export async function signOutUser() {
  await signOut(auth);
}

export function subscribeAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

export function subscribeUserProfile(uid, onData, onError) {
  const path = `users/${uid}`;
  return onSnapshot(
    doc(db, 'users', uid),
    (snapshot) => {
      onData(snapshot.exists() ? snapshot.data() : null);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function updateUserPreferences(uid, { favLookIds, wishItemIds, displayName }) {
  const path = `users/${uid}`;
  const updates = {
    updatedAt: serverTimestamp(),
  };

  if (Array.isArray(favLookIds)) {
    updates.favLookIds = favLookIds.slice(0, 50);
  }
  if (Array.isArray(wishItemIds)) {
    updates.wishItemIds = wishItemIds.filter((x) => Number.isInteger(x)).slice(0, 100);
  }
  if (typeof displayName === 'string' && displayName.trim()) {
    updates.displayName = displayName.trim().slice(0, 80);
  }

  try {
    await updateDoc(doc(db, 'users', uid), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeUserOutfits(uid, onData, onError) {
  const path = `users/${uid}/outfits`;
  const q = query(collection(db, 'users', uid, 'outfits'), where('ownerId', '==', uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      onData(list);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function saveUserOutfitToCloud(uid, outfit) {
  const outfitId = `out_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const path = `users/${uid}/outfits/${outfitId}`;

  const cleanWorn = {};
  for (const slot of ['top', 'bottom', 'dress', 'outer', 'shoes']) {
    if (Array.isArray(outfit.w?.[slot])) {
      cleanWorn[slot] = outfit.w[slot];
    }
  }

  const payload = {
    ownerId: uid,
    name: String(outfit.n || 'Outfit').trim().slice(0, 80) || 'Outfit',
    dateLabel: String(outfit.d || new Date().toLocaleDateString('id-ID')).slice(0, 40),
    worn: cleanWorn,
    totalPrice: Math.max(0, Math.min(50000000, Number(outfit.totalPrice || 0))),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'users', uid, 'outfits', outfitId), payload);
    return outfitId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteUserOutfitFromCloud(uid, outfitId) {
  const path = `users/${uid}/outfits/${outfitId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'outfits', outfitId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribePublishedLooks(onData, onError) {
  const path = 'curatedLooks';
  const q = query(collection(db, 'curatedLooks'), where('status', '==', 'published'));
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data(), isCloud: true }));
      onData(list);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function fetchOperatorLooks(uid, isBootstrap) {
  const path = 'curatedLooks';
  try {
    if (isBootstrap) {
      const snap = await getDocs(collection(db, 'curatedLooks'));
      return snap.docs.map((d) => ({ id: d.id, ...d.data(), isCloud: true }));
    }
    const [pubSnap, ownSnap] = await Promise.all([
      getDocs(query(collection(db, 'curatedLooks'), where('status', '==', 'published'))),
      getDocs(query(collection(db, 'curatedLooks'), where('authorId', '==', uid))),
    ]);
    const map = new Map();
    pubSnap.docs.forEach((d) => map.set(d.id, { id: d.id, ...d.data(), isCloud: true }));
    ownSnap.docs.forEach((d) => map.set(d.id, { id: d.id, ...d.data(), isCloud: true }));
    return Array.from(map.values());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveCuratedLookToCloud(uid, lookInput, existingId = null) {
  const lookId = existingId || `look_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const path = `curatedLooks/${lookId}`;
  const cleanPieces = Array.isArray(lookInput.pieces)
    ? lookInput.pieces
        .map((p) => String(p).trim().slice(0, 80))
        .filter(Boolean)
        .slice(0, 10)
    : [];

  if (!cleanPieces.length) {
    cleanPieces.push('Curated piece');
  }

  const cleanSpec = {};
  for (const slot of ['top', 'bottom', 'dress', 'outer', 'shoes']) {
    if (Array.isArray(lookInput.outfitSpec?.[slot])) {
      cleanSpec[slot] = lookInput.outfitSpec[slot];
    }
  }

  try {
    if (existingId) {
      await updateDoc(doc(db, 'curatedLooks', lookId), {
        name: String(lookInput.name || '').trim().slice(0, 80),
        type: lookInput.type,
        budget: Math.max(0, Math.min(50000000, Number(lookInput.budget || 0))),
        scene: lookInput.scene || 'terrace',
        desc: String(lookInput.desc || '').trim().slice(0, 240),
        pieces: cleanPieces,
        outfitSpec: cleanSpec,
        status: lookInput.status === 'draft' ? 'draft' : 'published',
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(doc(db, 'curatedLooks', lookId), {
        authorId: uid,
        name: String(lookInput.name || '').trim().slice(0, 80),
        type: lookInput.type,
        budget: Math.max(0, Math.min(50000000, Number(lookInput.budget || 0))),
        scene: lookInput.scene || 'terrace',
        desc: String(lookInput.desc || '').trim().slice(0, 240),
        pieces: cleanPieces,
        outfitSpec: cleanSpec,
        status: lookInput.status === 'draft' ? 'draft' : 'published',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    return lookId;
  } catch (error) {
    handleFirestoreError(error, existingId ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function deleteCuratedLookFromCloud(lookId) {
  const path = `curatedLooks/${lookId}`;
  try {
    await deleteDoc(doc(db, 'curatedLooks', lookId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/* ===== E-Commerce Orders ===== */
export function subscribeUserOrders(uid, onData, onError) {
  const path = 'orders';
  const q = query(collection(db, 'orders'), where('buyerId', '==', uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const ta = a.createdAt?.toMillis?.() || 0;
          const tb = b.createdAt?.toMillis?.() || 0;
          return tb - ta;
        });
      onData(list);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function createOrderInCloud(uid, email, orderInput) {
  const orderId = `ord_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const path = `orders/${orderId}`;

  const cleanItems = (orderInput.items || [])
    .slice(0, 30)
    .map((entry) => {
      const catalogItem = ITEMS[entry.itemId];
      if (!catalogItem) return null;
      const qty = Math.max(1, Math.min(20, Math.floor(Number(entry.qty) || 1)));
      const colorIdx = Math.max(0, Math.min(5, Math.floor(Number(entry.colorIdx) || 0)));
      return {
        itemId: catalogItem.id,
        name: String(catalogItem.name).slice(0, 80),
        colorIdx,
        qty,
        unitPrice: catalogItem.price,
      };
    })
    .filter(Boolean);

  if (!cleanItems.length) {
    throw new Error('Keranjang belanja kosong');
  }

  const subtotal = cleanItems.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
  const shippingFee = Math.max(0, Math.min(500000, Math.floor(Number(orderInput.shippingFee) || 0)));
  const serviceFee = Math.max(0, Math.min(100000, Math.floor(Number(orderInput.serviceFee) || 0)));
  const totalAmount = subtotal + shippingFee + serviceFee;

  const payload = {
    orderNumber: String(orderInput.orderNumber || `SV-${Date.now().toString().slice(-6)}`).slice(0, 32),
    buyerId: uid,
    buyerName: String(orderInput.buyerName || 'Customer').trim().slice(0, 80) || 'Customer',
    buyerEmail: String(email || 'member@styleverse.id').trim().slice(0, 160),
    phone: String(orderInput.phone || '').trim().slice(0, 30),
    shippingAddress: String(orderInput.shippingAddress || '').trim().slice(0, 300),
    shippingCity: String(orderInput.shippingCity || '').trim().slice(0, 80),
    courier: ['reguler', 'nextday', 'instant'].includes(orderInput.courier)
      ? orderInput.courier
      : 'reguler',
    paymentMethod: ['qris', 'va_bca', 'va_mandiri', 'ewallet', 'card', 'cod'].includes(
      orderInput.paymentMethod
    )
      ? orderInput.paymentMethod
      : 'qris',
    paymentCode: String(orderInput.paymentCode || 'SV-PAY').trim().slice(0, 60),
    items: cleanItems,
    subtotal,
    shippingFee,
    serviceFee,
    totalAmount,
    notes: String(orderInput.notes || '').trim().slice(0, 200),
    status: ['pending_payment', 'paid', 'processing'].includes(orderInput.status)
      ? orderInput.status
      : 'pending_payment',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'orders', orderId), payload);
    const createdSnap = await getDoc(doc(db, 'orders', orderId));
    return createdSnap.exists() ? { id: createdSnap.id, ...createdSnap.data() } : { id: orderId, ...payload };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateOrderStatusInCloud(orderId, nextStatus) {
  const path = `orders/${orderId}`;
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      status: nextStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function fetchWorkspaceOrders(uid, isBootstrap) {
  const path = 'orders';
  try {
    const snap = isBootstrap
      ? await getDocs(collection(db, 'orders'))
      : await getDocs(query(collection(db, 'orders'), where('buyerId', '==', uid)));
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchAllUsersForAdmin() {
  const path = 'users';
  try {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map((d) => d.data());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function updateUserRoleByAdmin(targetUid, newRole) {
  const path = `users/${targetUid}`;
  if (!['user', 'operator', 'admin'].includes(newRole)) {
    throw new Error('Invalid role');
  }
  try {
    await updateDoc(doc(db, 'users', targetUid), {
      role: newRole,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
