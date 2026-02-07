<?php

return [
    /*
    |--------------------------------------------------------------------------
    | View Storage Paths
    |--------------------------------------------------------------------------
    |
    | Most API responses are JSON, but Laravel still expects these values to
    | exist for exception rendering and console commands like optimize:clear.
    |
    */
    'paths' => [
        resource_path('views'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Compiled View Path
    |--------------------------------------------------------------------------
    |
    | Use storage_path directly to avoid false/null when realpath cannot resolve
    | a symlinked Forge shared storage path.
    |
    */
    'compiled' => env(
        'VIEW_COMPILED_PATH',
        storage_path('framework/views')
    ),
];
