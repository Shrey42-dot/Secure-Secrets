// src/routes/secret.js
import express from "express";
import Secret from "../models/Secret.js";
import { genToken, hashToken, encrypt, decrypt } from "../lib/crypto.js";

const router = express.Router();
const MAX_SECRET_LENGTH = 10 * 1024; // 10 KB

router.post("/", async (req, res) => {
  try {
    const { secret, ttl_seconds = 3600 } = req.body;
    if (!secret || typeof secret !== "string") {
      return res.status(400).json({ error: "Missing or invalid secret" });
    }
    if (secret.length > MAX_SECRET_LENGTH) {
      return res.status(400).json({ error: "Secret too large" });
    }

    const token = genToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + ttl_seconds * 1000);

    const encrypted = encrypt(secret);

    await Secret.create({
      token_hash: tokenHash,
      ciphertext: encrypted.ciphertext,
      iv: encrypted.iv,
      tag: encrypted.tag,
      algorithm: encrypted.algorithm,
      expires_at: expiresAt
    });

    res.status(201).json({ token });
  } catch (err) {
    console.error("create error:", err);
    res.status(500).json({ error: "internal_error" });
  }
});

router.get("/:token", async (req, res) => {
  try {
    const token = req.params.token;
    const tokenHash = hashToken(token);

    // Atomic: fetch and delete
    const doc = await Secret.findOneAndDelete({ token_hash: tokenHash });
    if (!doc) return res.status(410).json({ error: "gone_or_invalid" });

    const plaintext = decrypt({
      ciphertext: doc.ciphertext,
      iv: doc.iv,
      tag: doc.tag
    });

    res.set("Cache-Control", "no-store");
    res.json({ secret: plaintext });
  } catch (err) {
    console.error("retrieve error:", err);
    res.status(500).json({ error: "internal_error" });
  }
});

export default router;
