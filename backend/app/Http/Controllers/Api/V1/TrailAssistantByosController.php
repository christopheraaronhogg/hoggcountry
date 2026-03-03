<?php

namespace App\Http\Controllers\Api\V1;

use App\Support\TrailAssistantByosProviderRegistry;

class TrailAssistantByosController extends ApiController
{
    public function providers(TrailAssistantByosProviderRegistry $registry)
    {
        return $this->ok([
            'default_provider' => $registry->defaultProviderId(),
            'providers' => array_values($registry->all()),
        ]);
    }
}
