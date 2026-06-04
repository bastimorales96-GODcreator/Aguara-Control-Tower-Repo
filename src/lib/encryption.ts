/**
 * AES-256-GCM envelope encryption for connector credentials.
 *
 * The ENCRYPTION_KEY env var must be a 64-char hex string (32 bytes).
 * Generate one with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 *
 * Ciphertext format (base64-encoded):
 *   [12-byte IV][16-byte auth tag][N-byte ciphertext]
 */

import { createCipheriv, createDecipheriv, randomBytes } from "crypto"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 12   // 96-bit IV — recommended for GCM
const TAG_LENGTH = 16  // 128-bit auth tag

function getMasterKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY
  if (!hex || hex.length !== 64) {
    throw new Error(
      "ENCRYPTION_KEY must be a 64-char hex string (32 bytes). " +
      "Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    )
  }
  return Buffer.from(hex, "hex")
}

/**
 * Encrypts a plaintext string and returns a base64-encoded ciphertext.
 */
export function encryptCredential(plaintext: string): string {
  const key = getMasterKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH })

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()

  // Encode as: iv || tag || ciphertext
  return Buffer.concat([iv, tag, encrypted]).toString("base64")
}

/**
 * Decrypts a base64-encoded ciphertext produced by encryptCredential.
 */
export function decryptCredential(ciphertext: string): string {
  const key = getMasterKey()
  const buf = Buffer.from(ciphertext, "base64")

  const iv  = buf.subarray(0, IV_LENGTH)
  const tag = buf.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH)
  const enc = buf.subarray(IV_LENGTH + TAG_LENGTH)

  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH })
  decipher.setAuthTag(tag)

  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8")
}

/**
 * Safely encrypts a credential object (any JSON-serialisable value).
 * Useful for storing a full token set (access_token + refresh_token + expiry).
 */
export function encryptJSON(data: unknown): string {
  return encryptCredential(JSON.stringify(data))
}

export function decryptJSON<T = unknown>(ciphertext: string): T {
  return JSON.parse(decryptCredential(ciphertext)) as T
}
