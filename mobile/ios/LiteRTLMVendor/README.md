# LiteRTLMVendor

Local SwiftPM wrapper for Google LiteRT-LM 0.13.1.

Why this exists:

- Google upstream package: `https://github.com/google-ai-edge/LiteRT-LM`
- Upstream tag used for the Swift wrapper source: `0.13.1`
- Upstream binary artifact URLs and checksums are copied unchanged from that tag.
- Upstream's package target declares `-all_load` through `unsafeFlags`, which Xcode refuses as an app dependency in this Capacitor workspace.
- The app target carries `OTHER_LDFLAGS = -all_load` instead, which preserves the LiteRT-LM static-initializer requirement without using an unsafe package setting.

The source files under `swift/` retain Google's Apache-2.0 headers. See
`LICENSE-LiteRT-LM`.
