import type { Cookies } from '@sveltejs/kit';

export const CHATGPT_LOGIN_COOKIE = 'hc_chatgpt_login';

export interface ChatGptLoginPending {
  readonly state: string;
  readonly verifier: string;
  readonly redirectUri: string;
  readonly redirectTo: string;
}

export function readChatGptLoginPending(cookies: Cookies): ChatGptLoginPending | null {
  const raw = cookies.get(CHATGPT_LOGIN_COOKIE);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<ChatGptLoginPending>;
    if (
      typeof parsed.state === 'string' &&
      typeof parsed.verifier === 'string' &&
      typeof parsed.redirectUri === 'string' &&
      typeof parsed.redirectTo === 'string'
    ) {
      return parsed as ChatGptLoginPending;
    }
  } catch {
    // fall through
  }

  return null;
}

export function clearChatGptLoginPending(cookies: Cookies, secure: boolean): void {
  cookies.delete(CHATGPT_LOGIN_COOKIE, { path: '/', secure });
}
