import Foundation
import CryptoKit

/// Immutable contract describing the on-device Gemma model file this build
/// targets — the Swift mirror of Android's `ScoutModelSpec`. The URL/checksum
/// defaults point at the public, ungated, Apache-2.0 LiteRT-LM weights; they are
/// non-secret and safe to commit. Swap the URL to Forge/R2 later without
/// changing the checksum (same bytes -> same hash).
struct ScoutModelSpec {
    static let checksumAlgorithm = "SHA-256"

    let modelId: String
    let fileName: String
    let expectedSizeBytes: Int64
    let expectedSha256: String?
    let downloadURL: String?

    /// The model this Gemma-only build targets (kept in sync with the Android
    /// `app/build.gradle` defaults: same file, size, and SHA-256).
    static func target() -> ScoutModelSpec {
        ScoutModelSpec(
            modelId: "gemma-4-E2B-it-litert-lm",
            fileName: "gemma-4-E2B-it-litert-lm.litertlm",
            expectedSizeBytes: 2_588_147_712,
            expectedSha256: "181938105e0eefd105961417e8da75903eacda102c4fce9ce90f50b97139a63c",
            downloadURL: "https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm/resolve/main/gemma-4-E2B-it.litertlm"
        )
    }

    var hasDownloadURL: Bool { !(downloadURL ?? "").isEmpty }
    var hasExpectedChecksum: Bool { !(expectedSha256 ?? "").isEmpty }
    var hasExpectedSize: Bool { expectedSizeBytes > 0 }
}

/// Cheap, immutable snapshot of the on-device model file state, mirroring
/// Android's `ScoutModelStatus`. The gate is fail-closed: a file is never
/// reported `ready` until it has been verified (size + SHA-256).
struct ScoutModelStatus {
    static let unconfigured = "unconfigured"
    static let needsDownload = "needs_download"
    static let presentUnverified = "present_unverified"
    static let ready = "ready"

    let modelId: String
    let state: String
    let filePath: String
    let exists: Bool
    let bytesOnDevice: Int64
    let expectedBytes: Int64
    let checksumConfigured: Bool
    let downloadConfigured: Bool
    let url: String?
    let canDownload: Bool
    let reason: String?

    /// Shape consumed by `capacitor-gemma-bridge.ts` (`ScoutGemmaModelStatus`).
    func toDict() -> [String: Any] {
        var dict: [String: Any] = [
            "modelId": modelId,
            "state": state,
            "filePath": filePath,
            "exists": exists,
            "bytesOnDevice": bytesOnDevice,
            "expectedBytes": expectedBytes,
            "checksumAlgorithm": ScoutModelSpec.checksumAlgorithm,
            "checksumConfigured": checksumConfigured,
            "downloadConfigured": downloadConfigured,
            "canDownload": canDownload
        ]
        if let url = url { dict["url"] = url }
        if let reason = reason { dict["reason"] = reason }
        return dict
    }
}

/// App-private store + verification boundary for the on-device Gemma model,
/// mirroring Android's `ScoutModelStore`. Offline-safe: `status()` only inspects
/// app-private storage; the byte transfer lives in `ScoutModelDownloader`.
/// Nothing here fabricates a ready model, and no cloud inference is invoked.
final class ScoutModelStore {
    private static let modelDirName = "scout-models"
    private static let verifiedSuffix = ".verified"

    let spec: ScoutModelSpec
    private let fileManager = FileManager.default

    init(spec: ScoutModelSpec = .target()) {
        self.spec = spec
    }

    private var modelDirURL: URL {
        let base = fileManager.urls(for: .applicationSupportDirectory, in: .userDomainMask).first
            ?? fileManager.temporaryDirectory
        return base.appendingPathComponent(Self.modelDirName, isDirectory: true)
    }

    var modelFileURL: URL {
        modelDirURL.appendingPathComponent(spec.fileName)
    }

