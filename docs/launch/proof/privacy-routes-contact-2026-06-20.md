# Privacy, support, terms, and data route contact proof

Verified at: 2026-06-20T19:33:41Z
Verified by: Codex on Chris Hogg's local checkout
Production SHA: 9e01ea2395d03f3a9021aa0ec8b569aa88cb0741
Production deployed at: 2026-06-20T19:30:22Z

## Commands

```bash
/usr/bin/curl -fsS https://hoggcountry.com/api/v1/health

proof_dir=/tmp/hoggcountry-live-routes-2026-06-20
rm -rf "$proof_dir"
mkdir -p "$proof_dir"
for route in privacy support terms data; do
  /usr/bin/curl -fsS "https://hoggcountry.com/$route" -o "$proof_dir/$route.html"
  /usr/bin/curl -sS -o /dev/null -w "$route http=%{http_code} content_type=%{content_type}\n" "https://hoggcountry.com/$route"
done

/opt/homebrew/bin/rg -n "chris\.stitchscreen@gmail\.com" "$proof_dir"
/opt/homebrew/bin/rg -n "privacy@hoggcountry\.com" "$proof_dir"
/opt/homebrew/bin/rg -n "Privacy Policy|Privacy And Deletion|Data & Sources|Corrections|Terms|Support|emergency|deletion" "$proof_dir"
```

## Output summary

```text
health build sha: 9e01ea2395d03f3a9021aa0ec8b569aa88cb0741
health deployed_at: 2026-06-20T19:30:22Z

privacy http=200 content_type=text/html; charset=utf-8
support http=200 content_type=text/html; charset=utf-8
terms http=200 content_type=text/html; charset=utf-8
data http=200 content_type=text/html; charset=utf-8

new_contact_matches=5
old_contact_matches=0
```

## Live route assertions

- `https://hoggcountry.com/privacy` rendered `Privacy Policy`, deletion request instructions, support copy, and `chris.stitchscreen@gmail.com`.
- `https://hoggcountry.com/support` rendered `Support`, `Privacy And Deletion`, emergency-service limitation copy, and `chris.stitchscreen@gmail.com`.
- `https://hoggcountry.com/terms` rendered `Terms of Service`, support/contact copy, emergency-service limitation copy, and `chris.stitchscreen@gmail.com`.
- `https://hoggcountry.com/data` rendered `Data & Sources`, correction instructions, privacy-policy linking, and `chris.stitchscreen@gmail.com`.
- Saved live HTML for all four routes contained no `privacy@hoggcountry.com` matches.

## Notes

`privacy@hoggcountry.com` remains only in historical proof artifacts documenting the failed mailbox test. Public release routes and launch copy now use the verified Gmail inbox.
