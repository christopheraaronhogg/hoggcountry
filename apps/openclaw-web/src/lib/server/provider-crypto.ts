import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import type { WorkspaceEncryptedSecret } from '$lib/server/workspace-store';

const DEV_SECRET = 'hoggcountry-dev-provider-secret-change-me';

function providerSecretKey(): Buffer {
  const configured = process.env.OPENCLAW_PROVIDER_SECRET || process.env.HOGGCOUNTRY_PROVIDER_SECRET;

  if (configured && configured.trim().length >= 16) {
    return createHash('sha256').update(configured).digest();
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('OPENCLAW_PROVIDER_SECRET is required in production.');
  }

  return createHash('sha256').update(DEV_SECRET).digest();
}

export function encryptProviderJson(value: unknown): WorkspaceEncryptedSecret {
  const iv = randomBytes(12);
  const key = providerSecretKey();
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const plaintext = Buffer.from(JSON.stringify(value), 'utf8');
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    version: 1,
    algorithm: 'aes-256-gcm',
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    ciphertext: ciphertext.toString('base64')
  };
}

export function decryptProviderJson<T>(payload: WorkspaceEncryptedSecret | null | undefined): T | null {
  if (!payload) return null;

  const key = providerSecretKey();
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(payload.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(payload.tag, 'base64'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, 'base64')),
    decipher.final()
  ]);

  return JSON.parse(plaintext.toString('utf8')) as T;
}
