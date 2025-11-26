// src/lib/crypto.js
import crypto from "crypto";



export function genToken() {
  // Node 18+ supports base64url
  return crypto.randomBytes(32).toString("base64url");
}

export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}




