export const YT_CHANNEL_ID = 'UCtlUsN3UpR-Vmb-XbgAuNHg';

// ============================================
// LIVE TRACKING CONFIG
// ============================================
// Shows "Track Me" link in header nav when:
// 1. LIVE_TRACKING_ENABLED is true, AND
// 2. Current date is >= LIVE_TRACKING_START_DATE
// Note: Date check happens at build time - redeploy after start date to activate
export const LIVE_TRACKING_ENABLED = true;
export const LIVE_TRACKING_START_DATE = '2026-02-02'; // Feb 2, 2026
export const LIVE_TRACKING_URL = 'https://share.garmin.com/hoggcountry';

// Optional: Set a playlist ID to filter videos to a specific playlist
// Leave empty to show all channel videos
export const YT_PLAYLIST_ID = 'PLfcu9P1xhBSV-4a9YRUkLDUEIvthF-lct';

// Use playlist feed if playlist ID is set, otherwise use channel feed
export const YT_FEED_URL = YT_PLAYLIST_ID
  ? `https://www.youtube.com/feeds/videos.xml?playlist_id=${YT_PLAYLIST_ID}`
  : `https://www.youtube.com/feeds/videos.xml?channel_id=${YT_CHANNEL_ID}`;
