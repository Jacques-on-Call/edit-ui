# Cookie Policy Guide

## ⚠️ CRITICAL:  Do NOT Change These Without Understanding Why

### Session Cookie (`gh_session`)

**Purpose**: Stores GitHub access token for authenticated API requests.

**Policy**:
```javascript
SameSite=None; Secure; HttpOnly; Domain=edit.strategycontent.agency; Path=/; Max-Age=86400
```

**Why Each Attribute**:
- `SameSite=None`: **REQUIRED** because user is redirected from `github.com` → `edit.strategycontent.agency` (cross-site)
- `Secure`: **REQUIRED** when using `SameSite=None` (browser policy)
- `HttpOnly`: Prevents JavaScript access (security)
- `Domain=edit.strategycontent.agency`: The cookie MUST be scoped to the exact subdomain the application is hosted on. Using a parent domain like `.strategycontent.agency` has been shown to fail.
- `Path=/`: Available to all routes
- `Max-Age=86400`: 24-hour expiration

### CSRF State Cookie (`oauth_state`)

**Purpose**: Prevents CSRF attacks during OAuth flow.

**Policy**:
```javascript
SameSite=None; Secure; Path=/; Max-Age=600
```

**Why `SameSite=None`**:
This cookie is set when user clicks "Sign in" and must survive the redirect to GitHub and back.  `SameSite=Lax` would block it.

## Common Mistakes

❌ **DO NOT** use `SameSite=Lax` for OAuth cookies.
❌ **DO NOT** use a parent domain (e.g., `.strategycontent.agency`). The domain must be the exact subdomain (`edit.strategycontent.agency`).
❌ **DO NOT** forget the `Secure` flag (required with `SameSite=None`).

## Testing Cookie Changes

If you MUST change cookie policy:

1. Run `npx playwright test tests/auth-cookie-verification.spec.js`. This test uses a mocked OAuth flow to validate the cookie policy without needing real credentials.
2. Make your change.
3. Run the test again and ensure it passes.
4. Deploy to production and manually verify in DevTools.
5. Update this document with the new policy.
