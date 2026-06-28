# Scout Local AI Simulator Preflight

- Checked at: 2026-06-28T21:49:57Z
- Status: passed
- Proof lane: iPhone Simulator debug build, not final TestFlight/iPhone proof
- Run id: `device-local-ai-20260628T213317Z`
- App: `1.0 (28)`
- Install source: `debug`
- Native/model: `ios` / `gemma-4-E2B-it-litert-lm`
- Suite: `dad-local-ai-100` `2026-06-28.3` (`fnv1a32:9ceae11d`)
- Commit: `ef7b53febf55c09f1baeb441541922b668eea3b8`
- Cases: `100/100`
- Required-tool complete: `100/100`
- Source-evidence complete: `100/100`
- Provider errors: `0`
- Answer-quality scan: `0 flagged`, `0 errors`, `0 warnings`

Commands run:

```sh
npm run eval:scout-local-ai:ios-sim-gemma -- --limit 100
npm run intake:scout-local-ai-device-run -- --run .scout-artifacts/scout-local-ai-runs/ios-sim-gemma-device-local-ai-20260628T213317Z.json --allow-partial
node scripts/scan-scout-local-ai-answer-quality.mjs --run .scout-artifacts/scout-local-ai-runs/ios-sim-gemma-device-local-ai-20260628T213317Z.json --json
npm run status:scout-local-ai
npm run audit:scout-local-ai-goal -- --json
```

Saved local artifacts:

- `.scout-artifacts/scout-local-ai-runs/ios-sim-gemma-device-local-ai-20260628T213317Z.json`
- `.scout-artifacts/scout-local-ai-runs/ios-sim-gemma-device-local-ai-20260628T213317Z.scan.json`
- `data/scout-local-ai/device-runs/device-local-ai-20260628T213317Z.json`
- `data/scout-local-ai/answer-quality-scans/device-local-ai-20260628T213317Z.scan.json`
- `data/scout-local-ai/reviews/device-local-ai-20260628T213317Z.review.json`
- `data/scout-local-ai/review-packets/device-local-ai-20260628T213317Z.review.md`

Inspection boundary:

```text
Scout local AI device export inspection: wrong-proof-context
Handoff proof-context problems:
- not a testflight install
Result: do not import as a final Dad proof export yet.
```

Post-intake status:

```text
Simulator/debug local preflight: clean; full runs 3, partial runs 0
Latest simulator/debug local preflight device-local-ai-20260628T213317Z is clean: 100/100 cases, complete tools/source evidence, app 1.0 (28), install=debug, model=gemma-4-E2B-it-litert-lm
Next Action: Upload and attach target iOS build 1.0 (28) to Dad Pilot first.
```

Remaining proof boundary:

This clears the current-commit Mac mini simulator/local iteration gate only.
Final Dad readiness still requires build `1.0 (28)` in Dad Pilot TestFlight, a
real TestFlight/iPhone Run 100 export, human review at `100/100` rated `5/5`,
strict device proof, and repeated stability proof.