    private var verifiedMarkerURL: URL {
        modelDirURL.appendingPathComponent(spec.fileName + Self.verifiedSuffix)
    }

    @discardableResult
    func ensureModelDir() -> Bool {
        if fileManager.fileExists(atPath: modelDirURL.path) { return true }
        do {
            try fileManager.createDirectory(at: modelDirURL, withIntermediateDirectories: true)
            // A multi-GB model has no business in the user's iCloud backup.
            var dir = modelDirURL
            var values = URLResourceValues()
            values.isExcludedFromBackup = true
            try? dir.setResourceValues(values)
            return true
        } catch {
            return false
        }
    }

    /// Cheap status snapshot — no network and no checksum hashing.
    func status() -> ScoutModelStatus {
        let path = modelFileURL.path
        let exists = fileManager.fileExists(atPath: path)
        let size = exists ? fileSize(modelFileURL) : 0
        let configured = spec.hasDownloadURL || spec.hasExpectedChecksum

        let state: String
        if !configured {
            state = ScoutModelStatus.unconfigured
        } else if !exists {
            state = ScoutModelStatus.needsDownload
        } else if spec.hasExpectedSize && size != spec.expectedSizeBytes {
            state = ScoutModelStatus.needsDownload
        } else if isVerified {
            state = ScoutModelStatus.ready
        } else {
            state = ScoutModelStatus.presentUnverified
        }

        let canDownload = spec.hasDownloadURL && state == ScoutModelStatus.needsDownload
        return ScoutModelStatus(
            modelId: spec.modelId,
            state: state,
            filePath: path,
            exists: exists,
            bytesOnDevice: size,
            expectedBytes: spec.expectedSizeBytes,
            checksumConfigured: spec.hasExpectedChecksum,
            downloadConfigured: configured,
            url: spec.downloadURL,
            canDownload: canDownload,
            reason: nil
        )
    }

    /// Verifies a downloaded file against the configured size and SHA-256 and, on
    /// success, writes a sibling `.verified` marker so `status()` can report
    /// `ready` cheaply. Returns false (and clears any marker) when the spec has no
    /// checksum, the file is missing, or the size/hash mismatch — fail closed.
    @discardableResult
    func verify() throws -> Bool {
        guard spec.hasExpectedChecksum, let expected = spec.expectedSha256 else { return false }
        guard fileManager.fileExists(atPath: modelFileURL.path) else { return false }
        if spec.hasExpectedSize && fileSize(modelFileURL) != spec.expectedSizeBytes {
            clearVerifiedMarker()
            return false
        }
        let actual = try sha256Hex(of: modelFileURL)
        if actual.caseInsensitiveCompare(expected) == .orderedSame {
            writeVerifiedMarker()
            return true
        }
        clearVerifiedMarker()
        return false
    }

    private var isVerified: Bool {
        fileManager.fileExists(atPath: verifiedMarkerURL.path)
    }

    private func writeVerifiedMarker() {
        ensureModelDir()
        fileManager.createFile(atPath: verifiedMarkerURL.path, contents: Data())
    }

    private func clearVerifiedMarker() {
        try? fileManager.removeItem(at: verifiedMarkerURL)
    }

    private func fileSize(_ url: URL) -> Int64 {
        guard let attrs = try? fileManager.attributesOfItem(atPath: url.path),
              let size = (attrs[.size] as? NSNumber)?.int64Value else { return 0 }
        return size
    }

    /// Streams the file through SHA-256 so a 2.6 GB model never sits in memory.
    private func sha256Hex(of url: URL) throws -> String {
        let handle = try FileHandle(forReadingFrom: url)
        defer { try? handle.close() }
        var hasher = SHA256()
        while true {
            let chunk = try handle.read(upToCount: 1 << 20) ?? Data()
            if chunk.isEmpty { break }
            hasher.update(data: chunk)
        }
        return hasher.finalize().map { String(format: "%02x", $0) }.joined()
    }
}
