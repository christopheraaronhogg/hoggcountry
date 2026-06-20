# Privacy/support route proof

Verified at: 2026-06-20T18:58:29Z
Verified by: Codex on Chris Hogg's local checkout
Production SHA: 7d988c78e1cc77154755d0f5adb95e6cf38c3eff

## Commands

```bash
curl -fsS https://hoggcountry.com/api/v1/health
curl -sS -o /dev/null -w 'privacy http=%{http_code} content_type=%{content_type} url=%{url_effective}\n' https://hoggcountry.com/privacy
curl -sS -o /dev/null -w 'support http=%{http_code} content_type=%{content_type} url=%{url_effective}\n' https://hoggcountry.com/support
curl -fsSL https://hoggcountry.com/privacy | rg -n "Trail Assistant|privacy@hoggcountry\.com|deletion|support"
curl -fsSL https://hoggcountry.com/support | rg -n "Trail Assistant|privacy@hoggcountry\.com|deletion|emergency|Support"
```

## Output summary

```text
health build sha: 7d988c78e1cc77154755d0f5adb95e6cf38c3eff
health deployed_at: 2026-06-20T18:55:20Z
privacy http=200 content_type=text/html; charset=utf-8 url=https://hoggcountry.com/privacy
support http=200 content_type=text/html; charset=utf-8 url=https://hoggcountry.com/support
```

The privacy page rendered:

- canonical URL `https://hoggcountry.com/privacy`
- title `Privacy Policy | Hogg Country`
- Trail Assistant privacy scope
- deletion request instructions
- `privacy@hoggcountry.com`
- link to `hoggcountry.com/support`

The support page rendered:

- canonical URL `https://hoggcountry.com/support`
- title `Support | Hogg Country`
- Trail Assistant support scope
- `privacy@hoggcountry.com`
- privacy/deletion instructions
- emergency notice saying Trail Assistant and Scout are not emergency services
