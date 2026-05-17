import { rootPublicAssetResponse } from '$lib/server/public-assets';

export const GET = async () => rootPublicAssetResponse('at-mileposts.json', 'application/json; charset=utf-8');
