# Cookie Policy Guide

## Session Cookie (`gh_session`)

**Purpose:** Stores the GitHub access token so authenticated API requests can be made from the editor.

**Policy:**

```
SameSite=None; Secure; HttpOnly; Domain=.strategycontent.agency; Path=/; Max-Age=86400
```

**Why:**
- `SameSite=None` is required because the OAuth callback is a cross-site redirect from `github.com` to `edit.strategycontent.agency`.
- `Secure` is mandatory when using `SameSite=None`.
- `HttpOnly` prevents JavaScript from reading the token.
- `Domain=.strategycontent.agency` makes the cookie available to the `edit` subdomain.
- `Path=/` makes it available to all routes.
- `Max-Age=86400` keeps the session for 24 hours.

## CSRF State Cookie (`gh_oauth_state`)

**Purpose:** Protects the OAuth flow from CSRF attacks by matching the state sent to GitHub with the state received on callback.

**Policy:**

```
SameSite=None; Secure; HttpOnly; Path=/; Max-Age=600
```

**Why:**
- `SameSite=None` keeps the state cookie available through the GitHub redirect.
- `Secure` pairs with `SameSite=None`.
- `HttpOnly` keeps the state value out of client JavaScript.
- `Path=/` keeps it available to the callback route.
- `Max-Age=600` expires the state after 10 minutes to limit replay risk.

## Common Mistakes to Avoid

- ❌ Using `SameSite=Lax` or omitting the `Domain` for the session cookie — the browser will drop the cookie during the OAuth redirect.
- ❌ Forgetting `Secure` when `SameSite=None` — modern browsers will reject the cookie.
- ❌ Leaving the state cookie without an expiry — stale states can create false CSRF failures.

## How to Test

1. Run `npx playwright test auth-cookie-policy.spec.js`.
2. After login in the browser, check DevTools → Application → Cookies:
   - `gh_session` present with Domain `.strategycontent.agency`, SameSite `None`, Secure and HttpOnly flags.
   - `gh_oauth_state` present during the OAuth redirect with SameSite `None`, Secure, and a short max age.
