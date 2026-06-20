// swift-tools-version: 5.9
//
// Local wrapper for Google LiteRT-LM 0.13.1.
//
// Upstream's Swift package declares `-all_load` as an unsafe linker flag inside
// the package target, which Xcode refuses to consume from the Capacitor app
// target. The App target owns that linker flag instead; this package keeps the
// upstream Swift wrapper source and binary artifact checksums unchanged.

import PackageDescription

let package = Package(
  name: "LiteRTLMVendor",
  platforms: [
    .iOS(.v15),
    .macOS(.v12),
  ],
  products: [
    .library(
      name: "LiteRTLM",
      targets: ["LiteRTLM"]
    )
  ],
  targets: [
    .binaryTarget(
      name: "CLiteRTLM",
      url: "https://github.com/google-ai-edge/LiteRT-LM/releases/download/v0.13.0/CLiteRTLM.xcframework.zip",
      checksum: "af23c77b8eae3f1888fc0348c133af8a13f1e8a89f5788de7e38457f512e768a"
    ),
    .binaryTarget(
      name: "CLiteRTLM_mac",
      url: "https://github.com/google-ai-edge/LiteRT-LM/releases/download/v0.13.0/CLiteRTLM_mac.xcframework.zip",
      checksum: "5b5ca1d15763924247cc27931e2ab099f39fb06a12376df01d1f8f6242f1cec3"
    ),
    .target(
      name: "LiteRTLM",
      dependencies: [
        .target(name: "CLiteRTLM", condition: .when(platforms: [.iOS])),
        .target(name: "CLiteRTLM_mac", condition: .when(platforms: [.macOS])),
      ],
      path: "swift"
    ),
  ]
)
