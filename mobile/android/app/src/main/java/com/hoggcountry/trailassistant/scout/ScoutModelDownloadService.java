package com.hoggcountry.trailassistant.scout;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;

import androidx.core.app.NotificationCompat;
import androidx.core.app.ServiceCompat;

import java.util.concurrent.atomic.AtomicReference;

/**
 * Foreground service that downloads + verifies the on-device Gemma model so the
 * multi-GB transfer survives the user leaving the app (backgrounding, locking the
 * screen, switching apps). This is the "true background" half of the first-run
 * download UX: a plain executor inside {@link ScoutGemmaPlugin} dies with the
 * Activity, which is exactly when a hiker on flaky trail-town Wi-Fi would walk
 * away from their phone.
 *
 * <p>Lifecycle + ownership:
 * <ul>
 *   <li>Started (not bound) via {@code startForegroundService} from the plugin
 *       when the user is in the foreground and taps download.</li>
 *   <li>Owns one {@link ScoutModelDownloader}; the transfer runs on a worker
 *       thread. The downloader is resumable, so a dropped connection leaves a
 *       {@code .part} file and the next start continues it.</li>
 *   <li>Reports progress + terminal state through {@link ScoutModelDownloadBus};
 *       the live plugin (if any) mirrors those to JS. The ongoing notification is
 *       the user-facing progress when the app UI is gone.</li>
 *   <li>{@code START_NOT_STICKY}: after a process kill the system does NOT restart
 *       the service with a null intent — the user re-initiates, and the resumable
 *       {@code .part} picks up where it left off.</li>
 * </ul>
 *
 * <p>Downloading weights is NOT cloud model usage — inference still runs entirely
 * on-device once the verified file is in place.
 */
public final class ScoutModelDownloadService extends Service {

    private static final String TAG = "ScoutGemma";
    public static final String ACTION_START = "com.hoggcountry.trailassistant.scout.START_DOWNLOAD";
    public static final String ACTION_CANCEL = "com.hoggcountry.trailassistant.scout.CANCEL_DOWNLOAD";

    private static final String CHANNEL_ID = "scout_model_download";
    private static final int NOTIFICATION_ID = 4201;
    private static final long NOTIFY_THROTTLE_MS = 1000L;

    // Single active transfer for the whole process. Lets a CANCEL intent reach the
    // running downloader, and guards against a double START spawning two threads.
    private static final AtomicReference<ScoutModelDownloader> ACTIVE = new AtomicReference<>(null);

    private Thread worker;

    @Override
    public IBinder onBind(Intent intent) {
        return null; // Started service only; no binding.
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent != null ? intent.getAction() : null;
        if (ACTION_CANCEL.equals(action)) {
            ScoutModelDownloader running = ACTIVE.get();
            if (running != null) {
                running.cancel();
            }
            // Terminal handling (bus + stopSelf) happens on the worker thread when
            // the downloader unwinds; nothing else to do here.
            return START_NOT_STICKY;
        }

        // ACTION_START (or a redelivered null intent we choose to ignore).
        if (!ACTION_START.equals(action)) {
            stopSelf(startId);
            return START_NOT_STICKY;
        }

        // Already downloading? Ignore the duplicate start; the existing transfer
        // (and its notification) stays in charge.
        if (ACTIVE.get() != null) {
            return START_NOT_STICKY;
        }

        startInForeground();
        startTransfer();
        return START_NOT_STICKY;
    }

