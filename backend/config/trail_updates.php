<?php

return [
    'storage_disk' => env('TRAIL_UPDATES_STORAGE_DISK', 'r2'),
    'scratch_disk' => env('TRAIL_UPDATES_SCRATCH_DISK', 'local'),
    'max_media_mb' => env('TRAIL_UPDATES_MAX_MEDIA_MB', 500),
];
