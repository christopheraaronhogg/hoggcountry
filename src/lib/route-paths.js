const basePath = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');

export function resolve(path) {
  const href = String(path || '/');

  if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//') || href.startsWith('#')) {
    return href;
  }

  const rootedHref = href.startsWith('/') ? href : `/${href}`;
  return basePath ? `${basePath}${rootedHref}` : rootedHref;
}
