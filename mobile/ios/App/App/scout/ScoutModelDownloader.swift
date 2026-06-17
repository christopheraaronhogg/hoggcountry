import Foundation

/// First-run / on-demand downloader for the on-device Gemma model file — the
/// Swift mirror of Android's `ScoutModelDownloader`. Uses a `URLSessionDownloadTask`
/// (which handles HTTP Range / redirects and produces resume data on
/// interruption), reports progress, then hands off to `ScoutModelStore.verify()`
/// for SHA-256 verification before the file is ever treated as ready.
/// Downloading weights is NOT cloud model usage — inference runs on-device.
final class ScoutModelDownloader: NSObject, URLSessionDownloadDelegate {
    private static let freeSpaceMarginBytes: Int64 = 64 << 20

    private let store: ScoutModelStore
    private let spec: ScoutModelSpec
    private var session: URLSession!
    private var task: URLSessionDownloadTask?
    private var continuation: CheckedContinuation<ScoutModelStatus, Error>?
    private var onProgress: ((Int64, Int64) -> Void)?
    private var resumeData: Data?

    init(store: ScoutModelStore = ScoutModelStore()) {
        self.store = store
        self.spec = store.spec
        super.init()
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 60
        config.timeoutIntervalForResource = 6 * 60 * 60 // multi-GB over trail Wi-Fi
        config.waitsForConnectivity = true
        self.session = URLSession(configuration: config, delegate: self, delegateQueue: nil)
    }

    /// Cooperative cancel; resume data is kept so a later call continues instead
    /// of restarting.
    func cancel() {
        task?.cancel { [weak self] data in self?.resumeData = data }
    }

    /// Downloads (or resumes), then verifies. Returns the post-verify status, or
    /// throws on any precondition / transfer / verification failure. Never leaves
    /// an unverified file reported as ready.
    func download(onProgress: @escaping (Int64, Int64) -> Void) async throws -> ScoutModelStatus {
        guard spec.hasDownloadURL, let urlString = spec.downloadURL, let url = URL(string: urlString) else {
            throw ScoutGemmaError.unavailable("No model download endpoint is configured for \(spec.modelId).")
        }
        if store.status().state == ScoutModelStatus.ready { return store.status() }
        store.ensureModelDir()
        // Skip the free-space precheck when resuming — the bytes are already
        // partially on device, so the gross required-space check is overly conservative
        // and can spuriously refuse a resumable download.
        if resumeData == nil {
            try ensureFreeSpace()
        }

        self.onProgress = onProgress
        return try await withCheckedThrowingContinuation { (cont: CheckedContinuation<ScoutModelStatus, Error>) in
            self.continuation = cont
            let downloadTask: URLSessionDownloadTask
            if let resumeData = self.resumeData {
                downloadTask = session.downloadTask(withResumeData: resumeData)
            } else {
                downloadTask = session.downloadTask(with: url)
            }
            self.task = downloadTask
            downloadTask.resume()
        }
    }

    // MARK: URLSessionDownloadDelegate

    func urlSession(
        _ session: URLSession,
        downloadTask: URLSessionDownloadTask,
        didWriteData bytesWritten: Int64,
        totalBytesWritten: Int64,
        totalBytesExpectedToWrite: Int64
    ) {
        let total = totalBytesExpectedToWrite > 0 ? totalBytesExpectedToWrite : spec.expectedSizeBytes
        onProgress?(totalBytesWritten, total)
    }

    func urlSession(
        _ session: URLSession,
        downloadTask: URLSessionDownloadTask,
        didFinishDownloadingTo location: URL
    ) {
        // Runs on the session queue; the temp file is deleted when this returns,
        // so move/replace it synchronously before doing anything else.
        do {
            let dest = store.modelFileURL
            let fm = FileManager.default

            // Clear the verified marker BEFORE replacing the file so a crash
            // mid-replace can never leave a stale marker over an unverified file.
            store.clearVerifiedMarkerForReplace()

            // Atomic swap: replaceItemAt moves the new bytes into place as a single
            // kernel operation, preventing a window where the destination is absent.
            if fm.fileExists(atPath: dest.path) {
                var resultURL: NSURL?
                try fm.replaceItem(
                    at: dest,
                    withItemAt: location,
                    backupItemName: nil,
                    options: [],
                    resultingItemURL: &resultURL)
            } else {
                try fm.moveItem(at: location, to: dest)
            }

            let verified: Bool
            do {
                verified = try store.verify()
            } catch {
                // Verify threw — treat as verification failure: delete the moved
                // file and ensure no marker remains (fail closed).
                try? fm.removeItem(at: dest)
                store.clearVerifiedMarkerForReplace()
                finish(.failure(ScoutGemmaError.unavailable(
                    "Downloaded model verification threw an error and was discarded: \(error.localizedDescription)")))
                return
            }

            if verified {
                finish(.success(store.status()))
            } else {
                // Fail-closed: a file that does not match the pinned checksum is
                // deleted so it can never be loaded or reported ready.
                try? fm.removeItem(at: dest)
                store.clearVerifiedMarkerForReplace()
                finish(.failure(ScoutGemmaError.unavailable(
                    "Downloaded model failed checksum verification and was discarded.")))
            }
        } catch {
            finish(.failure(error))
        }
    }

    func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        // Success is handled in didFinishDownloadingTo; only act on real errors.
        guard let error = error else { return }
        if let data = (error as NSError).userInfo[NSURLSessionDownloadTaskResumeData] as? Data {
            self.resumeData = data
        }
        finish(.failure(error))
    }

    // MARK: -

    private func finish(_ result: Result<ScoutModelStatus, Error>) {
        guard let cont = continuation else { return }
        continuation = nil
        task = nil
        switch result {
        case .success(let status): cont.resume(returning: status)
        case .failure(let error): cont.resume(throwing: error)
        }
    }

    private func ensureFreeSpace() throws {
        guard spec.hasExpectedSize else { return }
        let dir = store.modelFileURL.deletingLastPathComponent()
        guard let values = try? dir.resourceValues(forKeys: [.volumeAvailableCapacityForImportantUsageKey]),
              let available = values.volumeAvailableCapacityForImportantUsage else { return }
        let needed = spec.expectedSizeBytes + Self.freeSpaceMarginBytes
        if available < needed {
            throw ScoutGemmaError.unavailable(
                "Not enough free storage for the model: need ~\(needed >> 20) MB, have \(available >> 20) MB free.")
        }
    }
}
