// src/lib/crypto.js
import crypto from "crypto";

const MASTER_KEY_BASE64 = process.env.MASTER_KEY_BASE64;
if (!MASTER_KEY_BASE64) {
  throw new Error("MASTER_KEY_BASE64 missing in .env");
}
const MASTER_KEY = Buffer.from(MASTER_KEY_BASE64, "base64");
if (MASTER_KEY.length !== 32) {
  throw new Error("MASTER_KEY_BASE64 must decode to 32 bytes");
}

export function genToken() {
  // Node 18+ supports base64url
  return crypto.randomBytes(32).toString("base64url");
}

export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function encrypt(plaintext) {
  const iv = crypto.randomBytes(12);               // 96-bit IV for GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", MASTER_KEY, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    algorithm: "AES-256-GCM"
  };
}

export function decrypt({ ciphertext, iv, tag }) {
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    MASTER_KEY,
    Buffer.from(iv, "base64")
  );
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  const plain = Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64")),
    decipher.final()
  ]);
  return plain.toString("utf8");
}
