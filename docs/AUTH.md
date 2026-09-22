# Authentication Module

Covers everything under `src/modules/auth`, `src/modules/email`, `src/middlewares/errorHandler.ts`, and `src/utils/jwt.ts`. All routes are mounted under `/api/v1/auth` (see `src/routes/v1/index.ts`).

> **Status legend:** ✅ implemented and wired to a route · ⚠️ implemented in `user.service.ts` but not yet wired to a route · ❌ not implemented at all

| Feature | Status |
|---|---|
| Register | ✅ |
| Login (issues access + refresh tokens) | ✅ |
| Resend verification email | ✅ |
| Forgot password | ⚠️ (`forgetPassword` exists, no route/controller) |
| Reset password | ⚠️ (`resetPassword` exists, no route/controller) |
| **Verify email (consume the token)** | ❌ **not implemented** — see [Known gap](#known-gap-verify-email-endpoint) |
| Route protection (`authMiddleware`, `restrictTo`) | ✅ (built, not yet used on any route) |

---

## 1. Register — `POST /api/v1/auth/register`

Body validated by `RegisterSchema` (`user.validation.ts`).

| Field | Required | Notes |
|---|---|---|
| `firstName` | yes | |
| `lastName` | yes | |
| `email` | yes | must be a valid email; stored lowercased + trimmed |
| `password` | yes | min 6 characters |
| `role` | no | `"customer"` \| `"seller"`, defaults to `"customer"`. (`"admin"` is intentionally excluded from public registration.) |
| `storeName` | **only if `role: "seller"`** | rejected as missing if a seller doesn't send it |
| `description` | **only if `role: "seller"`** | same as above |

A customer registering with no `storeName`/`description` succeeds. A seller registering without them gets a `400` naming exactly which of the two is missing. This is enforced in two places that must stay in sync: `RegisterSchema`'s `.superRefine()` (request-level) and `user.model.ts`'s conditional `required` on the schema paths (persistence-level, last line of defense if some other code path calls `UserModel.create()` directly).

**What happens on success:**
1. A 32-byte random token is generated (`crypto.randomBytes`). Its SHA-256 hash is stored on the user document (`isVerificationToken`), never the raw token.
2. `isVerificationExpires` is set to **10 minutes** from now.
3. A verification email is sent (see [§4](#4-email-verification)) containing the **raw** token in a link — if sending fails, registration still succeeds; the failure is only logged server-side (`registerService` doesn't roll back the created account over a flaky SMTP connection).
4. The response never includes `password`, `isVerificationToken`, or `isVerificationExpires` — `sanitizeUser()` strips them from the in-memory document before it's returned, because Mongoose's `select: false` only hides those fields from *queries*, not from a document just handed back by `.create()`.

Duplicate email → `400 "Email already exists"` (checked up front, and again by catching MongoDB's `E11000` in case two requests race).

---

## 2. Login — `POST /api/v1/auth/login`

Body validated by `LoginSchema`: `email`, `password`.

Rejection order in `loginService`:

| Condition | Status | Message |
|---|---|---|
| No account with that email | `404` | `No account found with this email` |
| Account exists but `isVerified` is `false` | `403` | `your email is not verified` |
| Password doesn't match | `400` | `Invalid password` |

403 (not 404 or 401) is deliberate for the "not verified" case — the account genuinely exists, so it's a permissions problem, not a missing resource. Your frontend can branch on this status code specifically to show a "resend verification email" prompt.

**On success**, the response is:

```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "user": { "...": "sanitized user document, no password/tokens" },
    "accessToken": "<JWT, 1 hour expiry>",
    "refreshToken": "<JWT, 15 day expiry, carries a jti>"
  }
}
```

Both tokens are signed with payload `{ id: user._id.toString() }` — this is the exact shape `authMiddleware` expects when it later verifies a token (see [§6](#6-protecting-routes)).

**Not implemented yet:** nothing persists the refresh token or its `jti`, so there's no `/refresh` endpoint to redeem it and no way to revoke one on logout.

---

## 3. Resend verification — `POST /api/v1/auth/resend-verification`

Body: `{ "email": "..." }`. This is what a frontend "Didn't get the email? / Link expired?" button should call.

| Condition | Status | Message |
|---|---|---|
| No account with that email | `404` | `No account found with this email` |
| Account already verified | `400` | `This email is already verified` |
| Otherwise | `200` | `Verification email resent. Please check your inbox.` |

On success, a **brand new** token/hash/expiry is generated and overwrites the old one — the previous verification link stops working the instant a new one is requested, so only the most recently sent link is ever valid.

**No rate limiting exists on this endpoint.** A broken frontend retry loop (or deliberate abuse) can call it repeatedly and burn through your SMTP sending limits. Worth adding a cooldown (e.g. reject if the last token was issued < 60 seconds ago) before this goes anywhere near production.

---

## 4. Email verification

### How the token works today (all in `user.service.ts`)

- `generateSecureToken(expiresInMinutes)` creates a random 32-byte hex token, its SHA-256 hash, and an expiry timestamp. Only the **hash** is ever stored in MongoDB (`isVerificationToken` / `resetPasswordTokenHash`) — the raw token only ever exists in memory and in the emailed link. A database leak alone can't be used to verify an account or reset a password.
- Verification links are **valid for 10 minutes** (`VERIFICATION_TOKEN_EXPIRES_IN_MINUTES`). The email itself says so explicitly: *"This link is valid for 10 minutes — if it expires, you can request a new one."*
- The link sent to the user is: `{CLIENT_URL}/verify-email?token=<raw token>` — currently `http://localhost:8080/verify-email?token=...` (`CLIENT_URL` in `.env`).

### Known gap: verify-email endpoint

**There is currently no backend route that consumes this token.** Nothing sets `isVerified: true`. This is why hitting the link 404s on your frontend even once a `/verify-email` page exists there — that page would have nothing to call.

Proposed contract, matching the existing pattern used by `resetPassword` (hash the incoming raw token with SHA-256, compare to the stored hash, check expiry):

```
POST /api/v1/auth/verify-email
Body: { "token": "<raw token from the link>" }

1. hash = sha256(token)
2. find a user where isVerificationToken === hash
   - not found → 400 "Invalid verification token"
3. check isVerificationExpires > now
   - expired → 400 "Verification link has expired" (frontend should show a resend button here)
4. set isVerified = true, clear isVerificationToken and isVerificationExpires
5. respond 200
```

### Frontend responsibility (outside this repo)

The frontend (running on `localhost:8080`) needs a `/verify-email` route/page that:
1. Reads `token` from the query string.
2. Calls the endpoint above.
3. On success → **redirect to `/login`** (this was explicitly requested: once verified, send the user to log in, don't leave them on the verification page).
4. On failure (invalid or expired token) → show a "resend verification email" action that calls `POST /api/v1/auth/resend-verification` with the user's email.

---

## 5. Forgot / reset password

Both exist as services in `user.service.ts` but **have no controller or route wired up yet** — they can't be called over HTTP today.

### `forgetPassword(email)`

Always returns the same generic message regardless of whether the account exists:

```json
{ "message": "If an account exists with this email, you will receive a password reset link." }
```

This is a deliberate anti-enumeration measure — unlike `login`/`resendVerification`, which do reveal "no account found." If the email exists, a reset token (same hash-only-stored scheme as verification, also 10 minutes) is generated and emailed with a link: `{CLIENT_URL}/reset-password?email=<email>&token=<raw token>`.

### `resetPassword(email, token, newPassword)`

| Condition | Status | Message |
|---|---|---|
| No account with that email | `404` | `User not found` |
| No reset token on record | `400` | `Invalid reset token` |
| Token doesn't match the stored hash | `400` | `Invalid reset token` |
| Token expired | `400` | `Reset token has expired` |
| Otherwise | success | password updated |

On success, `user.password` is set to the **raw** `newPassword` and saved — the model's `pre('save')` hook does the hashing. (Earlier draft of this function hashed it manually *before* `.save()`, which caused the hook to hash it a second time — a bug that silently locked every user out after a reset. Fixed and verified against a real reset: old password stops working, new password works.) The reset token is cleared on success, so it can't be reused — token reuse was tested and confirmed rejected.

**To make this usable**, it needs a controller + two routes, e.g.:
- `POST /api/v1/auth/forgot-password` → body `{ email }`
- `POST /api/v1/auth/reset-password` → body `{ email, token, newPassword }`

### Frontend responsibility (outside this repo)

A "Forgot password?" page that posts an email to `forgot-password`, and a `/reset-password` page that reads `email`/`token` from the query string (matching the link format above) and submits a new password to `reset-password`.

---

## 6. Protecting routes

`src/modules/auth/user.middleware.ts` exports two middlewares. **Neither is currently applied to any route** — they're ready to use once you have routes that need protecting.

### `authMiddleware`

Put this first in any route that requires a logged-in user:

```ts
router.get('/me', authMiddleware, someController);
```

It reads `Authorization: Bearer <token>`, verifies it against `ACCESS_TOKEN_SECRET`, loads the user by the `id` in the payload, and attaches it as `req.user` (typed via `src/types/express.d.ts`).

| Condition | Status | Message |
|---|---|---|
| Missing/malformed header | `401` | `You are not logged in! Please log in to get access.` |
| Invalid or expired token | `401` | `Invalid or expired token. Please log in again.` |
| Token valid, but the user no longer exists | `401` | `The user belonging to this token no longer exists.` |

### `restrictTo(...roles)`

Use after `authMiddleware` to gate a route to specific roles:

```ts
router.get('/seller-dashboard', authMiddleware, restrictTo('seller'), someController);
```

Checks `req.user.role` against the roles passed in. Mismatch → `403 "You do not have permission to perform this action"`.

---

## 7. Error response shape

Every error in this module (validation, `AppError` throws, unexpected exceptions) is normalized by `src/middlewares/errorHandler.ts`, the last middleware registered in `app.ts`:

```json
{
  "status": "fail",
  "message": "human-readable reason",
  "data": null
}
```

- `status` is `"fail"` for 4xx (client errors) and `"error"` for 5xx — this comes straight from `AppError`'s own `statusCode >= 500` check.
- Any error that *isn't* an `AppError` (a real bug, an unhandled exception) is logged server-side with `console.error` but the client only ever sees a generic `500 "Something went wrong"` — internal error details/stack traces never leak into a response.
- Validation errors from `validateSchemaPayload` (Zod) are field-prefixed, e.g. `"storeName: Store name is required, description: Description is required"`, so a multi-field failure tells you exactly which fields are missing.

---

## 8. Endpoint reference

| Method | Path | Auth required | Status |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | no | ✅ |
| `POST` | `/api/v1/auth/login` | no | ✅ |
| `POST` | `/api/v1/auth/resend-verification` | no | ✅ |
| `POST` | `/api/v1/auth/verify-email` | no | ❌ not built |
| `POST` | `/api/v1/auth/forgot-password` | no | ❌ service exists, no route |
| `POST` | `/api/v1/auth/reset-password` | no | ❌ service exists, no route |
| — | any future protected route | yes (`authMiddleware`) | ✅ middleware ready, unused |
