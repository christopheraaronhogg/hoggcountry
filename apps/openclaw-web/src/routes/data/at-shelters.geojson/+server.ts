import { rootPublicAssetResponse } from '$lib/server/public-assets';

export const GET = async () => rootPublicAssetResponse('data/at-shelters.geojson', 'application/geo+json; charset=utf-8');
