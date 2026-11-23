# Security Specification — Today's Outfit

## 1. Data Invariants

1. **Strict Ownership**: Every document under `/users/{userId}` and `/users/{userId}/items/{itemId}` belongs exclusively to `userId`. Only the verified authenticated user whose `request.auth.uid == userId` and `request.auth.token.email_verified == true` may read, create, update, or delete their own wardrobe documents.
2. **Master Gate Integrity**: A `WardrobeItem` under `/users/{userId}/items/{itemId}` cannot exist without its parent `/users/{userId}` profile document owned by `request.auth.uid`.
3. **Immutable Ownership & Temporal Integrity**: `ownerId` and `createdAt` are set strictly at creation (`ownerId == request.auth.uid`, `createdAt == request.time`) and cannot be altered on update.
4. **Schema & Bounds Enforcement**:
   - `category` must be one of `'shirt'`, `'upper'`, `'trouser'`.
   - `name` must be a non-empty string (`1 <= name.size() <= 80`) matching `^[a-zA-Z0-9 '\-/&().]+$`.
   - No shadow/extra fields are permitted (`keys().hasAll(...) && keys().hasOnly(...)`).
   - Document IDs (`userId`, `itemId`) must pass `isValidId()` (`<= 128` chars, `^[a-zA-Z0-9_\-]+$`).
5. **No PII Exposure**: User profile documents contain only `ownerId`, `initialized`, and `createdAt`—no emails, phone numbers, or addresses are stored in Firestore.

## 2. The "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)

1. **Unauthenticated Read/Write**: `request.auth == null` attempting `get /users/u1/items/i1`.
2. **Unverified Email Write**: `request.auth.token.email_verified == false` attempting `create /users/u1/items/i1`.
3. **Cross-User Read**: User `u2` attempting `get /users/u1` or `list /users/u1/items`.
4. **Cross-User Write**: User `u2` attempting `create /users/u1/items/i1` even with `ownerId: "u2"`.
5. **Identity Spoofing in Payload**: User `u1` creating `/users/u1/items/i1` with `ownerId: "u2"`.
6. **Shadow / Ghost Field Injection**: User `u1` creating `/users/u1/items/i1` with extra field `isAdmin: true`.
7. **Invalid Category Enum**: User `u1` creating `/users/u1/items/i1` with `category: "shoes"`.
8. **Oversized Name (Denial of Wallet)**: User `u1` creating `/users/u1/items/i1` with `name` of 500 characters.
9. **Client-Spoofed Timestamp**: User `u1` creating `/users/u1/items/i1` with `createdAt` in the past instead of `request.time`.
10. **ID Poisoning**: User `u1` creating `/users/u1/items/bad$id!with/spaces` (invalid characters or > 128 chars).
11. **Immutable Field Mutation**: User `u1` updating `/users/u1/items/i1` to change `ownerId` or `createdAt`.
12. **Unfiltered List Query Scraping**: User `u1` querying `/users/u1/items` without matching `ownerId == request.auth.uid`, or querying `/users` root collection (`list` denied).
