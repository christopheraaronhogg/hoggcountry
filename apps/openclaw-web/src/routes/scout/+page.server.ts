import type { PageServerLoad } from './$types';

// Public marketing page for Scout (the trail assistant). Previously redirected
// to the gated /app, leaving the public site with no surface explaining the
// product's core anchor; now it sells Scout and drives to the waitlist.
export const load: PageServerLoad = async () => {
  return {};
};
