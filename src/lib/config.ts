export const YT_CHANNEL_ID = 'UCtlUsN3UpR-Vmb-XbgAuNHg';

// Optional: Set a playlist ID to filter videos to a specific playlist
// Leave empty to show all channel videos
export const YT_PLAYLIST_ID = '';

// Use playlist feed if playlist ID is set, otherwise use channel feed
export const YT_FEED_URL = YT_PLAYLIST_ID
  ? `https://www.youtube.com/feeds/videos.xml?playlist_id=${YT_PLAYLIST_ID}`
  : `https://www.youtube.com/feeds/videos.xml?channel_id=${YT_CHANNEL_ID}`;
