export const YT_CHANNEL_ID = 'UCtlUsN3UpR-Vmb-XbgAuNHg';

// ============================================
// LIVE TRACKING CONFIG
// ============================================
// Set to true when dad starts the AT thru-hike
// This shows a floating "Track Live" button site-wide
export const LIVE_TRACKING_ENABLED = true; // TESTING - set to false until hike starts
export const LIVE_TRACKING_URL = 'https://share.garmin.com/theman1';
export const LIVE_TRACKING_LABEL = 'Track Dad Live';

// Optional: Set a playlist ID to filter videos to a specific playlist
// Leave empty to show all channel videos
export const YT_PLAYLIST_ID = 'PLfcu9P1xhBSV-4a9YRUkLDUEIvthF-lct';

// Use playlist feed if playlist ID is set, otherwise use channel feed
export const YT_FEED_URL = YT_PLAYLIST_ID
  ? `https://www.youtube.com/feeds/videos.xml?playlist_id=${YT_PLAYLIST_ID}`
  : `https://www.youtube.com/feeds/videos.xml?channel_id=${YT_CHANNEL_ID}`;
