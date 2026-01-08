export const YT_CHANNEL_ID = 'UCtlUsN3UpR-Vmb-XbgAuNHg';

// Optional: Set a playlist ID to filter videos to a specific playlist
// Leave empty to show all channel videos
export const YT_PLAYLIST_ID = 'PLfcu9P1xhBSV-4a9YRUkLDUEIvthF-lct';

// Use playlist feed if playlist ID is set, otherwise use channel feed
export const YT_FEED_URL = YT_PLAYLIST_ID
  ? `https://www.youtube.com/feeds/videos.xml?playlist_id=${YT_PLAYLIST_ID}`
  : `https://www.youtube.com/feeds/videos.xml?channel_id=${YT_CHANNEL_ID}`;

/**
 * Manual video overrides - Use this when YouTube's RSS feed is slow to update
 *
 * Videos listed here will be merged with the RSS feed and appear immediately.
 * Once the video appears in the RSS feed, you can remove it from here.
 *
 * Only `id` is required - title/published are optional but recommended.
 * Link and thumbnail are auto-generated from the video ID.
 */
export type ManualVideo = {
  id: string;
  title?: string;
  published?: string; // ISO date string (e.g., '2026-01-08')
};

export const MANUAL_VIDEOS: ManualVideo[] = [
  // Example: { id: 'dQw4w9WgXcQ', title: 'Video Title', published: '2026-01-08' },
  {
    id: '0ITBzJdO324',
    title: 'AT Thru-Hike Gear and Clothing List',
    published: '2026-01-08',
  },
];
