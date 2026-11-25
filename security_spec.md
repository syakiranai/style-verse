# Styleverse Security Specification (Phase 0)

## 1. Data Invariants
1. **User Accounts (`/users/{userId}`)**:
   - A user document ID `{userId}` must strictly match `request.auth.uid` and `data.uid`.
   - Standard user profile registration/updates (`role: "user"`) are allowed for authenticated account owners (both Google verified and Email/Password users); privileged operations (`admin`, `operator`, bootstrap admin check) strictly require `request.auth.token.email_verified == true`.
   - During registration (`create`), a standard user may only assign `role: "user"`. Only the verified bootstrap admin (`syakiranaila021@gmail.com` with `email_verified == true`) may initialize with `role: "admin"`.
   - Standard users may only update `displayName`, `favLookIds`, `wishItemIds`, and `updatedAt`. Role changes are strictly restricted to verified admins.
   - `createdAt`, `uid`, and `email` are immutable after creation.
2. **User Outfits (`/users/{userId}/outfits/{outfitId}`)**:
   - Subcollection documents require an existing parent `/users/{userId}` document (Master Gate).
   - `ownerId` must equal `userId` and `request.auth.uid` and is immutable.
   - `worn` map keys are bounded to `['top', 'bottom', 'dress', 'outer', 'shoes']`.
3. **Curated Looks (`/curatedLooks/{lookId}`)**:
   - Only verified `operator` or `admin` users (`email_verified == true`) may create, update, or delete curated looks.
   - Public/user `list` queries can only read documents with `status == 'published'`, or drafts owned by `authorId == request.auth.uid` (no `get()`/`exists()` inside `allow list`).
4. **Orders (`/orders/{orderId}`)**:
   - Only authenticated users with an existing `/users/{uid}` document can create orders, and `buyerId` must strictly match `request.auth.uid`.
   - Monetary integrity invariant: `totalAmount == subtotal + shippingFee + serviceFee`.
   - Order line items array is bounded (`1..30` map entries) and immutable after creation.
   - Buyers can only read their own orders and can only transition `pending_payment` to `paid` or `cancelled`.
   - Completed or cancelled orders are terminal and locked for non-admins. Only verified operators/admins may transition fulfillment statuses (`processing`, `shipped`, `completed`).
   - Orders cannot be deleted via client SDKs.

## 2. Dirty Dozen Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Self-Privilege Escalation on Signup**: New user creates `/users/{uid}` with `role: "admin"`.
2. **Self-Privilege Escalation on Update**: Existing `user` updates `/users/{uid}` changing `role` to `"operator"`.
3. **Unverified Email Spoofing**: Unverified token (`email_verified: false`) with admin email attempts to initialize as `admin` or read `/users`.
4. **Cross-User PII Read**: Authenticated `userA` attempts `get` on `/users/{userB}` or `/orders/{orderB}`.
5. **Non-Admin User List Scrape**: Standard `user` or `operator` attempts `list` on `/users`.
6. **Shadow Ghost Field Injection**: User updates `/users/{uid}` or `/orders/{orderId}` with extra field `isVerified: true`.
7. **ID Poisoning**: Client writes document with 300-character ID or invalid characters (`../evil`).
8. **Timestamp Forgery**: Client creates document with `createdAt` set to a past date instead of `request.time`.
9. **Order Total Tampering**: Client creates `/orders/{id}` where `totalAmount < subtotal + shippingFee + serviceFee` or mutates `totalAmount` on update.
10. **Order Terminal State Bypass**: Buyer attempts to reopen or modify a `completed` or `cancelled` order, or jumps their own order directly to `completed`.
11. **Standard User Curated Look Write**: Standard `user` attempts to create or update `/curatedLooks/{id}`.
12. **Array / String Exhaustion**: Client submits `favLookIds` > 50 entries, `items` > 30 entries, or `shippingAddress` > 300 chars.
