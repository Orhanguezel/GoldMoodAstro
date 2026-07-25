import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { env } from "./env";

const VERSION = "v1";

function masterKey(): Buffer {
  const raw = env.TENANT_SECRETS_MASTER_KEY.trim();
  if (!/^[a-f0-9]{64}$/i.test(raw)) {
    throw new Error("TENANT_SECRETS_MASTER_KEY eksik veya gecersiz (64 hex karakter olmali)");
  }
  return Buffer.from(raw, "hex");
}

export function encryptSecret(plainText: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", masterKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    VERSION,
    iv.toString("base64"),
    tag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
}

export function decryptSecret(payload: string): string {
  const [version, ivB64, tagB64, encryptedB64] = payload.split(":");
  if (version !== VERSION || !ivB64 || !tagB64 || !encryptedB64) {
    throw new Error("Sifreli secret formati gecersiz");
  }
  const decipher = createDecipheriv("aes-256-gcm", masterKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