    private void startInForeground() {
        ensureChannel();
        Notification notification = buildNotification(0, -1L, "Starting download…");
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            ServiceCompat.startForeground(
                    this, NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
    }

    private void startTransfer() {
        ScoutModelDownloader downloader = new ScoutModelDownloader(getApplicationContext());
        ACTIVE.set(downloader);
        ScoutModelDownloadBus bus = ScoutModelDownloadBus.get();
        bus.markActive();

        worker = new Thread(() -> {
            final long[] lastNotifyMs = { 0L };
            try {
                ScoutModelStatus status = downloader.download((bytesDownloaded, totalBytes) -> {
                    bus.publishProgress(bytesDownloaded, totalBytes);
                    long now = System.currentTimeMillis();
                    boolean done = totalBytes > 0 && bytesDownloaded >= totalBytes;
                    if (done || now - lastNotifyMs[0] >= NOTIFY_THROTTLE_MS) {
                        lastNotifyMs[0] = now;
                        updateNotification(bytesDownloaded, totalBytes);
                    }
                });
                Log.i(TAG, "Model download service finished: " + status.state);
                bus.publishComplete(status.bytesOnDevice);
            } catch (ScoutModelDownloadException failure) {
                if (downloader.isCancelled()) {
                    bus.publishCancelled();
                } else {
                    Log.w(TAG, "Model download service failed: " + failure.getMessage());
                    bus.publishError(failure.getMessage());
                }
            } finally {
                ACTIVE.compareAndSet(downloader, null);
                finish();
            }
        }, "scout-model-download");
        worker.start();
    }

    private void finish() {
        // STOP_FOREGROUND_REMOVE clears the ongoing notification once we are done;
        // the plugin surfaces the terminal outcome in-app (or the next launch
        // reflects the verified model via getModelStatus).
        ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE);
        stopSelf();
    }

    @Override
    public void onDestroy() {
        // If the system tears the service down, make sure a lingering transfer is
        // told to stop so it cannot write after we are gone.
        ScoutModelDownloader running = ACTIVE.getAndSet(null);
        if (running != null) {
            running.cancel();
        }
        super.onDestroy();
    }

    // -------------------------------------------------------------------------
    // Notification
    // -------------------------------------------------------------------------

    private void ensureChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager == null || manager.getNotificationChannel(CHANNEL_ID) != null) {
            return;
        }
        NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID, "Scout model download", NotificationManager.IMPORTANCE_LOW);
        channel.setDescription("Progress while Scout's on-device AI model downloads.");
        channel.setShowBadge(false);
        manager.createNotificationChannel(channel);
    }

    private void updateNotification(long bytesDownloaded, long totalBytes) {
        Notification notification = buildNotification(bytesDownloaded, totalBytes, null);
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.notify(NOTIFICATION_ID, notification);
        }
    }

    private Notification buildNotification(long bytesDownloaded, long totalBytes, String overrideText) {
        int percent = totalBytes > 0
                ? (int) Math.min(100, (bytesDownloaded * 100) / totalBytes)
                : 0;
        String text = overrideText != null
                ? overrideText
                : (totalBytes > 0
                        ? percent + "% • " + formatMb(bytesDownloaded) + " / " + formatMb(totalBytes)
                        : formatMb(bytesDownloaded) + " downloaded");

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Downloading Scout's AI model")
                .setContentText(text)
                .setSmallIcon(android.R.drawable.stat_sys_download)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setProgress(100, percent, totalBytes <= 0)
                .addAction(0, "Cancel", cancelIntent());

        Intent launch = getPackageManager().getLaunchIntentForPackage(getPackageName());
        if (launch != null) {
            launch.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            builder.setContentIntent(PendingIntent.getActivity(
                    this, 0, launch, pendingIntentFlags()));
        }
        return builder.build();
    }

    private PendingIntent cancelIntent() {
        Intent cancel = new Intent(this, ScoutModelDownloadService.class).setAction(ACTION_CANCEL);
        return PendingIntent.getService(this, 1, cancel, pendingIntentFlags());
    }

    private static int pendingIntentFlags() {
        // FLAG_IMMUTABLE is required on API 31+ and available from 23; minSdk is 24.
        return PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
    }

    private static String formatMb(long bytes) {
        if (bytes <= 0) {
            return "0 MB";
        }
        double mb = bytes / (1024.0 * 1024.0);
        if (mb >= 1024) {
            return String.format(java.util.Locale.US, "%.1f GB", mb / 1024.0);
        }
        return String.format(java.util.Locale.US, "%.0f MB", mb);
    }

    // -------------------------------------------------------------------------
    // Static start/cancel helpers used by the plugin.
    // -------------------------------------------------------------------------

    public static void start(Context context) {
        Intent intent = new Intent(context, ScoutModelDownloadService.class).setAction(ACTION_START);
        androidx.core.content.ContextCompat.startForegroundService(context, intent);
    }

    public static void cancel(Context context) {
        Intent intent = new Intent(context, ScoutModelDownloadService.class).setAction(ACTION_CANCEL);
        // A started service receives this even while running; if nothing is
        // running the no-op onStartCommand path stops it immediately.
        context.startService(intent);
    }
}
