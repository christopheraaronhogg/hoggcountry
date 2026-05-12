export function betaCookieOptions(url: URL) {
  return {
    path: '/',
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: url.protocol === 'https:',
    maxAge: 60 * 60 * 24 * 30
  };
}

export function betaCookieDeleteOptions(url: URL) {
  return {
    path: '/',
    secure: url.protocol === 'https:'
  };
}
