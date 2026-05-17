import { rootPublicAssetResponse } from '$lib/server/public-assets';

export const GET = async () => rootPublicAssetResponse('data/appalachian-trail.geojson', 'application/geo+json; charset=utf-8');
