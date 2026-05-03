import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => ({
  documentId: params.documentId
});
